# Spaced repetition

SRS answers one question: **what should this learner review today?**

It is deliberately independent of the curriculum. The curriculum is ordered and
shared; review is unordered and personal. They operate over the same
`content_items` but never over the same tables, and neither schedules the
other.

## Data model

### `srs_cards` — current state

One row per `(user, item, direction)`. One item yields several cards, because
recognising a word is not the same skill as recalling it.

| Column             | Purpose                                                    |
| ------------------ | ---------------------------------------------------------- |
| `direction`        | `recognition` / `recall` / `listening`                     |
| `state`            | `new` / `learning` / `review` / `relearning` / `suspended` |
| `due_at`           | When it next comes up                                      |
| `interval_days`    | Current interval                                           |
| `reps`, `lapses`   | Counters every algorithm needs                             |
| `last_reviewed_at` |                                                            |
| `scheduler_state`  | **Algorithm-specific parameters, as `jsonb`**              |
| `scheduler`        | Which algorithm produced this state                        |

### `srs_reviews` — the log

Append-only. One row per answer, recording the rating, the state before, the
intervals before and after, the elapsed time and the latency.

This is not analytics. It is the **evidence** a scheduler change would be
replayed from: with a complete log, switching algorithms means recomputing
everyone's schedule from their real history rather than resetting it. RLS
enforces append-only — a learner can insert and read, never update or delete.

## The algorithm is not chosen yet

**TODO — DECISION REQUIRED: SM-2 or FSRS.**

The schema is deliberately algorithm-agnostic. The columns above are the ones
_every_ mainstream scheduler needs; anything specific to one — FSRS's stability
and difficulty, SM-2's ease factor — lives in `scheduler_state`. The choice can
therefore be made, and later changed, without a migration.

Sketch of the trade-off, for when the decision is made:

|             | SM-2             | FSRS                               |
| ----------- | ---------------- | ---------------------------------- |
| Complexity  | Small, ~30 lines | Substantially larger               |
| Accuracy    | Adequate         | Better, measurably                 |
| Tuning      | Fixed constants  | Parameters fit to real review logs |
| Data needed | None             | A corpus of reviews to fit against |

FSRS wants data that does not exist yet; SM-2 needs none. Starting on SM-2 and
migrating later is viable **precisely because** `srs_reviews` is a complete
append-only log.

The scheduler will be a pure module — `(card, rating, now) → next card state` —
with no database access, so it is testable in isolation and swappable.

## Card creation

- **TODO — DECISION REQUIRED:** When is a card created? On first exposure in a
  lesson, or on lesson completion? The Hiragana slice forces this decision.
- **TODO — DECISION REQUIRED:** Which directions are created for which item
  types? A kana character plausibly needs `recognition` and `recall`; a
  listening lesson plausibly needs none.
- **TODO — DECISION REQUIRED:** Are cards ever created outside a lesson — from
  exploration, or from a diagnostic answer?

## Session behaviour

- **TODO — DECISION REQUIRED:** Daily review cap. Uncapped review is how
  learners quit; a cap needs a rule for what gets deferred.
- **TODO — DECISION REQUIRED:** Ordering within a session — due-first, mixed,
  or interleaved by skill.
- **TODO — DECISION REQUIRED:** What happens to overdue cards after a long
  absence. The classic failure is 800 due cards on return.
- **TODO — DECISION REQUIRED:** Are new cards introduced during review, or only
  in lessons?

## Day boundaries

`profiles.timezone` and `profiles.day_start_hour` (default 04:00 local) exist
so "due today" means the learner's day, not UTC. Someone studying at 1am should
not roll over mid-session.

Nothing reads these columns yet.

## Query shape

The every-visit `/review` query is:

```sql
select * from srs_cards
where user_id = auth.uid() and due_at <= now() and state <> 'suspended'
order by due_at
limit ?;
```

served by the partial index
`srs_cards_due_idx (user_id, due_at) where state <> 'suspended'`.

RLS restricts this to the learner's own rows automatically; the explicit
`user_id` predicate is there so the index is used, not for security.
