// The dashboard's filters: site, worker and a date range. All it does is change the web address
// (?site=&worker=&from=&to=); the dashboard page reads the filters from there and loads the matching forms.
"use client";

import { useState, useTransition, type FormEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Message from "./Message";
import type { Profile, Site, SubmissionFilters } from "@/lib/types";

// text-base: iPhones zoom into any box with text under 16 px, so the boxes don't inherit the small label text.
const FIELD = "mt-1 block min-h-11 w-full rounded border border-neutral-300 bg-white px-3 py-2 text-base font-normal text-ras-charcoal";
const FILTER_NAMES = ["site", "worker", "from", "to"] as const;

type Props = {
  sites: Site[];
  framers: Profile[];
  filters: SubmissionFilters; // what the address says now; fills in the boxes
};

export default function FilterBar({ sites, framers, filters }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const from = String(form.get("from") ?? "");
    const to = String(form.get("to") ?? "");
    if (from && to && from > to) {
      setError("The “From” date must be on or before the “To” date.");
      return;
    }
    setError("");

    // Only the boxes that are filled in go into the address, e.g. /admin?site=…&from=2026-10-01
    const params = new URLSearchParams();
    for (const name of FILTER_NAMES) {
      const value = String(form.get(name) ?? "");
      if (value) params.set(name, value);
    }
    // scroll: false keeps the page where it is, so on a phone the results stay in view below the filters.
    const query = params.toString();
    startTransition(() => router.push(query ? `/admin?${query}` : "/admin", { scroll: false }));
  }

  function handleClear(event: MouseEvent<HTMLButtonElement>) {
    // Empty the boxes right away: when nothing was applied yet the address doesn't change, so nothing else would.
    event.currentTarget.form?.reset();
    setError("");
    startTransition(() => router.push("/admin", { scroll: false }));
  }

  return (
    <form onSubmit={handleApply} className="space-y-3 rounded border border-neutral-300 bg-neutral-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm font-medium text-ras-grey">
          Site
          <select name="site" defaultValue={filters.site ?? ""} className={FIELD}>
            <option value="">All sites</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.is_active ? site.name : `${site.name} (inactive)`}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-ras-grey">
          Worker
          <select name="worker" defaultValue={filters.worker ?? ""} className={FIELD}>
            <option value="">All workers</option>
            {framers.map((framer) => (
              <option key={framer.id} value={framer.id}>
                {framer.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-ras-grey">
          From
          <input type="date" name="from" defaultValue={filters.from ?? ""} className={FIELD} />
        </label>

        <label className="block text-sm font-medium text-ras-grey">
          To
          <input type="date" name="to" defaultValue={filters.to ?? ""} className={FIELD} />
        </label>
      </div>

      {error && <Message type="error">{error}</Message>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded bg-ras-green px-5 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Loading…" : "Apply"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={pending}
          className="min-h-11 rounded border border-ras-grey bg-white px-5 font-medium disabled:opacity-60"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
