// Next.js runs this before every page request; it only refreshes the Supabase login (see lib/supabase/proxy.ts).
// Named proxy.ts because Next.js 16 renamed "middleware" to "proxy".
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Every path except Next.js build files and images, which never need a login.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
