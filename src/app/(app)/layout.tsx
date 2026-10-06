// Frame for every logged-in page: sends signed-out visitors to /login, loads the person's
// profile and shows the green header above the page.
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");

  return (
    <>
      <Header profile={profile} />
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </>
  );
}
