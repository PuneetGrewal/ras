// Framer's "New form" page: loads the active sites and today's date (in Vancouver),
// then shows the safety form. The worker is always the logged-in person.
import { redirect } from "next/navigation";
import Message from "@/components/Message";
import SafetyForm from "@/components/SafetyForm";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getActiveSites } from "@/lib/data/sites";
import { todayInCompanyTimezone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function SubmitPage() {
  const supabase = await createClient();
  // Checked here as well as in the layout: the two load at the same time, and this page must not query while logged out.
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  const sites = await getActiveSites(supabase);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold">New safety form</h1>
      <p className="mt-1 text-ras-grey">Fill this in before starting work. You&apos;re submitting as {profile.full_name}.</p>

      <div className="mt-6">
        {sites.length === 0 ? (
          <Message type="error">There are no active sites to choose from. Ask your supervisor to add one.</Message>
        ) : (
          <SafetyForm userId={profile.id} sites={sites} today={todayInCompanyTimezone()} />
        )}
      </div>
    </div>
  );
}
