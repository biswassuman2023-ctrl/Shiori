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

- **TODO — DECISION REQUIRED:** What completes a lesson — reaching the end, or
  an accuracy threshold? `user_curriculum_progress.score` supports the second;
  nothing sets it.
- **TODO — DECISION REQUIRED:** When are SRS cards created — on first exposure
  within a lesson, or on lesson completion? This is the first question the
  Hiragana vertical slice will have to answer.
