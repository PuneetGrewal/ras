// The framer's daily safety form: site, date, checklist, notes and photos. A client component
// because it checks the rules as the framer goes and uploads photos straight to Supabase Storage.
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import ChecklistField from "./ChecklistField";
import Message from "./Message";
import PhotoInput, { type ChosenPhoto } from "./PhotoInput";
import { CHECKLIST_ITEMS, MAX_NOTES_LENGTH } from "@/lib/constants";
import { notifyAdminOfSubmission } from "@/lib/actions";
import { submitSafetyForm } from "@/lib/data/submissions";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistValues, Site } from "@/lib/types";
import { validateSafetyForm } from "@/lib/validation";

// Every box starts unticked, so the framer confirms each item themselves.
const ALL_UNTICKED = Object.fromEntries(CHECKLIST_ITEMS.map((item) => [item.key, false])) as ChecklistValues;

const FIELD = "mt-1 block min-h-12 w-full rounded border border-neutral-300 bg-white px-3 py-2";
const FIELD_ERROR = "mt-1 text-sm text-red-800";

type Props = {
  userId: string;
  sites: Site[];
  today: string; // "YYYY-MM-DD" in Vancouver: the default date and the latest one allowed
};

export default function SafetyForm({ userId, sites, today }: Props) {
  const router = useRouter();
  const [siteId, setSiteId] = useState("");
  const [workDate, setWorkDate] = useState(today);
  const [checklist, setChecklist] = useState<ChecklistValues>(ALL_UNTICKED);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<ChosenPhoto[]>([]);
  const [triedToSubmit, setTriedToSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Messages appear after the first Submit tap, then update live as each problem is fixed.
  const files = photos.map((photo) => photo.file);
  const errors = triedToSubmit
    ? validateSafetyForm({ siteId, workDate, hazardsIdentified: checklist.hazards_identified, notes, photos: files })
    : {};
  const hasErrors = Object.keys(errors).length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTriedToSubmit(true);
    setSubmitError("");
    // Check every rule before uploading anything (the live messages above use the same check).
    const found = validateSafetyForm({ siteId, workDate, hazardsIdentified: checklist.hazards_identified, notes, photos: files });
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const result = await submitSafetyForm(createClient(), {
        userId,
        siteId,
        workDate,
        checklist,
        notes: notes.trim(),
        photos: files,
      });
      if ("error" in result) {
        setSubmitError(result.error);
        setSubmitting(false);
        return;
      }
      // Ask the server to email the admin, without waiting: the email can never hold up or undo the form.
      notifyAdminOfSubmission(result.submissionId).catch((error) => console.error("Could not ask for the admin email:", error));
      // The button stays disabled while the new submission's page loads, so it can't be sent twice.
      router.push(`/submissions/${result.submissionId}?created=1`);
    } catch (error) {
      console.error("Unexpected error while sending the safety form:", error);
      setSubmitError("Something went wrong while sending your form. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    // noValidate: our own plain-English messages replace the browser's pop-up bubbles.
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Locked while sending: the form saves what was there when Submit was tapped, so later edits would be lost. */}
      <fieldset disabled={submitting} className="space-y-6 disabled:opacity-60">
        <label className="block">
          <span className="font-medium">Site</span>
          <select value={siteId} onChange={(event) => setSiteId(event.target.value)} className={FIELD}>
            <option value="">Choose a site…</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
          {errors.site && <span className={`block ${FIELD_ERROR}`}>{errors.site}</span>}
        </label>

        <label className="block">
          <span className="font-medium">Date</span>
          <input type="date" value={workDate} max={today} onChange={(event) => setWorkDate(event.target.value)} className={FIELD} />
          {errors.workDate && <span className={`block ${FIELD_ERROR}`}>{errors.workDate}</span>}
        </label>

        <fieldset>
          <legend className="font-medium">Safety checklist</legend>
          <p className="text-sm text-ras-grey">Tick each item that applies on site today.</p>
          <div className="mt-2 space-y-2">
            {CHECKLIST_ITEMS.map((item) => (
              <ChecklistField
                key={item.key}
                label={item.label}
                checked={checklist[item.key]}
                onChange={(checked) => setChecklist({ ...checklist, [item.key]: checked })}
              />
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="font-medium">
            Notes {checklist.hazards_identified ? "(required: describe the hazards)" : "(optional)"}
          </span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} className={FIELD} />
          <span className="block text-sm text-ras-grey">Up to {MAX_NOTES_LENGTH} characters.</span>
          {errors.notes && <span className={`block ${FIELD_ERROR}`}>{errors.notes}</span>}
        </label>

        <PhotoInput photos={photos} onChange={setPhotos} error={errors.photos} />
      </fieldset>

      {hasErrors && <Message type="error">Please fix the problems marked in red above.</Message>}
      {submitError && <Message type="error">{submitError}</Message>}

      <button
        type="submit"
        disabled={submitting}
        className="min-h-12 w-full rounded bg-ras-green px-4 py-3 font-semibold text-white disabled:opacity-60"
      >
        {submitting ? "Sending… photos can take a minute" : "Submit safety form"}
      </button>
    </form>
  );
}
