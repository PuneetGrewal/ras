// Admin dashboard. Placeholder until Step 5; for now it only makes sure the visitor is an admin.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data/profiles";

export default async function AdminPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  // Checked here as well as in the layout, so this page never renders for the wrong person.
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/submit");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-ras-grey">Submissions, filters and the daily summary arrive in Step 5.</p>
    </div>
  );
}
