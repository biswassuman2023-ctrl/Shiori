import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

/**
 * Runs before every matched request.
 *
 * Next.js 16 renamed this file convention from `middleware` to `proxy`; the
 * behaviour is unchanged. Its only job here is refreshing the Supabase auth
 * session — route protection belongs in the routes, where it can redirect with
 * context. See docs/ARCHITECTURE.md ("Authentication").
 */
export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  /**
   * Every path except static assets and image files. Auth cookies are not
   * needed to serve a favicon, and running this on those requests would add
   * latency to every page load.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
