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
- **TODO — DECISION REQUIRED:** Cheat resistance. `question_options.is_correct`
  is currently readable by anyone who can read the question, which is fine for
  practice and not fine if placement ever gates something valuable. See
  [DATABASE.md](./DATABASE.md#known-gaps).
