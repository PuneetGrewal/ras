// Sample safety forms for `npm run seed`: 25 forms over the last 10 days, spread across the five test
// framers and the sites, plus a few photos from scripts/seed-photos/ when that folder has any.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CHECKLIST_ITEMS, MAX_PHOTO_BYTES, PHOTO_BUCKET } from "../src/lib/constants";
import { addDays, todayInCompanyTimezone } from "../src/lib/dates";
import type { ChecklistValues, Submission } from "../src/lib/types";

const PHOTOS_FOLDER = "scripts/seed-photos";
const PHOTO_TYPES: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

const HAZARD_NOTES = [
  "Open edge on level 2. Guardrail goes up first thing; crew tied off until then.",
  "Wet subfloor after overnight rain. Spread grit and taped off the worst area.",
  "Crane lifting trusses until noon. Exclusion zone set up on the east side.",
  "Soft ground under the scaffold base. Added sole plates and re-levelled.",
];
const OTHER_NOTES = [
  "Toolbox talk this morning: ladder safety.",
  "Replaced a damaged extension cord from the truck.",
  "LVL delivery at 9. Laydown area cleared beforehand.",
  "All good. Crew of four on site.",
];

// Sample forms get fixed ids starting "5eed" ("seed"). A second run can then see they're already there,
// and they're easy to spot, and delete before going live, in the Supabase table editor.
function sampleId(n: number): string {
  return `5eed0000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

// A sample form is a full submissions row (see src/lib/types.ts), with every column filled in.
type SampleForm = Submission;

// The 25 forms. Framers alternate days, so each day has two or three forms, and today the second and
// fourth framers have none (so "Not submitted today" has names in it). Sites rotate day by day.
function planSampleForms(framerIds: string[], siteIds: string[]): SampleForm[] {
  const today = todayInCompanyTimezone();
  const forms: SampleForm[] = [];
  for (let daysAgo = 0; daysAgo < 10; daysAgo++) {
    const workDate = addDays(today, -daysAgo);
    framerIds.forEach((userId, f) => {
      if ((f + daysAgo) % 2 !== 0) return;
      const n = forms.length + 1;
      const hazards = n % 6 === 0; // a few forms report hazards, and those always come with notes
      const checklist = Object.fromEntries(
        CHECKLIST_ITEMS.map((item) => [item.key, item.key === "hazards_identified" ? hazards : Math.random() < 0.85]),
      ) as ChecklistValues;
      forms.push({
        id: sampleId(n),
        user_id: userId,
        site_id: siteIds[(f + daysAgo) % siteIds.length],
        work_date: workDate,
        ...checklist,
        // Every third form has notes. Math.floor(n / 6) counts 0, 1, 2, 3 across them, so each note gets used.
        notes: hazards
          ? HAZARD_NOTES[Math.floor(n / 6) % HAZARD_NOTES.length]
          : n % 3 === 0
            ? OTHER_NOTES[Math.floor(n / 6) % OTHER_NOTES.length]
            : null,
        status: daysAgo >= 5 && f % 2 === 0 ? "reviewed" : "submitted", // some older forms are already reviewed
        // Earlier days: sent before work, around 7 a.m. in Vancouver (Postgres understands the timezone name).
        created_at: daysAgo === 0 ? new Date().toISOString() : `${workDate} 07:${String(f * 10 + 5).padStart(2, "0")} America/Vancouver`,
      });
    });
  }
  return forms;
}

// Adds the sample forms that aren't there yet. Real forms (and test ones) are never touched.
export async function seedSubmissions(supabase: SupabaseClient, framerIds: string[], siteIds: string[]) {
  console.log("Sample submissions:");
  const forms = planSampleForms(framerIds, siteIds);
  const { data: existing, error } = await supabase.from("submissions").select("id").in("id", forms.map((form) => form.id));
  if (error) throw new Error(`Could not read submissions: ${error.message}`);
  const existingIds = new Set(existing.map((row) => row.id));

  let added = 0;
  for (const form of forms) {
    if (existingIds.has(form.id)) continue;
    const { error: insertError } = await supabase.from("submissions").insert(form);
    // 23505: that framer already sent their own form for this site and day (one per day), so theirs stays.
    if (insertError?.code === "23505") {
      console.log(`  skip  a sample for ${form.work_date}: that framer already has a form for this site and day`);
      continue;
    }
    if (insertError) throw new Error(`Could not add sample form ${form.id}: ${insertError.message}`);
    added++;
  }
  if (existingIds.size > 0) console.log(`  skip  ${existingIds.size} sample forms (already there)`);
  if (added > 0 || existingIds.size === 0) console.log(`  added ${added} sample forms`);

  await attachSamplePhotos(supabase, forms.filter((_, index) => index % 5 === 0)); // a handful: every fifth form
}

// Images in scripts/seed-photos/ that the bucket accepts (JPEG, PNG or WebP, 10 MB or less).
function readSeedPhotos(): { name: string; type: string; body: Buffer }[] {
  if (!existsSync(PHOTOS_FOLDER)) return [];
  return readdirSync(PHOTOS_FOLDER).flatMap((name) => {
    const type = PHOTO_TYPES[name.slice(name.lastIndexOf(".")).toLowerCase()];
    if (!type) return [];
    const filePath = `${PHOTOS_FOLDER}/${name}`;
    if (statSync(filePath).size > MAX_PHOTO_BYTES) {
      console.log(`  skip  ${name} (over 10 MB)`);
      return [];
    }
    return [{ name, type, body: readFileSync(filePath) }];
  });
}

// Gives each chosen sample form one or two photos, in the same {user}/{submission}/{random}.{ext}
// layout the app uses. Forms that already have photos are left alone, so a re-run adds none twice.
async function attachSamplePhotos(supabase: SupabaseClient, chosen: SampleForm[]) {
  console.log("Sample photos:");
  const photos = readSeedPhotos();
  if (photos.length === 0) {
    console.log(`  skip  ${PHOTOS_FOLDER}/ has no JPEG, PNG or WebP images, so no photos were attached`);
    return;
  }

  const ids = chosen.map((form) => form.id);
  const [present, withPhotos] = await Promise.all([
    supabase.from("submissions").select("id").in("id", ids),
    supabase.from("submission_photos").select("submission_id").in("submission_id", ids),
  ]);
  if (present.error || withPhotos.error) throw new Error(`Could not read sample forms: ${(present.error ?? withPhotos.error)?.message}`);
  const presentIds = new Set(present.data.map((row) => row.id));
  const haveDone = new Set(withPhotos.data.map((row) => row.submission_id));
  const targets = chosen.filter((form) => presentIds.has(form.id) && !haveDone.has(form.id));

  let next = 0;
  for (const [index, form] of targets.entries()) {
    const rows = [];
    for (let k = 0; k < (index % 2 === 0 ? 1 : 2); k++) {
      const photo = photos[next++ % photos.length];
      const path = `${form.user_id}/${form.id}/${randomUUID()}.${photo.type.split("/")[1]}`;
      const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, photo.body, { contentType: photo.type });
      if (error) throw new Error(`Could not upload ${photo.name}: ${error.message}`);
      rows.push({ submission_id: form.id, storage_path: path });
    }
    const { error } = await supabase.from("submission_photos").insert(rows);
    if (error) throw new Error(`Could not attach photos to ${form.id}: ${error.message}`);
  }
  console.log(targets.length > 0 ? `  added photos to ${targets.length} sample forms` : "  skip  sample photos (already there)");
}
