# Database

PostgreSQL 17, managed by Supabase. All migrations live in
`supabase/migrations/` and are applied in filename order.

## Principles

1. **Content and learner state never mix.** No table contains both.
2. **Content is referenced, never copied.** A vocabulary entry exists once and
   is pointed at by every lesson, question and SRS card that uses it.
3. **Row Level Security is the security boundary**, not the application.
4. **Constraints belong in the database.** If a rule can be a `check`, a
   `unique` or a foreign key, it is one.

## Schema map

```
content_sources ──┐
media_assets ─────┤
                  ▼
            content_items ──┬── kana
            (identity)      ├── vocabulary ──┬── vocabulary_examples
                            │                └── vocabulary_kanji ──┐
                            ├── kanji ◀───────────────────────────── ┘
                            │     └── kanji_components
                            ├── grammar_points ──┬── grammar_examples
                            │                    └── grammar_relations
                            ├── reading_passages ── reading_sentences
                            └── listening_lessons ── listening_segments

levels ── units ── lessons ── lesson_content ── lesson_content_items ──▶ content_items
                                    └──▶ questions ── question_options

profiles                       (learner)
user_progress                  ──▶ content_items
user_curriculum_progress       ──▶ lessons
user_skill_mastery
srs_cards                      ──▶ content_items
srs_reviews                    ──▶ srs_cards
assessment_tests ── assessment_questions ──▶ questions
assessment_attempts ── assessment_answers
placement_results
```

## Content item model

Every learnable thing — a kana character, a word, a kanji, a grammar point, a
passage, a listening lesson — has a row in `content_items` carrying its
identity: id, type, slug, publication status, source.

Type-specific columns live in a 1:1 extension table (`kana`, `vocabulary`, …)
keyed by `item_id`.

**Why.** Five tables need to reference "some content, we don't care which
kind": `lesson_content_items`, `srs_cards`, `user_progress`, `questions`, and
eventually recommendation. The alternatives were:

- _Nullable foreign key per type_ — six nullable columns on each of five
  tables, with no way to enforce that exactly one is set.
- _Untyped `(item_type, item_id)` pair_ — no referential integrity at all;
  a deleted word leaves dangling SRS cards.

Class-table inheritance gives one foreign-key target and real integrity. The
type is pinned by a composite foreign key:

```sql
item_type content_item_type not null default 'vocabulary'
  check (item_type = 'vocabulary'),
foreign key (item_id, item_type)
  references content_items (id, item_type) on delete cascade
```

so a `vocabulary` row can never attach itself to a `kanji` identity.

**Cost.** Reading a full item needs a join. That is the trade accepted.

## Lesson content

`lesson_content` is an ordered list of **blocks**, one row per block:

| Column        | Meaning                                                          |
| ------------- | ---------------------------------------------------------------- |
| `block_type`  | Selects the renderer. Never inferred from the lesson.            |
| `props`       | Renderer configuration, and the body of `prose` blocks.          |
| `question_id` | Only for `question` blocks; enforced by a check constraint.      |
| `is_required` | Whether this block must be satisfied for the lesson to complete. |

The items a block presents are in `lesson_content_items`, ordered. It is a join
table because one block can teach several items — a kana block presents あいうえお
as a set, not as five blocks.

Per-learner completion of each block is tracked separately, in
`user_curriculum_progress.progress_state` — see
[LEARNING-ENGINE.md](./LEARNING-ENGINE.md) ("Lesson completion") for the full
model and why it lives in the progress table rather than here.

## Deviations from the originally proposed table list

| Proposed                        | Built                                           | Why                                                                                                                                                                 |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audio_assets`, `kanji_strokes` | `media_assets`                                  | Both are "reference a file in Supabase Storage". One table, a `kind` enum, no duplicated schema.                                                                    |
| —                               | `kana`                                          | Hiragana and Katakana are curriculum levels, so a kana character must be a content item. It is neither vocabulary (no meaning) nor kanji (different reading model). |
| `lesson_content`                | `lesson_content` + `lesson_content_items`       | A block presents a _set_ of items. Without the join table, teaching five kana would need five blocks.                                                               |
| —                               | `grammar_relations`                             | The brief called for "related grammar relationships where necessary". An edge list keeps "often confused with" out of component code.                               |
| `questions` + answer column     | `questions` + `question_options` for every type | Text-input answers are options with `is_correct`. Grading stays in one place instead of splitting between a column and a table.                                     |
| `content_sources`               | `content_sources`                               | Unchanged. Licence obligations are real; see [CONTENT-BIBLE.md](./CONTENT-BIBLE.md).                                                                                |

## Security model

Defined in `supabase/migrations/20260904001600_rls.sql`,
`..._storage.sql`, `..._placement_results_security.sql` and
`..._gated_questions.sql`. In one sentence:

> Published content is readable by everyone and writable by no one; learner
> state is readable and writable only by the learner it belongs to.

### Content tables

RLS enabled. A `select` policy admits rows whose `status = 'published'`.
Extension and child tables (`vocabulary_examples`, `reading_sentences`, …)
check their **parent's** status, so an unpublished draft cannot leak its body
through a side table.

**No `insert`, `update` or `delete` policy exists on any content table.** With
RLS enabled and no permissive policy for a command, Postgres denies that
command for every role that does not bypass RLS. Content writes therefore
happen only through the service-role key, used by ingestion scripts
(`src/lib/supabase/admin.ts`) and never by request-handling code.

### Learner-state tables

Every one is gated on `public.is_owner(user_id)`, which compares `user_id` to
`auth.uid()`.

| Table                      | Policy                                                                    |
| -------------------------- | ------------------------------------------------------------------------- |
| `profiles`                 | select / insert / update own. No delete — profiles die with `auth.users`. |
| `user_progress`            | full access to own rows                                                   |
| `user_curriculum_progress` | full access to own rows                                                   |
| `user_skill_mastery`       | full access to own rows                                                   |
| `srs_cards`                | full access to own rows                                                   |
| `srs_reviews`              | **append-only**: select + insert                                          |
| `assessment_attempts`      | full access to own rows                                                   |
| `assessment_answers`       | **append-only**: select + insert                                          |
| `placement_results`        | **select-only**. See "Placement results" below.                           |

`USING` and `WITH CHECK` are both specified on every write policy. `USING`
alone would let a learner update their own row _into_ someone else's by
changing `user_id`.

`srs_reviews` and `assessment_answers` are append-only because they are
evidence: the review log is what a future scheduler change would be replayed
from, and the answer log is what a placement decision rests on.

### Placement results

`placement_results` looks like ordinary learner state — it has a `user_id`,
RLS is enabled, it started with the same select/insert/update pattern as
`user_progress`. It isn't ordinary learner state, and
`20260904001800_placement_results_security.sql` removes the insert and update
policies to say so.

**The distinction:** everything else in the learner-state table above is the
learner's own record of their own activity — a review they did, an answer they
gave, a lesson they finished. A placement result is different: it is the
_system's conclusion_ about the learner, computed from a diagnostic. The
learner did not produce it; the diagnostic engine did. Letting the client
insert or update that row directly would let a learner fabricate their own
placement by writing to the table with the anon key, indistinguishable from a
real one.

**The boundary, exactly:**

- `placement_results` carries **select-own only**. No insert, update or delete
  policy exists for `authenticated` or `anon`. Per Postgres RLS semantics, an
  absent policy denies the command outright for every role that does not
  bypass RLS.
- Every write — computing a new placement from a completed diagnostic attempt,
  and a learner later accepting one (`accepted_at`) — happens through
  **trusted server-side code**: a Next.js Server Action or Route Handler that
  has already called `supabase.auth.getUser()` to establish who is asking, has
  validated the request in application code (does this attempt belong to this
  user, is it actually complete, does the row being updated belong to them),
  and only then writes using `createAdminClient()`
  (`src/lib/supabase/admin.ts`).
- This is the one documented, narrow exception to "the admin client is for
  ingestion scripts only" (see the comment on `createAdminClient`). The
  service-role key still never reaches the browser — `SUPABASE_SERVICE_ROLE_KEY`
  has no `NEXT_PUBLIC_` prefix and is validated as server-only by
  `src/lib/env.server.ts`. The trust boundary moves from "the database checks
  the row" to "the server code checks the request before it ever calls the
  database" — which is correct here specifically because the write it not
  something RLS's `auth.uid() = user_id` shape can express: RLS can say "you
  may only touch your own row", it cannot say "you may only write a row that a
  diagnostic algorithm actually computed".
- **Not implemented yet.** No Server Action performs this write today — there
  is no diagnostic engine to produce a placement from. This migration closes
  the client-write path _before_ that engine exists, rather than after. See
  docs/DIAGNOSTIC.md.

### Gated questions

`question_options.is_correct` is readable for ordinary practice questions —
deliberately: a learner doing a lesson exercise can already see the answer key
in the network tab of any client-side quiz, and hiding it there buys nothing
but an extra round trip.

Placement and diagnostic questions are not ordinary practice: their entire
value is an honest measurement, so the correct answer must never be visible to
the client before a response is submitted. `20260904001900_gated_questions.sql`
adds `questions.is_gated` (boolean, default `false`, set explicitly by content
authors — not inferred from `assessment_questions` membership, because the same
question could plausibly appear in both a practice lesson and a gated test)
and narrows the `question_options` select policy to `is_gated = false`.

A gated question's options therefore have **no select policy that admits
them** — the same "no policy, no access" mechanism that protects every content
table's write side. Grading a gated question is a server-side evaluation
boundary: a trusted server-side function receives `(question_id, response)`,
looks up correctness with elevated access, records the answer, and returns
only the verdict — never the option rows themselves. **Not implemented yet:**
no code path grades a gated question today, because no assessment engine
exists to submit one from. See docs/DIAGNOSTIC.md ("Gated question
evaluation") for the intended shape of that boundary.

### Storage

| Bucket             | Read     | Write                                   |
| ------------------ | -------- | --------------------------------------- |
| `content-audio`    | everyone | service role only                       |
| `content-graphics` | everyone | service role only                       |
| `avatars`          | everyone | owner only, path `<user_id>/<filename>` |

Avatar ownership is checked with `(storage.foldername(name))[1] = auth.uid()`,
which is why the path convention is mandatory rather than a nicety.

### Known gaps

- ~~`question_options.is_correct` is readable by anyone who can read the
  question.~~ **Resolved** for gated (placement/diagnostic) questions by
  `questions.is_gated` — see "Gated questions" above. Ordinary practice
  questions remain intentionally readable; that is the correct behaviour for
  them, not a gap.
- ~~`placement_results` is learner-writable.~~ **Resolved** — see "Placement
  results" above. The write path itself (the Server Action that computes and
  accepts a placement) is not built yet; only the diagnostic engine that would
  call it is missing, not the security boundary around it.
- **TODO — DECISION REQUIRED:** the gated-question evaluation function
  described above is a documented boundary, not code. Build it alongside the
  assessment engine, and resist the temptation to grade a gated question from
  a Server Component or Route Handler that queries the table directly with the
  admin client "just this once" — the whole point is one narrow, auditable
  entry point.
- Content publishing has no workflow or audit trail beyond `status`. Adequate
  while one team authors everything.

## Performance notes

Indexes exist for the queries the product will actually run, not
speculatively:

- `srs_cards_due_idx (user_id, due_at) where state <> 'suspended'` — the
  every-visit `/review` query. Partial, because suspended cards are never due.
- `user_curriculum_progress_user_idx (user_id, status)` — "what is next".
- `lesson_content_lesson_position_idx (lesson_id, position)` — lesson load.
- `assessment_attempts_user_idx (user_id, kind, started_at desc)` — latest
  attempt of a kind.

`public.is_owner` is `stable` and wraps `auth.uid()` in a scalar subquery so
Postgres evaluates it once per query rather than once per row. On a learner
with thousands of SRS cards this is the difference between one call and
thousands.

## Working with migrations

```bash
npm run db:start     # start the local stack (requires Docker)
npm run db:reset     # drop, recreate, replay every migration
npm run db:diff name # generate a migration from local schema changes
npm run db:types     # regenerate src/types/database.generated.ts
npm run db:push      # apply migrations to the linked hosted project
```

Migrations are **append-only**. Once a migration has been applied anywhere
other than a local machine, fix it with a new migration, never by editing it.
