// The safety form's rules (PROCESS.md §4), each with a plain-English message. The form checks
// these in the browser before uploading anything; the database repeats the key ones as a backstop.
import { ACCEPTED_PHOTO_TYPES, MAX_NOTES_LENGTH, MAX_PHOTO_BYTES, MAX_PHOTOS, MIN_PHOTOS } from "./constants";
import { todayInCompanyTimezone } from "./dates";

// The parts of the form that have rules. (Checklist ticks are free choices, so they have none.)
export type SafetyFormValues = {
  siteId: string;
  workDate: string; // "YYYY-MM-DD" from the date picker, or "" when it is empty or invalid
  hazardsIdentified: boolean;
  notes: string;
  photos: File[];
};

// At most one message per field. An empty object means the form is ready to send.
export type SafetyFormErrors = Partial<Record<"site" | "workDate" | "notes" | "photos", string>>;

const BYTES_PER_MB = 1024 * 1024;

// The problem with one chosen photo, or null if it is fine. Shown under that photo's thumbnail.
export function photoError(file: File): string | null {
  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    return `"${file.name}" isn't a photo we can use. Choose a JPEG, PNG or WebP image.`;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    // Rounded up so a file just over the limit never reads as exactly "10 MB".
    const sizeMb = Math.ceil((file.size / BYTES_PER_MB) * 10) / 10;
    return `"${file.name}" is ${sizeMb} MB. Each photo must be ${MAX_PHOTO_BYTES / BYTES_PER_MB} MB or less.`;
  }
  return null;
}

// Checks the whole form and returns a message for each field that needs fixing.
export function validateSafetyForm(values: SafetyFormValues): SafetyFormErrors {
  const errors: SafetyFormErrors = {};

  if (!values.siteId) errors.site = "Choose a site.";

  // Dates are "YYYY-MM-DD", so comparing them as text compares them as dates.
  if (!values.workDate) errors.workDate = "Choose the date.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.workDate)) errors.workDate = "Enter a valid date.";
  else if (values.workDate > todayInCompanyTimezone()) errors.workDate = "The date can't be in the future.";

  const notes = values.notes.trim();
  if (values.hazardsIdentified && !notes) {
    errors.notes = "You ticked “Hazards identified”, so describe the hazards in the notes.";
  } else if (notes.length > MAX_NOTES_LENGTH) {
    errors.notes = `Notes must be ${MAX_NOTES_LENGTH} characters or fewer (you have ${notes.length}).`;
  }

  const photoCount = values.photos.length;
  if (photoCount < MIN_PHOTOS) errors.photos = "Add at least one photo.";
  else if (photoCount > MAX_PHOTOS) errors.photos = `You can add up to ${MAX_PHOTOS} photos. Remove ${photoCount - MAX_PHOTOS}.`;
  else if (values.photos.some((file) => photoError(file))) errors.photos = "Remove the photos marked with a problem.";

  return errors;
}
