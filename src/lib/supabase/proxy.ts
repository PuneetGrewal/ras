// Keeps the user's login fresh: runs before every page request (from src/proxy.ts), renews an
// expiring login token and passes the updated cookies on. Based on the official Supabase Next.js guide.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // A new client per request (never shared between users).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
          // Cache headers stop a CDN from ever serving one user's login cookies to someone else.
          Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
        },
      },
    },
  );

  // Per the Supabase guide: nothing may run between creating the client and getClaims(), and
  // getClaims() must stay, or users get logged out at random. This call is what renews the token.
  await supabase.auth.getClaims();

  // Deciding who may see which page is left to the pages themselves (see src/app/(app)/layout.tsx).
  // The response must be returned as-is so the browser receives the renewed cookies.
  return supabaseResponse;
}
