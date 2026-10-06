// Supabase client for code running on the server (pages, layouts, server actions).
// It reads the login from the request's cookies. Copied from the official Supabase Next.js guide.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Pages can't write cookies; that's fine because src/proxy.ts keeps the login fresh on every request.
          }
        },
      },
    },
  );
}
