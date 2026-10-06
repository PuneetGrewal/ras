// TypeScript shapes for our database rows, written by hand to mirror
// supabase/schema.sql. When a column changes there, change it here too.

export type Role = "framer" | "admin";

export type SubmissionStatus = "submitted" | "reviewed";

// One row in `profiles`: the app's record of each login (name + role).
export type Profile = {
  id: string; // same id as the Supabase Auth user
  full_name: string;
  role: Role;
  created_at: string;
};

// One row in `sites`: a construction site crews can submit forms for.
export type Site = {
  id: string;
  name: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
};

// The eight yes/no checklist columns on `submissions`. CHECKLIST_ITEMS in
// constants.ts uses these as its keys, so a typo there fails to compile.
export type ChecklistKey =
  | "ppe_hard_hat"
  | "ppe_vest"
  | "ppe_boots"
  | "ppe_eye_protection"
  | "fall_protection"
  | "ladders_scaffolding_inspected"
  | "tools_cords_ok"
  | "hazards_identified";

// One row in `submissions`: a framer's safety form for one site on one day.
export type Submission = {
  id: string;
  user_id: string;
  site_id: string;
  work_date: string; // "YYYY-MM-DD", a calendar day with no time or timezone
  ppe_hard_hat: boolean;
  ppe_vest: boolean;
  ppe_boots: boolean;
  ppe_eye_protection: boolean;
  fall_protection: boolean;
  ladders_scaffolding_inspected: boolean;
  tools_cords_ok: boolean;
  hazards_identified: boolean;
  notes: string | null;
  status: SubmissionStatus;
  created_at: string;
};

// One row in `submission_photos`: points at a photo file in Storage.
export type SubmissionPhoto = {
  id: string;
  submission_id: string;
  storage_path: string; // path inside the 'submission-photos' bucket
  created_at: string;
};

// A submission plus the names and photo count the list tables show.
// The functions in src/lib/data flatten Supabase's joined rows into this shape.
export type SubmissionWithRelations = Submission & {
  worker_name: string;
  site_name: string;
  photo_count: number;
};

// The eight checklist answers, keyed by column name, as the safety form collects them.
export type ChecklistValues = Record<ChecklistKey, boolean>;

// Everything the detail page shows about one submission: the row, the names and its photos.
export type SubmissionDetail = Submission & {
  worker_name: string;
  site_name: string;
  photos: SubmissionPhoto[];
};
