// The dashboard's summary, worked out from the last 7 days of submissions: who submitted today on
// each site, which framers haven't submitted today, and each site's total for the 7 days.
import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, todayInCompanyTimezone } from "@/lib/dates";
import type { Profile, Site } from "@/lib/types";

export type DashboardSummary = {
  today: string; // "YYYY-MM-DD" in Vancouver
  weekStart: string; // the first of the last 7 days (today and the 6 days before it)
  todayBySite: { site: Site; names: string[] }[];
  notSubmittedToday: Profile[];
  lastSevenDaysBySite: { site: Site; count: number }[];
};

// Just the columns the summary needs, plus the worker's name.
type RecentSubmission = { user_id: string; site_id: string; work_date: string; profiles: { full_name: string } | null };

// Builds the summary. The page already has every site and framer, so they are passed in rather than read twice.
export async function getDashboardSummary(supabase: SupabaseClient, sites: Site[], framers: Profile[]): Promise<DashboardSummary> {
  const today = todayInCompanyTimezone();
  const weekStart = addDays(today, -6);

  const { data: recent, error } = await supabase
    .from("submissions")
    .select("user_id, site_id, work_date, profiles(full_name)")
    .gte("work_date", weekStart)
    .lte("work_date", today)
    .overrideTypes<RecentSubmission[], { merge: false }>();
  if (error) throw new Error(`Could not load the summary: ${error.message}`);
  const todays = recent.filter((submission) => submission.work_date === today);

  // Switched-off sites only appear when they still have forms in the period, so the numbers always add up.
  const todayBySite = sites
    .map((site) => ({
      site,
      names: todays
        .filter((submission) => submission.site_id === site.id)
        .map((submission) => submission.profiles?.full_name ?? "Unknown worker")
        .sort(),
    }))
    .filter(({ site, names }) => site.is_active || names.length > 0);

  const submittedToday = new Set(todays.map((submission) => submission.user_id));
  const notSubmittedToday = framers.filter((framer) => !submittedToday.has(framer.id));

  const lastSevenDaysBySite = sites
    .map((site) => ({ site, count: recent.filter((submission) => submission.site_id === site.id).length }))
    .filter(({ site, count }) => site.is_active || count > 0);

  return { today, weekStart, todayBySite, notSubmittedToday, lastSevenDaysBySite };
}
