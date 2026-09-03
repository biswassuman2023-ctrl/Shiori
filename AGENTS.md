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
3. **Never use the service-role key in request-handling code.** It bypasses
   RLS. It is for ingestion and admin scripts only. If a request handler seems
   to need it, the policy is wrong — fix the policy.
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
- `src/types/database.generated.ts` is a committed **empty placeholder**.
  `supabase.from("levels")` will not typecheck until `npm run db:types` has
  been run against a local stack.
- The server Supabase client must be created per request. A module-level
  singleton leaks sessions between users.
- Japanese text needs `lang="ja"`, or it renders in a Chinese font on many
  systems.
