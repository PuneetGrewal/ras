// The dashboard's list of submissions, one row each with a View link to the full form.
// On a phone the table scrolls sideways inside its box instead of squashing the columns.
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatDateTime, formatWorkDate } from "@/lib/dates";
import type { SubmissionWithRelations } from "@/lib/types";

const CELL = "whitespace-nowrap px-3 py-2";

type Props = {
  submissions: SubmissionWithRelations[];
  emptyText: string; // shown instead of the table when there are no rows
};

export default function SubmissionTable({ submissions, emptyText }: Props) {
  if (submissions.length === 0) {
    return <p className="rounded border border-neutral-300 px-4 py-8 text-center text-ras-grey">{emptyText}</p>;
  }

  return (
    // "relative" keeps the hidden "Open" heading inside this scroll box; without it, it widens the whole page on a phone.
    <div className="relative overflow-x-auto rounded border border-neutral-300">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-ras-grey">
          <tr>
            <th scope="col" className={`${CELL} font-medium`}>Worker</th>
            <th scope="col" className={`${CELL} font-medium`}>Site</th>
            <th scope="col" className={`${CELL} font-medium`}>Date</th>
            <th scope="col" className={`${CELL} font-medium`}>Submitted</th>
            <th scope="col" className={`${CELL} font-medium`}>Photos</th>
            <th scope="col" className={`${CELL} font-medium`}>Status</th>
            <th scope="col" className={CELL}>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {submissions.map((submission) => (
            <tr key={submission.id} className="hover:bg-neutral-50">
              <td className={`${CELL} font-medium`}>{submission.worker_name}</td>
              <td className={CELL}>{submission.site_name}</td>
              <td className={CELL}>{formatWorkDate(submission.work_date)}</td>
              <td className={CELL}>{formatDateTime(submission.created_at)}</td>
              <td className={CELL}>{submission.photo_count}</td>
              <td className={CELL}>
                <StatusBadge status={submission.status} />
              </td>
              <td className={CELL}>
                <Link
                  href={`/submissions/${submission.id}`}
                  className="inline-block px-2 py-2 font-medium text-ras-green underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
