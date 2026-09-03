# Diagnostic and placement

This is how the product keeps its promise. "Learn Japanese from where you
actually are" is only true if the entry point is _measured_ rather than
self-reported.

## The flow

```
/onboarding  →  /diagnostic  →  /results  →  /placement  →  /home
   goals,        adaptive       what we      proposed
   pace,         assessment     found,       starting
   exposure                     per skill    point
```

Each step is a route in the `(onboarding)` route group. All four are
placeholders today.

## Vocabulary

- **Diagnostic** — the assessment. Asks questions, estimates ability.
- **Placement** — the decision. Turns those estimates into a position on the
  fixed ladder.

They are separate because a diagnostic can inform more than a placement
(reinforcement, initial mastery), and a placement can come from more than a
diagnostic (a learner who says "start me at the beginning").

## Data model

| Table                  | Holds                                                                             |
| ---------------------- | --------------------------------------------------------------------------------- |
| `assessment_tests`     | Test definitions. `is_adaptive` distinguishes fixed forms from runtime selection. |
| `assessment_questions` | Question list for fixed-form tests. Empty for adaptive ones.                      |
| `assessment_attempts`  | One learner's run. `state` carries running adaptive state.                        |
| `assessment_answers`   | One row per answer. Append-only.                                                  |
| `placement_results`    | The decision: level, unit, lesson, confidence, rationale.                         |

`placement_results` is a **history**, not a column on `profiles`. A learner may
be re-placed later, and the reasoning behind each decision must survive.

`rationale` is structured per-skill evidence, so `/results` can _explain_ what
was found rather than assert a level. A learner told "you're N4" without
evidence has no reason to believe it.

## Respecting the learner

`placement_results.accepted_at` exists because placement is a **proposal**. A
learner who is placed at N4 but wants to start at N5 should be allowed to. The
promise is meeting people where they are, not overruling them.

## Security architecture

Two boundaries here are decided and enforced at the database level, ahead of
either the diagnostic algorithm or the assessment engine existing. Both are
documented in full in [DATABASE.md](./DATABASE.md#security-model); this is the
shape as it affects the diagnostic flow specifically.

### Placement results are not client-writable

A `placement_results` row is the system's conclusion about a learner, not the
learner's own data — closer to a receipt than a preference. `profiles` and
`user_progress` are RLS-gated on `auth.uid() = user_id`, which is the right
shape for "the learner may write their own record of their own activity". It
is the _wrong_ shape for "the learner may write a row only if a diagnostic
algorithm actually produced it" — RLS cannot express that second condition,
because it has no way to know whether the row content is real.

So `placement_results` carries **select-own only**. Every write — creating a
placement from a completed `assessment_attempt`, and later recording
`accepted_at` when the learner accepts it — runs as trusted server-side code:
a Server Action or Route Handler that calls `getUser()`, validates the attempt
belongs to the caller and is actually complete, and only then writes with the
service-role client. The service-role key never reaches the browser. See
`src/lib/supabase/admin.ts` and DATABASE.md § "Placement results".

**Not implemented yet.** This closes the write path before the diagnostic
engine exists to use it, rather than after.

### Gated question evaluation

Practice questions and gated (placement/diagnostic) questions are graded
differently, on purpose:

|                                               | Practice question                                                                  | Gated question                                           |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `questions.is_gated`                          | `false`                                                                            | `true`                                                   |
| Client can read `question_options.is_correct` | yes                                                                                | **no — RLS denies it**                                   |
| Grading happens                               | client-side, from the options already fetched                                      | server-side, from a response the client submits          |
| Rationale                                     | already visible in the network tab of any client-side quiz; hiding it buys nothing | the whole point of a diagnostic is an honest measurement |

For a gated question, `question_options` has no RLS policy that admits its
rows to any client-facing role — the client genuinely cannot see the answer
key, not merely "is asked not to".

**Intended architecture** for the evaluation boundary (not built — no
assessment engine exists to call it yet):

1. The client submits `{ attemptId, questionId, response }` to a single,
   narrow server-side entry point (a Route Handler or Server Action).
2. That handler calls `getUser()`, confirms the attempt belongs to the caller
   and is `in_progress`, then reads `question_options` for that question using
   the service-role client (the one path permitted to see gated answers).
3. It grades the response, writes one row to `assessment_answers` (append-only
   — see DATABASE.md), and returns **only the verdict** — correctness and,
   optionally, an explanation — never the option rows themselves.
4. Nothing else in the codebase is permitted to read a gated question's
   options with elevated access. One entry point, so the boundary stays
   auditable — resist adding a second "just this once" path later.

This mirrors the placement-write boundary above: RLS closes the door
(`is_gated = false` required to read), and a single trusted server-side
function is the only key.

## Open questions

Nearly everything here is unspecified. It is recorded rather than guessed.

### The assessment itself

- **TODO — DECISION REQUIRED:** What algorithm? Options range from a simple
  branching ladder (start at N5, move up or down on a run of right or wrong
  answers) to full item-response theory. IRT needs calibrated item difficulty,
  which needs response data, which does not exist yet.
- **TODO — DECISION REQUIRED:** How long? Length trades accuracy against the
  number of people who finish it. This is a product decision, not a technical
  one.
- **TODO — DECISION REQUIRED:** Which skills are tested? Testing all seven is
  thorough and long. Testing only vocabulary and kanji is fast and partial.
- **TODO — DECISION REQUIRED:** Stopping rule — fixed length, or confidence
  threshold?
- **TODO — DECISION REQUIRED:** Can a learner skip the diagnostic? A complete
  beginner arguably should — they know they are starting at Hiragana. The
  onboarding answers could route around it.

### Placement

- **TODO — DECISION REQUIRED:** How ability estimates map to a rung of the
  ladder. Per-skill results will disagree: N4 grammar, N5 kanji. Which wins?
  Placing at the weakest skill is safe and can feel patronising; placing at the
  strongest is flattering and leaves gaps.
- **TODO — DECISION REQUIRED:** Placement granularity — level, unit, or lesson?
  All three columns exist on `placement_results`.
- **TODO — DECISION REQUIRED:** What happens to skipped material. A learner
  placed at N3 never saw N5 and N4 lessons. Are those items assumed known,
  marked unknown, or seeded as SRS cards for verification?

### Mechanics

- **TODO — DECISION REQUIRED:** Does the diagnostic require an account, or can
  it run anonymously and attach at signup? This changes the onboarding layout
  and whether `assessment_attempts` needs a nullable `user_id`.
- **TODO — DECISION REQUIRED:** Can a learner retake it, and how often?
- ~~Cheat resistance.~~ **Resolved** — see "Security architecture" above. The
  security boundary (`is_gated`, RLS, the single evaluation entry point) is
  decided; the evaluation function itself is not built, since there is no
  assessment engine yet to submit a gated answer from.
