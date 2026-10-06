// Supabase client for code running in the browser (client components such as the safety form).
// Copied from the official Supabase "Server-Side Auth for Next.js" guide.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
