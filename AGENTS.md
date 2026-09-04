# Agent notes

Read `docs/` first — it is the source of truth. `docs/DEVELOPMENT.md` has the
conventions; `docs/ARCHITECTURE.md` has the boundaries.

## Non-negotiables

1. **Content is data, not code.** Never branch on a lesson slug, level code or
   unit to decide what to render. Blocks resolve through
   `src/content/registry.ts` by `block_type` alone.
2. **Row Level Security is the security boundary.** Never rely on the frontend
   to restrict access. A new table gets its RLS policies in the same migration
   that creates it.
3. **Never use the service-role key in request-handling code**, with one
   narrow, named exception: `placement_results` writes and gated-question
   grading, which have no correct RLS shape (see `src/lib/supabase/admin.ts`
   and docs/DATABASE.md "Security model"). Everything else that bypasses RLS
   is for ingestion and admin scripts only. If a request handler seems to
   need it and isn't on that short list, the policy is wrong — fix the
   policy.
4. **Design tokens, not literals.** No hex values, no arbitrary radii, no
   off-scale spacing in components.
5. **No `any`, no TypeScript `enum`.** Both are lint-enforced.
6. **Migrations are append-only.** Fix an applied migration with a new one.
7. **Mark unmade decisions.** Write `TODO — DECISION REQUIRED` rather than
   inventing product behaviour.

## Before committing

```bash
npm run verify
```

## Things that will bite you

- `npm run typecheck` alone fails on a clean checkout: `PageProps` and
  `LayoutProps` are generated into `.next/types` by `next build`. Build first.
- `src/types/database.generated.ts` is real `supabase gen types` output,
  verified against a running local stack. Never hand-edit it — regenerate
  with `npm run db:types` after any migration changes a table shape.
- The server Supabase client must be created per request. A module-level
  singleton leaks sessions between users.
- Japanese text needs `lang="ja"`, or it renders in a Chinese font on many
  systems.
- A block renderer is looked up from `src/content/registry.ts` and rendered
  as `<Renderer block={...} />` — `eslint-plugin-react-hooks`'s
  `static-components` rule flags this pattern by default (it can't tell a
  stable registry lookup from a component literally constructed during
  render). The existing disable comment on that line explains why; don't
  "fix" it by restructuring away from registry dispatch, which is the point
  of the architecture, not an accident.
- `npm run test:e2e` binds port 3000 by default. If another project's dev
  server already owns that port on your machine, the suite silently tests
  the wrong app. Pass an explicit port if routes fail confusingly:
  `PORT=3477 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3477 npx playwright test`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
