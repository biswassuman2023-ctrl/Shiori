# Curriculum

## The ladder

Fixed, sequential, identical for every learner:

| #   | Level    | Code       |
| --- | -------- | ---------- |
| 1   | Hiragana | `hiragana` |
| 2   | Katakana | `katakana` |
| 3   | JLPT N5  | `n5`       |
| 4   | JLPT N4  | `n4`       |
| 5   | JLPT N3  | `n3`       |
| 6   | JLPT N2  | `n2`       |
| 7   | JLPT N1  | `n1`       |

Note the ordering trap: JLPT numbers descend as difficulty rises. N5 is the
easiest. The code never compares level codes as strings or numbers — it uses
`levelPosition()` and `isLevelBefore()` from `src/types/domain.ts`, which are
tested against exactly this table.

The seven rows are seeded by
`supabase/migrations/20260904001100_curriculum.sql`. They are structure, not
content: the ladder is a product decision and does not vary.

## Structure

```
level  ──▶ unit  ──▶ lesson  ──▶ lesson_content (blocks)
```

- **Level** — one rung of the ladder. Seven, fixed.
- **Unit** — a coherent group within a level (e.g. "The gojūon", "Numbers and
  counting"). Ordered by `position` within its level.
- **Lesson** — a single sitting. Ordered by `position` within its unit. Carries
  a `primary_skill`: lessons may touch several skills, but one is the reason
  the lesson exists.
- **Block** — one renderable unit of lesson content. See
  [LEARNING-ENGINE.md](./LEARNING-ENGINE.md).

Ordering is enforced by `unique (parent_id, position)` at each level, so two
lessons cannot silently claim the same slot.

## What is personalised

Nothing about the ladder itself. Per learner, three things vary:

1. **Entry point** — set by placement. See [DIAGNOSTIC.md](./DIAGNOSTIC.md).
2. **Reinforcement** — a lagging skill can inject earlier material without
   moving the learner backwards. See [LEARNING-ENGINE.md](./LEARNING-ENGINE.md).
3. **Review** — entirely separate. See [SRS.md](./SRS.md).

## URL shape

```
/learn                                  the ladder
/learn/[level]                          e.g. /learn/hiragana
/learn/[level]/[unit]                   e.g. /learn/hiragana/gojuon
/learn/[level]/[unit]/[lesson]          e.g. /learn/hiragana/gojuon/a-i-u-e-o
```

Segments are slugs, not ids: `units.slug` is unique per level and
`lessons.slug` is unique per unit. URLs stay readable and stable while content
ids change.

## Progress

`user_curriculum_progress` holds one row per lesson the learner has touched
(`not_started` / `in_progress` / `completed`). Unit and level completion are
**derived** from those rows, never stored, so the two can never disagree.

## Open questions

- **TODO — DECISION REQUIRED:** Must a lesson be completed to unlock the next
  one, or is the whole level open once entered?
- ~~What counts as "completed"?~~ **Resolved** — see
  [LEARNING-ENGINE.md](./LEARNING-ENGINE.md#lesson-completion). Every required
  block viewed and every required question answered correctly at least once;
  no accuracy threshold, no permanent block on a wrong answer.
- **TODO — DECISION REQUIRED:** Can a learner move to the next level with
  unfinished lessons behind them?
- **TODO — DECISION REQUIRED:** The unit breakdown for each of the seven
  levels. No units or lessons are authored yet.
- **TODO — DECISION REQUIRED:** Do Hiragana and Katakana interleave (learn both
  あ and ア together) or run strictly in sequence? The ladder says sequential;
  confirm that is pedagogically intended.
