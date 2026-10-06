// Admin dashboard: today's summary, filters, and every submission that matches them. The filters
// live in the web address (?site=&worker=&from=&to=), so a filtered view can be bookmarked or shared.
import { redirect } from "next/navigation";
import FilterBar from "@/components/FilterBar";
import SiteChart from "@/components/SiteChart";
import SubmissionTable from "@/components/SubmissionTable";
import SummaryCards from "@/components/SummaryCards";
import { getCurrentProfile, getFramers } from "@/lib/data/profiles";
import { getAllSites } from "@/lib/data/sites";
import { getSubmissions } from "@/lib/data/submissions";
import { getDashboardSummary } from "@/lib/data/summary";
import { createClient } from "@/lib/supabase/server";
import { parseSubmissionFilters } from "@/lib/validation";

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);

  // Checked here as well as in the layout, so this page never renders for the wrong person.
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/submit");

  const filters = parseSubmissionFilters(await searchParams);
  const [sites, framers, submissions] = await Promise.all([
    getAllSites(supabase),
    getFramers(supabase),
    getSubmissions(supabase, filters),
  ]);
  const summary = await getDashboardSummary(supabase, sites, framers);
  const filtered = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <SummaryCards summary={summary} />

      <section className="rounded border border-neutral-300 p-4">
        <h2 className="font-semibold">Forms per site, last 7 days</h2>
        <div className="mt-3">
          <SiteChart data={summary.lastSevenDaysBySite.map(({ site, count }) => ({ site: site.name, count }))} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Submissions</h2>
        {/* The key starts the filter boxes afresh whenever the address changes (Apply, Clear, Back button). */}
        <FilterBar key={JSON.stringify(filters)} sites={sites} framers={framers} filters={filters} />
        <p className="text-sm text-ras-grey">
          {submissions.length === 1 ? "1 submission" : `${submissions.length} submissions`}
          {filtered ? (submissions.length === 1 ? " matches these filters." : " match these filters.") : " in total."}
        </p>
        <SubmissionTable
          submissions={submissions}
          emptyText={filtered ? "No submissions match these filters." : "No submissions yet."}
        />
      </section>
    </div>
  );
}
