// Home address ("/"): sends each visitor to the right page — login if signed out,
// the dashboard for admins, the safety form for framers.
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/data/profiles";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  if (!profile) redirect("/login");
  redirect(profile.role === "admin" ? "/admin" : "/submit");
}
