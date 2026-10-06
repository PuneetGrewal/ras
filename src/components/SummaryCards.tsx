// The three summary boxes at the top of the dashboard: who has submitted today on each site,
// which framers haven't submitted yet today, and each site's total for the last 7 days.
import type { DashboardSummary } from "@/lib/data/summary";
import { formatWorkDate } from "@/lib/dates";

const CARD = "rounded border border-neutral-300 p-4";
const COUNT = "font-semibold tabular-nums";

export default function SummaryCards({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section className={CARD}>
        <h2 className="font-semibold">Today by site</h2>
        <p className="text-sm text-ras-grey">{formatWorkDate(summary.today)}</p>
        <ul className="mt-3 space-y-3">
          {summary.todayBySite.map(({ site, names }) => (
            <li key={site.id}>
              <div className="flex justify-between gap-3">
                <span className="font-medium">{site.name}</span>
                <span className={COUNT}>{names.length}</span>
              </div>
              <p className="text-sm text-ras-grey">{names.length > 0 ? names.join(", ") : "No forms yet"}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={CARD}>
        <h2 className="font-semibold">Not submitted today</h2>
        <p className="text-sm text-ras-grey">Framers with no form for any site today</p>
        {summary.notSubmittedToday.length === 0 ? (
          <p className="mt-3 font-medium text-ras-green">Everyone has submitted today.</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {summary.notSubmittedToday.map((framer) => (
              <li key={framer.id}>{framer.full_name}</li>
            ))}
          </ul>
        )}
      </section>

      <section className={CARD}>
        <h2 className="font-semibold">Last 7 days</h2>
        <p className="text-sm text-ras-grey">Forms per site since {formatWorkDate(summary.weekStart)}</p>
        <ul className="mt-3 space-y-1">
          {summary.lastSevenDaysBySite.map(({ site, count }) => (
            <li key={site.id} className="flex justify-between gap-3">
              <span>{site.name}</span>
              <span className={COUNT}>{count}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
