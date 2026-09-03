/**
 * PLACEHOLDER — NOT YET GENERATED.
 *
 * This file is overwritten by:
 *
 *     npm run db:start      # requires Docker
 *     npm run db:types
 *
 * It is committed as a placeholder so the project typechecks and builds on a
 * clean clone before anyone has run the local database. The empty `Tables`
 * record is deliberate: `supabase.from("levels")` will not typecheck until the
 * real types are generated, which is the intended prompt to generate them
 * rather than to hand-write table types here.
 *
 * Do not add table definitions to this file by hand. See docs/DEVELOPMENT.md
 * ("Database types").
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
