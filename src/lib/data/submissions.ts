// Creating and reading safety-form submissions. Every query runs as the logged-in user, so the
// database's security rules decide which rows come back (framers: their own; admins: everyone's).
import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadPhoto } from "./photos";
import type { ChecklistValues, Submission, SubmissionDetail, SubmissionPhoto, SubmissionWithRelations } from "@/lib/types";

// What the safety form hands over once validation has passed.
export type SafetyFormInput = {
  userId: string;
  siteId: string;
  workDate: string; // "YYYY-MM-DD"
  checklist: ChecklistValues;
  notes: string; // already trimmed; "" means no notes
  photos: File[];
};

// Either the new submission's id, or one plain-English message to show on the form.
export type SubmitResult = { submissionId: string } | { error: string };

const ALREADY_SUBMITTED = "You've already sent a form for this site on this date. You can see it under My submissions.";

// Saves a safety form and its photos. It runs in the browser so the photos go straight to
// Storage: sending them through our server would hit Vercel's 4.5 MB request limit.
export async function submitSafetyForm(supabase: SupabaseClient, input: SafetyFormInput): Promise<SubmitResult> {
  // 1. One form per worker, per site, per day. Check before uploading so nobody waits for photos only to be refused.
  const { data: existing, error: checkError } = await supabase
    .from("submissions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("site_id", input.siteId)
    .eq("work_date", input.workDate)
    .maybeSingle();
  if (checkError) return failure("Couldn't check for an earlier form.", checkError);
  if (existing) return { error: ALREADY_SUBMITTED };

  // 2. Choose the submission's id now, because each photo's storage path includes it.
  const submissionId = newId();

  // 3. Upload each photo to {userId}/{submissionId}/{random}.{ext}, e.g. ".../3f2a….jpeg".
  const paths: string[] = [];
  for (const photo of input.photos) {
    const path = `${input.userId}/${submissionId}/${newId()}.${photo.type.split("/")[1]}`;
    const { error } = await uploadPhoto(supabase, path, photo);
    if (error) return failure(`Couldn't upload the photo “${photo.name}”.`, error);
    paths.push(path);
  }

  // 4. Save the form with that id, then one row per photo pointing at its file.
  const { error: insertError } = await supabase.from("submissions").insert({
    id: submissionId,
    user_id: input.userId,
    site_id: input.siteId,
    work_date: input.workDate,
    ...input.checklist,
    notes: input.notes || null,
  });
  // 23505 = the database's one-form-per-day rule; a form from another tab got there first.
  if (insertError?.code === "23505") return { error: ALREADY_SUBMITTED };
  if (insertError) return failure("Couldn't save your form.", insertError);

  const { error: photosError } = await supabase
    .from("submission_photos")
    .insert(paths.map((storage_path) => ({ submission_id: submissionId, storage_path })));
  if (photosError) {
    console.error("Form saved but its photo rows failed:", photosError);
    return { error: "Your form was saved, but its photos couldn't be attached. Please tell your supervisor." };
  }

  // 5. Success: hand back the id so the form can open the new submission.
  return { submissionId };
}

// Logs the technical details for whoever debugs it, and gives the framer a short message.
function failure(message: string, details: unknown): SubmitResult {
  console.error(message, details);
  return { error: `${message} Check your connection and try again.` };
}

// A random id. crypto.randomUUID() only exists on secure pages (https or localhost); a phone
// testing `npm run dev` over the office network uses plain http, so build one by hand there.
function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // marks it as a random (version 4) uuid
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // standard uuid variant
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// How Supabase returns a submission read together with its worker's and site's names.
type JoinedSubmission = Submission & {
  profiles: { full_name: string } | null;
  sites: { name: string } | null;
};

// The logged-in user's own submissions, newest first, for "My submissions". Filtered by user
// on purpose: for an admin, the security rules alone would return everyone's.
export async function getMySubmissions(supabase: SupabaseClient, userId: string): Promise<SubmissionWithRelations[]> {
  const { data, error } = await supabase
    .from("submissions")
    .select("*, profiles(full_name), sites(name), submission_photos(count)")
    .eq("user_id", userId)
    .order("work_date", { ascending: false })
    .order("created_at", { ascending: false })
    .overrideTypes<(JoinedSubmission & { submission_photos: { count: number }[] })[], { merge: false }>();
  if (error) throw new Error(`Could not load your submissions: ${error.message}`);

  return data.map(({ profiles, sites, submission_photos, ...submission }) => ({
    ...submission,
    worker_name: profiles?.full_name ?? "Unknown worker",
    site_name: sites?.name ?? "Unknown site",
    photo_count: submission_photos[0]?.count ?? 0,
  }));
}

// One submission with its names and photos. Returns null when it doesn't exist or the security
// rules hide it (a framer opening someone else's link), so the page can show "not found".
export async function getSubmissionById(supabase: SupabaseClient, id: string): Promise<SubmissionDetail | null> {
  const { data, error } = await supabase
    .from("submissions")
    .select("*, profiles(full_name), sites(name), submission_photos(*)")
    .eq("id", id)
    .maybeSingle<JoinedSubmission & { submission_photos: SubmissionPhoto[] }>();
  // 22P02 = the id in the web address isn't a valid uuid, which is just another "not found".
  if (error?.code === "22P02") return null;
  if (error) throw new Error(`Could not load this submission: ${error.message}`);
  if (!data) return null;

  const { profiles, sites, submission_photos, ...submission } = data;
  return {
    ...submission,
    worker_name: profiles?.full_name ?? "Unknown worker",
    site_name: sites?.name ?? "Unknown site",
    photos: submission_photos,
  };
}
