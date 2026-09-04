# Development

## Requirements

| Tool    | Version                    | Notes                                 |
| ------- | -------------------------- | ------------------------------------- |
| Node.js | 24 (`.nvmrc`); ≥20.9 works |                                       |
| npm     | 11                         |                                       |
| Docker  | any recent                 | **Only** for the local Supabase stack |

Everything except the database runs without Docker.

## Setup

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev                    # http://localhost:3000
```

### Environment variables

| Variable                        | Required | Purpose                                             |
| ------------------------------- | -------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | yes      | Supabase API URL                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes      | Public anon key                                     |
| `NEXT_PUBLIC_SITE_URL`          | no       | Auth redirects; defaults to `http://localhost:3000` |
| `SUPABASE_SERVICE_ROLE_KEY`     | no       | **Bypasses RLS.** Ingestion/admin scripts only.     |

Validated by Zod in `src/lib/env.ts` (public) and `src/lib/env.server.ts`
(server-only) **at module load**, so a missing variable fails immediately with
a message naming it — not later, as a confusing runtime error.

`.env.local` is gitignored. The service-role key must never be committed, never
prefixed with `NEXT_PUBLIC_`, and never imported by request-handling code.

### Database

```bash
npm run db:start    # start Postgres, Auth, Storage locally (needs Docker)
npm run db:reset    # drop and replay every migration
npm run db:types    # regenerate src/types/database.generated.ts
npm run db:stop
```

`db:start` prints an API URL and an anon key — copy both into `.env.local`.

## Scripts

| Script                 | Does                                     |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Dev server                               |
| `npm run build`        | Production build (includes typecheck)    |
| `npm start`            | Serve the production build               |
| `npm run lint`         | ESLint                                   |
| `npm run lint:fix`     | ESLint with fixes                        |
| `npm run format`       | Prettier, writing                        |
| `npm run format:check` | Prettier, checking                       |
| `npm run typecheck`    | `tsc --noEmit`                           |
| `npm test`             | Vitest, once                             |
| `npm run test:watch`   | Vitest, watching                         |
| `npm run test:e2e`     | Playwright (starts the app itself)       |
| `npm run verify`       | format + lint + typecheck + test + build |

**`npm run verify` is the gate.** Run it before every commit.

> `npm run typecheck` alone fails on a clean checkout with
> `Cannot find name 'PageProps'`. Those types are generated into `.next/types`
> by Next, so run `npm run build` (or `npm run dev`) once first. `verify` puts
> them in the right order.

## Conventions

### TypeScript

`strict`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`,
`noFallthroughCasesInSwitch` and `verbatimModuleSyntax`. Loosening any of them
is a decision to record here, not a convenience.

- **No `any`.** ESLint enforces it. If a boundary genuinely requires one,
  isolate it in the smallest possible function, add an inline disable, and
  write the reason. There are none today.
- **No TypeScript `enum`.** Lint-enforced. Use a `const` array plus a derived
  union (see `src/types/domain.ts`) — it exists at runtime, is iterable, and
  keeps its order.
- **`import type`** for types. Enforced, and required by
  `verbatimModuleSyntax`.

### Database types

`src/types/database.generated.ts` is **generated**. Do not hand-edit it.
`supabase.from("levels")` doesn't typecheck until you run `npm run db:types`
against a running local stack (`npm run db:start` first).

It briefly held a hand-authored interim stand-in during the Hiragana vertical
slice, while Docker was unavailable in this environment — scoped to only the
tables that slice queried, clearly labeled as unverified. That has since been
replaced by real `supabase gen types` output, run against the actual local
Postgres instance once Docker became available; the query code typechecked
against it without changes, which is the strongest evidence the interim file
was accurate. If this file is ever regenerated (which fully overwrites it —
never merge into it by hand) after a migration adds a table or column, commit
the regenerated file alongside the migration.

Use the helpers in `src/types/database.ts`:

```ts
type Level = Tables<"levels">;
type NewCard = TablesInsert<"srs_cards">;
type Rating = Enums<"srs_rating">;
```

`src/types/domain.ts` restates the database enums so the application can rely
on their **order** (the curriculum ladder). `src/types/domain.test.ts` parses
the migration and fails if the two drift — that test is what makes the
restatement safe rather than duplicative.

### Layering

```
route (app/) → service (services/) → supabase client (lib/supabase/)
```

Routes do not build queries. Services do not import components. `lib/` does not
import from `services/`.

### Supabase clients

| Client                    | Use in                                     | Auth                           |
| ------------------------- | ------------------------------------------ | ------------------------------ |
| `lib/supabase/client.ts`  | Client Components                          | user, RLS applies              |
| `lib/supabase/server.ts`  | Server Components, Actions, Route Handlers | user, RLS applies              |
| `lib/supabase/session.ts` | `src/proxy.ts` only                        | refreshes the session          |
| `lib/supabase/admin.ts`   | ingestion/admin scripts only               | **service role, RLS bypassed** |

The server client is created **per request** — it closes over that request's
cookies, so a module-level singleton would leak sessions between users.

Always `getUser()`, never `getSession()`: the first revalidates the token, the
second trusts a cookie the client can write.

### Styling

Design tokens only. No hex values, no arbitrary radii, no off-scale spacing in
components. See [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md).

### Content

Never branch on a lesson slug or level code to decide rendering. Blocks resolve
through `src/content/registry.ts`. See
[LEARNING-ENGINE.md](./LEARNING-ENGINE.md).

## Testing

| Kind               | Tool                     | Location                          |
| ------------------ | ------------------------ | --------------------------------- |
| Unit / integration | Vitest + Testing Library | beside the source, `*.test.ts(x)` |
| End-to-end         | Playwright               | `tests/e2e/`                      |

Unit tests live next to what they cover — a test three directories away from
its subject gets deleted rather than updated.

`src/test/setup.ts` stubs the public env vars, because `src/lib/env.ts` throws
on missing configuration at module load (correct in production, fatal in tests
for the wrong reason).

First Playwright run needs browsers: `npm run test:e2e:install`.

`routes.spec.ts` asserts only that every remaining _placeholder_ route
resolves. As a screen becomes real, its route should move out of that list
and get real assertions of its own, the way `lesson.spec.ts` now covers the
Hiragana lesson — replaced, not added to.

## Migrations

Append-only, applied in filename order, named
`YYYYMMDDHHMMSS_description.sql`.

Once a migration has been applied anywhere but a local machine, fix it with a
new migration — never by editing it.

RLS is part of the schema, not an afterthought: a new table gets its policies
in the same migration that creates it.

## Known gaps

- No CI pipeline. `npm run verify` is the manual equivalent.
- No error reporting service (`src/app/error.tsx` logs to the console).
- No deployment configuration.
- ESLint is pinned to 9.x: ESLint 10 breaks `eslint-plugin-react` as bundled by
  `eslint-config-next@16.3.4`. Revisit when that config supports 10.
- TypeScript is pinned to 5.9 rather than 7.x, which is what
  `eslint-config-next` and Next 16 are tested against. Revisit when the
  toolchain catches up.
- `npm run test:e2e` binds to port 3000 by default (`playwright.config.ts`).
  On a machine already running another project's dev server on that port,
  the suite silently exercises the wrong app and every route assertion fails
  confusingly. Pass a free port explicitly if that happens:
  `PORT=3477 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3477 npx playwright test`.
- `tests/e2e/lesson.spec.ts` (the Hiragana lesson flow) is gated behind
  `RUN_DB_DEPENDENT_E2E=1` and does not run by default — it needs a seeded
  local Supabase stack, which needs Docker. See the note at the top of that
  file.
- `next dev` blocks its HMR websocket for any origin not listed in
  `allowedDevOrigins`; `next.config.ts` allows `127.0.0.1` because that's what
  Playwright's e2e config navigates to. Without it, the blocked HMR channel
  stalls client-side hydration/effects on that origin — the whole app hangs on
  "Loading your progress…" with no thrown error, not just a missing live-reload
  feature. If a route is ever accessed from a different dev origin (a LAN IP,
  a tunnel), add it here too — production (`next start`) is unaffected, since
  HMR doesn't exist there.
- **Known flake, dev-mode only:** React Strict Mode double-invokes
  `LessonPlayer`'s bootstrap effect. Both invocations call
  `ensureSession()` (`src/lib/supabase/ensure-session.ts`) on the same shared
  browser Supabase client; if both see no session and both call
  `signInAnonymously()`, whichever anonymous session the client applies _last_
  becomes "current" for every subsequent request — including the "cancelled"
  invocation's own save, whose request body still carries _its own_
  `signInAnonymously()` result as `user_id`. When those two disagree, RLS
  correctly rejects the mismatched write (`42501`), surfacing briefly as
  "Could not save progress." Confirmed dev-only: a production build
  (`next start`) makes exactly one anonymous sign-in and never hits this.
  Not fixed — the smallest fix is de-duplicating concurrent bootstrap calls
  (e.g. a module-level in-flight promise keyed by client instance) rather than
  relying on the `cancelled` flag, which only guards state updates, not the
  underlying network calls.
