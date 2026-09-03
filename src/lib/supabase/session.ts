import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase auth session on every matched request.
 *
 * Server Components cannot write cookies, so without this the access token
 * would expire and never be renewed. The response returned here carries the
 * refreshed cookies and must be the one the proxy returns — constructing
 * a different `NextResponse` afterwards drops them and silently signs the
 * user out.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Do not remove: this call is what triggers the token refresh.
  // Use getUser() rather than getSession() — getUser() revalidates the token
  // with the auth server, getSession() trusts an attacker-writable cookie.
  await supabase.auth.getUser();

  return response;
}
