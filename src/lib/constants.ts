// App-wide constants: the safety checklist, photo and notes rules, the company
// timezone and the test accounts. Defined once here so every part of the app agrees.
import type { ChecklistKey } from "./types";

// The checklist a framer ticks before work. `key` is the matching column in the
// submissions table; the form, the detail view and the seed script all loop over this.
export const CHECKLIST_ITEMS: { key: ChecklistKey; label: string }[] = [
  { key: "ppe_hard_hat", label: "Hard hat" },
  { key: "ppe_vest", label: "Safety vest" },
  { key: "ppe_boots", label: "Safety boots" },
  { key: "ppe_eye_protection", label: "Eye protection" },
  { key: "fall_protection", label: "Fall protection in place" },
  { key: "ladders_scaffolding_inspected", label: "Ladders / scaffolding inspected" },
  { key: "tools_cords_ok", label: "Tools & cords in good condition" },
  { key: "hazards_identified", label: "Hazards identified" },
];

// Photo rules: every submission needs 1–5 photos, JPEG/PNG/WebP, 10 MB or less each.
export const MIN_PHOTOS = 1;
export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_PHOTO_TYPES: string[] = ["image/jpeg", "image/png", "image/webp"];

// Photos live in a private Storage bucket and are shown through links that expire after 1 hour.
export const PHOTO_BUCKET = "submission-photos";
export const SIGNED_URL_SECONDS = 60 * 60;

// Notes are optional and capped; they become required when "Hazards identified" is ticked.
export const MAX_NOTES_LENGTH = 1000;

// The crews work in BC, so "today" means today in Vancouver, not the server's UTC clock.
export const COMPANY_TIMEZONE = "America/Vancouver";

// Test accounts created by scripts/seed.ts and listed in the README.
export const TEST_ADMIN_EMAIL = "admin@example.com";
export const TEST_ADMIN_PASSWORD = "RasAdmin2026!";
export const TEST_FRAMER_PASSWORD = "RasFramer2026!";
