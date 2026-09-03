# Product

## The promise

> **Learn Japanese from where you actually are.**

Most Japanese courses assume you are starting from zero, or ask you to
self-report a level and then trust the answer. This product does neither. It
measures, places, and then teaches forward from that point.

## The curriculum is fixed

The progression is sequential and does not vary between learners:

```
Hiragana → Katakana → JLPT N5 → JLPT N4 → JLPT N3 → JLPT N2 → JLPT N1
```

Nothing about this ladder is personalised. What changes per learner is **where
they enter it** and **what they are asked to revisit**.

## Where personalisation lives

| Mechanism            | What it personalises                                  |
| -------------------- | ----------------------------------------------------- |
| Onboarding           | Goals, pace, prior exposure                           |
| Diagnostic placement | Entry point on the fixed ladder                       |
| Skill-level tracking | Which skills are ahead of or behind the current level |
| Reinforcement        | What gets re-taught when a skill lags                 |
| SRS review           | What is due today                                     |

## Curriculum and SRS are different systems

This distinction runs through the whole codebase and is worth stating plainly:

- **Curriculum** answers _"what should this learner learn next?"_ — it is
  ordered, shared by everyone, and stored in `levels → units → lessons`.
- **SRS** answers _"what should this learner review today?"_ — it is unordered,
  entirely personal, and stored in `srs_cards`.

They operate over the same content items but never over the same tables, and
neither one drives the other's scheduling. See [SRS.md](./SRS.md).

## Scope

The application is intended to eventually support:

- Hiragana
- Katakana
- Vocabulary
- Kanji
- Grammar
- Reading
- Listening
- SRS review
- Adaptive diagnostic
- Placement
- Skill mastery tracking
- Immersion / exploration

These are built incrementally. The architecture supports all of them from the
start; the implementation does not.

## Build order

1. **Foundation** — repository, database schema, security, design tokens,
   routing skeleton. _(current phase)_
2. **First vertical slice** — Hiragana あいうえお, end to end: sign up →
   onboarding → learn → hear → practise → complete → save progress → create
   review cards → review later.
3. Everything else, one skill at a time.

## Open product questions

These are unspecified. They are recorded here rather than guessed at.

- **TODO — DECISION REQUIRED:** Is there an anonymous/trial mode, or is an
  account required before onboarding?
- **TODO — DECISION REQUIRED:** Monetisation. Free, paid, freemium? This
  affects the data model (entitlements) if it lands late.
- **TODO — DECISION REQUIRED:** Are streaks, XP or other engagement mechanics
  part of the product? The design direction explicitly rejects a Duolingo-like
  feel, but `profiles.day_start_hour` exists because streaks are plausible.
- **TODO — DECISION REQUIRED:** Is content translated for non-English speakers?
  `profiles.ui_locale` exists but nothing reads it.
- **TODO — DECISION REQUIRED:** Does the learner see the JLPT framing directly
  ("N5"), or a friendlier label with JLPT as a subtitle?
