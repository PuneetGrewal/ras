// One submission in full: worker, site, date, time sent, checklist, notes and photos. Framers can
// open only their own (for anyone else's the database returns nothing, so this shows "not found");
// admins can open any, and mark it reviewed.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import MarkReviewedButton from "@/components/MarkReviewedButton";
import Message from "@/components/Message";
import PhotoGallery from "@/components/PhotoGallery";
import StatusBadge from "@/components/StatusBadge";
import { CHECKLIST_ITEMS } from "@/lib/constants";
import { getSignedPhotoUrls } from "@/lib/data/photos";
import { getCurrentProfile } from "@/lib/data/profiles";
import { getSubmissionById } from "@/lib/data/submissions";
import { formatDateTime, formatWorkDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function SubmissionDetailPage({ params, searchParams }: PageProps<"/submissions/[id]">) {
  const { id } = await params;
  // "?created=1": the framer has just sent this form. "?reviewed=1": an admin has just marked it reviewed.
  const { created, reviewed } = await searchParams;

  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) redirect("/login");
  const isAdmin = profile.role === "admin";
  const submission = await getSubmissionById(supabase, id);
  if (!submission) notFound();
  const photos = await getSignedPhotoUrls(supabase, submission.photos.map((photo) => photo.storage_path));

  const details = [
    { label: "Worker", value: submission.worker_name },
    { label: "Site", value: submission.site_name },
    { label: "Date", value: formatWorkDate(submission.work_date) },
    { label: "Submitted", value: formatDateTime(submission.created_at) },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href={isAdmin ? "/admin" : "/submissions"} className="inline-block py-2 font-medium text-ras-green underline">
        ← {isAdmin ? "Back to dashboard" : "Back to my submissions"}
      </Link>

      {created === "1" && <Message type="success">Form submitted. Thank you, your supervisor can now see it.</Message>}
      {reviewed === "1" && <Message type="success">Marked as reviewed.</Message>}

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">Safety form</h1>
        <StatusBadge status={submission.status} />
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {details.map((detail) => (
          <div key={detail.label} className="contents">
            <dt className="text-ras-grey">{detail.label}</dt>
            <dd>{detail.value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="text-lg font-semibold">Checklist</h2>
        <ul className="mt-2 space-y-1">
          {CHECKLIST_ITEMS.map((item) => {
            const ticked = submission[item.key];
            return (
              <li key={item.key} className="flex items-center gap-2">
                <span aria-hidden="true" className={`w-5 font-bold ${ticked ? "text-ras-green" : "text-red-700"}`}>
                  {ticked ? "✓" : "✗"}
                </span>
                <span>{item.label}</span>
                <span className="sr-only">{ticked ? "yes" : "no"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Notes</h2>
        <p className="mt-1 whitespace-pre-wrap">{submission.notes ?? <span className="text-ras-grey">No notes.</span>}</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Photos ({photos.length})</h2>
        <div className="mt-2">
          <PhotoGallery photos={photos} />
        </div>
      </section>

      {isAdmin && submission.status === "submitted" && <MarkReviewedButton submissionId={submission.id} />}
    </div>
  );
}
