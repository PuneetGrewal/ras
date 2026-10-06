// Framer's "My submissions" page: their own safety forms, newest first, each opening its details.
import Link from "next/link";
import { redirect } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getMySubmissions } from "@/lib/data/submissions";
import { formatWorkDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  const submissions = await getMySubmissions(supabase, profile.id);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold">My submissions</h1>

      {submissions.length === 0 ? (
        <p className="mt-4 text-ras-grey">
          You haven&apos;t sent any safety forms yet.{" "}
          <Link href="/submit" className="font-medium text-ras-green underline">
            Fill in a new form
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-neutral-200 rounded border border-neutral-300">
          {submissions.map((submission) => (
            <li key={submission.id}>
              <Link
                href={`/submissions/${submission.id}`}
                className="flex min-h-12 items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
              >
                <div className="min-w-0">
                  <p className="font-medium">{formatWorkDate(submission.work_date)}</p>
                  <p className="text-sm text-ras-grey">
                    {submission.site_name} ·{" "}
                    <span className="whitespace-nowrap">
                      {submission.photo_count} {submission.photo_count === 1 ? "photo" : "photos"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={submission.status} />
                  <span aria-hidden="true" className="text-xl text-ras-grey">
                    ›
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
