# Learning engine

The learning engine decides **what a learner should do next**, and turns a
lesson row into something on screen. It is not built yet. This document records
the architecture it must fit into.

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

`src/content/registry.ts` — built, tested, and currently empty of renderers.

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

## Planned renderers

| Block type   | Renderer          | Presents                                 |
| ------------ | ----------------- | ---------------------------------------- |
| `prose`      | `ProseBlock`      | `ProseNode[]` from `props`               |
| `kana`       | `KanaBlock`       | kana items, stroke order, audio          |
| `vocabulary` | `VocabularyBlock` | vocabulary items with furigana and audio |
| `kanji`      | `KanjiBlock`      | kanji items, readings, components        |
| `grammar`    | `GrammarBlock`    | a grammar point with examples            |
| `reading`    | `ReadingBlock`    | a passage, sentence by sentence          |
| `listening`  | `ListeningBlock`  | an audio lesson with segments            |
| `question`   | `QuestionBlock`   | a question and its options               |

None exists. They arrive with the vertical slice that needs them — `KanaBlock`
and `QuestionBlock` first.

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
