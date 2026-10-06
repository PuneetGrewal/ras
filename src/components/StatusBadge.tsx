// A small label showing where a submission is: grey "Submitted" until an admin reviews it,
// then RAS green "Reviewed".
import type { SubmissionStatus } from "@/lib/types";

export default function StatusBadge({ status }: { status: SubmissionStatus }) {
  const colours =
    status === "reviewed" ? "border-ras-green bg-ras-green text-white" : "border-neutral-300 bg-neutral-100 text-ras-grey";

  return (
    <span className={`inline-block shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colours}`}>
      {status}
    </span>
  );
}
