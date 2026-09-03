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

## Algorithm: FSRS — decided, not yet implemented

**Decided:** the scheduler will be FSRS (Free Spaced Repetition Scheduler),
not SM-2.

The schema was, and remains, deliberately algorithm-agnostic: the columns
above are the ones _every_ mainstream scheduler needs, and anything specific
to one lives in `scheduler_state` (jsonb) — for FSRS, that means per-card
stability and difficulty. Choosing FSRS now required no migration, and
changing the choice later still would not.

Why FSRS over SM-2: measurably better accuracy, at the cost of wanting a
corpus of real review data to fit its parameters against — data that does not
exist until reviews start happening. Because `srs_reviews` is a complete,
append-only log from day one, that ordering is not a problem: FSRS's default
parameters are a reasonable starting point, and can be refit against real
`srs_reviews` history once enough of it exists, with no reset for existing
learners.

**The scheduler itself is not implemented.** It will be a pure module —
`(card, rating, now) → next card state` — with no database access of its own,
so it is testable in isolation and swappable. `srs_cards.scheduler` stays
`'unset'`, and no code path advances a card's `due_at`, `interval_days`,
`state` or any other scheduling column yet. This document records the
decision so the review engine has somewhere to start from, not an
implementation of it.

**Card creation is implemented**, as of the Hiragana vertical slice — see
"Card creation" below and `src/lib/lesson-progress/srs.ts`. Creating a card
in `state: 'new'`, due immediately, needs none of FSRS's parameters; only
_advancing_ a card after a review does, which is why creation could ship
ahead of the scheduler without creating cards the scheduler can't later pick
up correctly.

## Card creation

The general rule, independent of any specific item type:

> **A card is created after the learner completes meaningful practice on an
> item — not merely when the item is displayed.**

Seeing a kana character rendered in a lesson block is not evidence the learner
did anything with it; answering a question about it is. Creating cards on
display would seed the review queue with items the learner never actually
engaged with, which is a worse first review experience than creating the card
slightly later, after real practice.

"Meaningful practice" is intentionally defined at the block/question level via
`user_curriculum_progress.progress_state` (see
[LEARNING-ENGINE.md](./LEARNING-ENGINE.md#lesson-completion)) rather than as a
separate SRS-specific concept — a question the lesson engine already counts as
_completed_ is the same event that should trigger card creation.

### The Hiragana vertical slice, specifically

For the first slice, exactly **two** review directions are created per kana
item once it has been meaningfully practised:

| Direction (product term) | `srs_direction` value | What the learner is shown | What they produce   |
| ------------------------ | --------------------- | ------------------------- | ------------------- |
| Character → sound        | `recognition`         | The kana glyph (あ)       | Its sound / reading |
| Sound → character        | `recall`              | Audio, or the reading     | The kana glyph      |

**Not created yet:** a writing-production direction (drawing or typing the
character from memory). The `srs_direction` enum can gain a value for it later
(`alter type ... add value`) without touching existing cards, and
`srs_cards`'s unique constraint is already `(user_id, item_id, direction)` —
adding a third direction is a new row per existing item, not a schema change.

This mapping is specific to kana. `recognition` and `recall` are deliberately
generic names (not `kana_to_sound` / `sound_to_kana`) because the same two
directions apply, with the same meaning — "given the target, produce what it
maps to" vs. "given what it maps to, produce the target" — to vocabulary and
kanji later. `listening` is reserved for dedicated listening-comprehension
content (`listening_lessons`), not reused here for "hear a sound, produce a
character" — conflating the two would make `listening` mean two different
things depending on content type.

A card represents **this learner's review relationship with one content item
in one direction** — not the item itself, and not the lesson it was learned
in. The same kana item's two cards can be at completely different points in
their schedules, and that is the intended behaviour, not an edge case to
special-case around.

### Still open

- **TODO — DECISION REQUIRED:** Are cards ever created outside a lesson — from
  free exploration, or from a diagnostic answer? Out of scope for the Hiragana
  slice, which only creates cards from lesson practice.
- **TODO — DECISION REQUIRED:** The direction set for vocabulary, kanji,
  grammar, reading and listening content, once each is built. Kana's mapping
  above is a template, not a precedent that automatically extends.

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
