# Learning engine

The learning engine decides **what a learner should do next**, and turns a
lesson row into something on screen. The second half — rendering a lesson,
tracking its completion, creating SRS cards from practice — is built, for the
three block types the Hiragana slice uses. The first half — skill mastery and
reinforcement, deciding what a _struggling_ learner should see — is not.

## Two questions, two systems

| Question                    | System     | Storage                    |
| --------------------------- | ---------- | -------------------------- |
| What should I learn next?   | Curriculum | `levels → units → lessons` |
| What should I review today? | SRS        | `srs_cards`                |

Neither drives the other's scheduling. A lesson can _create_ review cards; a
review never advances curriculum position.

## The rendering pipeline

```
lessons
  └── lesson_content (ordered blocks)
        ├── block_type ──▶ src/content/registry.ts ──▶ renderer component
        ├── props       ──▶ renderer configuration
        └── lesson_content_items ──▶ content_items ──▶ kana / vocabulary / ...
```

The load-bearing rule:

> **A renderer is chosen by `block_type` and by nothing else.**

Not by lesson slug, not by level code, not by unit. This is what keeps
curriculum in the database and out of React, and it is why adding a lesson
never requires a deploy.

```tsx
// ✗ never
if (lesson.slug === "n5-introduction") return <N5Intro />;

// ✓ always
const Renderer = getBlockRenderer(block.type);
```

## The registry

`src/content/registry.ts` — built and tested. Three renderers are registered;
see "Renderers" below for which, and which aren't yet.

```ts
registerBlockRenderer("vocabulary", VocabularyBlock);
const Renderer = getBlockRenderer(block.type); // undefined if unregistered
```

- Duplicate registration **throws**. Two components claiming one block type is
  always a bug, and silently keeping one would make the winner depend on import
  order.
- An unregistered type returns `undefined` rather than throwing. Content is
  deployed independently of code and will sometimes run ahead of it; a lesson
  containing a block this build cannot draw should **skip the block and keep
  the lesson**, not fail the page.

## Renderers

| Block type   | Renderer          | Presents                                   | Status    |
| ------------ | ----------------- | ------------------------------------------ | --------- |
| `prose`      | `ProseBlock`      | `ProseNode[]` from `props`                 | Built     |
| `kana`       | `KanaBlock`       | kana items, mnemonic, audio if available   | Built     |
| `question`   | `QuestionBlock`   | a multiple-choice question and its options | Built     |
| `vocabulary` | `VocabularyBlock` | vocabulary items with furigana and audio   | Not built |
| `kanji`      | `KanjiBlock`      | kanji items, readings, components          | Not built |
| `grammar`    | `GrammarBlock`    | a grammar point with examples              | Not built |
| `reading`    | `ReadingBlock`    | a passage, sentence by sentence            | Not built |
| `listening`  | `ListeningBlock`  | an audio lesson with segments              | Not built |

The three built renderers live in `src/components/lesson/blocks/`, registered
by `src/components/lesson/register-blocks.ts` — imported once, from the
_client_ lesson player (`lesson-player.tsx`), not the server route. Server and
Client Components run in separate module graphs in Next.js; `getBlockRenderer`
is only ever called from client code, so that is the only place registration
can usefully happen.

Every renderer receives an already-resolved `LessonBlockData` (its content
items and question, if any, populated by `src/services/lessons.ts`) — a
renderer never looks anything up itself, keeping it a pure, easily-tested
presentational component. `QuestionBlock` is the one exception that needs to
report _back_ to the lesson player (an answer, and whether this question was
already completed on an earlier visit); it does that through
`LessonInteractionContext` rather than an addition to every renderer's props,
so the "every renderer gets exactly `{ block }`" contract stays true for the
renderers that don't need it.

`question_type` support today: `multiple_choice` only, since that is the only
type the Hiragana slice's content uses. `text_input`, `audio_choice`,
`matching` and `ordering` are modelled in the database
(`supabase/migrations/20260904001000_questions.sql`) but have no renderer.

## Adding a lesson format

1. Add the value to the `lesson_block_type` enum (a migration).
2. Add it to `LESSON_BLOCK_TYPES` in `src/types/domain.ts`.
   (`src/types/domain.test.ts` fails if you forget.)
3. Write the renderer.
4. Register it.

No page or lesson component changes. If a step 5 appears, the boundary has been
broken.

## Skill mastery

`user_skill_mastery` holds one row per `(user, skill, level)` with a `mastery`
estimate and a `confidence` in that estimate. "Good at N5 vocabulary" and "good
at N3 vocabulary" are different claims and are stored separately.

Placement writes the first estimates; ongoing answers refine them.

- **TODO — DECISION REQUIRED:** How mastery is computed from evidence. Nothing
  writes these columns yet.
- **TODO — DECISION REQUIRED:** How confidence decays with time.

## Reinforcement

The product calls for reinforcement when a skill lags. The data exists to
detect it (`user_skill_mastery`, `user_progress`); the policy does not.

- **TODO — DECISION REQUIRED:** What triggers reinforcement, and what does it
  do — inject a block into the next lesson, insert a whole lesson, or queue
  extra SRS cards? The three have different consequences for curriculum
  position.
- **TODO — DECISION REQUIRED:** Can reinforcement move a learner _backwards_ on
  the ladder, or only sideways?

## Lesson completion

**Decided**, for the Hiragana vertical slice and as the general model going
forward.

### The rule

A lesson is complete when:

1. every **required** block has been viewed or interacted with, and
2. every **required** question has been **successfully completed**.

"Required" is `lesson_content.is_required` (default `true`) — an author can
mark a block optional (a supplementary aside), but nothing is optional unless
marked so.

**No accuracy threshold, and no permanent block on a wrong answer.**
`user_curriculum_progress.score` remains available for a _reading_ of overall
accuracy, but it does not gate completion. A required question is "successfully
completed" the first time it is answered correctly — however many attempts
that takes. Getting something wrong produces feedback and an opportunity to
retry; it never locks the lesson. This is a product stance, not just an
implementation default: a lesson that can be permanently blocked by one
mistake punishes the exact moment a learner is engaging most closely with
something they don't yet know.

### What "interacted with" means per block type

- **Non-question blocks** (`prose`, `kana`, `vocabulary`, `kanji`, `grammar`,
  `reading`, `listening`) are satisfied by _presentation_ — the block was
  reached and shown. There is nothing to get right or wrong about reading a
  card or hearing an audio clip.
- **`question` blocks** are satisfied only by a **correct** response, per the
  rule above. Reaching a question is not the same as completing it.

### Persistence

Progress is stored in `user_curriculum_progress.progress_state`
(`jsonb`, added by `20260904002000_lesson_progress_state.sql`), shaped as
`LessonProgressState` in `src/types/content.ts`:

```ts
type LessonProgressState = {
  completedBlockIds: string[]; // satisfied non-question blocks
  questions: Record<
    string, // lesson_content.question_id
    { attempts: number; completed: boolean; lastAnsweredAt: string }
  >;
};
```

- Written incrementally, as each block or question is satisfied — not only at
  the end of the lesson. This is what makes refresh/close-tab safe: on reload,
  the lesson player reads `progress_state` back and resumes at the first
  unsatisfied required block, rather than the start.
- `questions[id].completed` only ever transitions `false → true`. A later
  wrong answer on an already-completed question (e.g. the learner revisits it)
  must not regress it — that would make the lesson "un-complete" itself, which
  is not a state the product wants.
- `user_curriculum_progress.status` is derived from `progress_state` against
  the lesson's required blocks, not tracked independently of it: `not_started`
  while `progress_state` is empty, `in_progress` once any block or question
  has been satisfied, `completed` once every required block and question has.
  The existing check constraint
  (`(status = 'completed') = (completed_at is not null)`) still holds —
  `completed_at` is stamped exactly when that derivation flips to `completed`.
- Storage is deliberately jsonb rather than a normalised child table: this is
  read back whole, for one lesson, for one learner, to resume a session — never
  queried across learners or lessons. See DATABASE.md § "Lesson content" for
  the reasoning.

### SRS interaction

Card creation is a _consequence_ of the same event that marks a question
`completed`, not a separate trigger the lesson engine has to track twice — see
[SRS.md](./SRS.md#card-creation): a card is created after meaningful practice,
which for a lesson question is exactly the moment
`questions[id].completed` first flips to `true`.

### Still open

- **TODO — DECISION REQUIRED:** Can a learner move to the next unit or level
  with some lessons still `in_progress` (started but not completed)? Not
  needed to build the Hiragana slice, since it is one lesson.
- **TODO — DECISION REQUIRED:** Does leaving a lesson mid-way and returning
  count as a new `attempts` increment on `user_curriculum_progress`, or only a
  wrong answer on a question does? `attempts` exists on the table; its exact
  semantics are not yet pinned down.
