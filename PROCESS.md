# PROCESS.md — RAS Safety Form App

Build brief for Claude Code. Work through the steps in §9 **one at a time**.

**Kickoff prompt** (paste into Claude Code, run in an empty folder that contains this file and `ras-logo.png`):

> Read PROCESS.md fully, then do Step 0 and stop. For every later step: do only that step, finish with its "Done when" checks, commit, give me a summary of at most 10 lines (what you built + anything I must do manually), then stop and wait for me to say "next". Never work ahead, never add features that aren't in PROCESS.md.

---

## 1. What we're building

RAS (Ron Anderson & Sons — prefab wood framing and concrete formwork) runs crews on several construction sites. Before starting work, each **framer** fills in a site safety form on their phone: site, date, a checklist, notes, and one or more photos. **Admins** (supervisors) get a dashboard listing every submission, filters by site / worker / date range, a detail view with the photos, and a summary of who has and hasn't submitted today.

This is an internal RAS tool and a hiring-style deliverable: it is judged on **functionality, code quality, data modelling (ERD), and basic product/UX** (brand applied, mobile-friendly form, usable dashboard).

## 2. Priorities, in order

1. Works end-to-end exactly as described in §4.
2. Code a non-developer can follow during a walkthrough: small files, plain names, comments that explain *why*, no clever abstractions, no component library, no ORM.
3. Speed. Design is not a concern beyond brand colours, readable layout, and a form that works on a phone.

## 3. Stack (fixed — don't substitute)

- **Next.js** latest stable (App Router, TypeScript, `src/`), **Tailwind CSS**, npm.
- **Supabase**: Postgres, Auth (email + password), Storage (private bucket), Row Level Security.
- `@supabase/supabase-js` + `@supabase/ssr`. Follow the **current official Supabase "Server-Side Auth for Next.js" guide** for whatever Next.js version gets installed (cookie helpers, session refresh in the middleware/proxy file). Do not work from memory here — this API has changed several times.
- Hosting **Vercel**, repo on **GitHub**.
- Optional, Step 9 only: **Resend** (email), **Recharts** (one chart).

## 4. Requirements (client's words, condensed)

| Area | Must have |
|---|---|
| Branding | RAS logo + colours throughout; looks like an internal RAS product |
| Mobile | Framer side usable on a phone |
| Auth | Login with credentials. Roles: `framer`, `admin`. Framers create/view **only their own** submissions; admins view **all** |
| Form | Select site + date; worker name comes from the logged-in user. Checklist: hard hat, vest, boots, eye protection, fall protection in place, ladders/scaffolding inspected, tools & cords in good condition, hazards identified. Free-text notes. Photo upload (1+ photos), stored and viewable later. Validation (required fields, file type/size). Clear success/error message |
| Dashboard | List: worker, site, date, status. Filter by site, worker, date range. Who submitted on each site. Detail view with photos. Simple summary (submissions per site, who hasn't submitted today). Chart = bonus |
| Data | Seed data allowed (sites, workers, submissions) |
| Deliverables | Deployed URL, GitHub repo, README (setup, stack, assumptions), test credentials (1 admin + 1 framer), ERD image/PDF linked from README |

**Our decisions on the gaps** (record these under "Assumptions" in the README):
- `status` = `submitted` → `reviewed`. Admin clicks **Mark reviewed** on the detail page.
- One submission per worker **per site per day** (unique constraint). Clear error if they try again.
- Photos: **1–5 required**, `image/jpeg | image/png | image/webp`, **≤ 10 MB each**. (iOS converts HEIC to JPEG automatically for a file input with those `accept` types. Don't add the `capture` attribute — the user should get the "Take photo / Photo library" choice.)
- Notes optional (≤ 1000 chars) **unless "Hazards identified" is checked — then notes are required**.
- "Today" = today in `America/Vancouver`, not server UTC.
- No self-signup, no password reset UI, no editing/deleting submissions, no site-management UI, no pagination. Workers and sites are added in the Supabase dashboard (documented in the walkthrough).

## 5. Brand

Colours (sampled from the real logo):

| Token | Hex | Use |
|---|---|---|
| `ras-green` | `#194833` | Header bar, primary buttons, active states, status "reviewed" |
| `ras-charcoal` | `#252425` | Body text, headings |
| `ras-grey` | `#515151` | Secondary text, labels, borders |
| white | `#FFFFFF` | Page background, text on green |

Use Tailwind's neutral greys for subtle borders/backgrounds. Logo: `public/ras-logo.png` (white mark on green — I supply it; copy it there in Step 1). App name: **RAS Safety**. Header = green bar, logo left, nav + user name + role + Sign out right. That is the whole design brief.

## 6. Data model

```
profiles            1 row per auth user (created by a DB trigger on auth.users insert; role is ALWAYS 'framer'
                    at creation — admins are promoted by updating the row, so nobody can self-register as admin)
  id uuid PK → auth.users.id (on delete cascade)
  full_name text NOT NULL
  role text NOT NULL CHECK (role IN ('framer','admin')) DEFAULT 'framer'
  created_at timestamptz DEFAULT now()

sites
  id uuid PK DEFAULT gen_random_uuid()
  name text NOT NULL
  address text
  is_active boolean NOT NULL DEFAULT true
  created_at timestamptz DEFAULT now()

submissions
  id uuid PK DEFAULT gen_random_uuid()   (the form passes its own id, see §9 Step 4; seed uses the default)
  user_id uuid NOT NULL → profiles.id
  site_id uuid NOT NULL → sites.id
  work_date date NOT NULL
  ppe_hard_hat, ppe_vest, ppe_boots, ppe_eye_protection,
  fall_protection, ladders_scaffolding_inspected,
  tools_cords_ok, hazards_identified     boolean NOT NULL DEFAULT false (8 columns)
  notes text
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed'))
  created_at timestamptz DEFAULT now()
  UNIQUE (user_id, site_id, work_date)

submission_photos
  id uuid PK DEFAULT gen_random_uuid()
  submission_id uuid NOT NULL → submissions.id (on delete cascade)
  storage_path text NOT NULL        -- path inside the 'submission-photos' bucket
  created_at timestamptz DEFAULT now()
```

Storage: private bucket `submission-photos`, object path `{user_id}/{submission_id}/{random}.{ext}`. Photos are shown through **signed URLs** (1 hour) generated on the server.

Security (RLS on all four tables):
- Helper `public.is_admin()` — `security definer`, `stable`, returns true if the current user's profile role is `admin`. Using a definer function avoids RLS recursion on `profiles`.
- `profiles`: select own row or `is_admin()`. No client inserts/updates (the trigger inserts).
- `sites`: select for any logged-in user; insert/update only `is_admin()`.
- `submissions`: select own or `is_admin()`; insert only where `user_id = auth.uid()`; update only `is_admin()`.
- `submission_photos`: select/insert only if the parent submission is mine, or select if `is_admin()`.
- `storage.objects` for bucket `submission-photos`: insert only where the first folder = `auth.uid()`; select where first folder = `auth.uid()` or `is_admin()`.

## 7. Conventions (copy verbatim into `CLAUDE.md` in Step 1)

- TypeScript strict, no `any`. One component per file, PascalCase. Keep files under ~150 lines; split when longer.
- Every file starts with a 1–3 line comment: what it is and why it exists. Comments explain decisions, not syntax.
- All database access goes through functions in `src/lib/data/*.ts`. Each takes a Supabase client as its first argument so the same function works from a server component (server client) or a client component (browser client). Pages and components never call `supabase.from(...)` directly.
- Hand-written types in `src/lib/types.ts` that mirror `supabase/schema.sql`. No generated types, no ORM.
- Checklist items are defined once in `src/lib/constants.ts` as `CHECKLIST_ITEMS: { key, label }[]` where `key` equals the column name. The form, the detail view, and the seed script all iterate this array.
- Every user action ends in a visible success or error message in plain English ("Photo must be under 10 MB"). Never swallow errors; log unexpected ones with `console.error`.
- Plain Tailwind classes only. No component library, no CSS modules, no animations. Native `<select>`, `<input type="date">`, `<input type="file" multiple>`. Plain `<img>` for photos (turn off the `@next/next/no-img-element` lint rule).
- Server components read data. Client components only where interaction needs them (login form, safety form, filter bar). Mutations go through server actions in `src/lib/actions.ts` — **except** the safety form, which writes from the browser because file uploads must go straight to Supabase Storage (Vercel caps request bodies at 4.5 MB).
- Dates: `COMPANY_TIMEZONE = 'America/Vancouver'` in constants; `todayInCompanyTimezone()` in `src/lib/dates.ts` is the only way "today" is computed.
- No features beyond PROCESS.md §4. When something is ambiguous, pick the simplest option and record it under "Assumptions" in `README.md`.
- `npm run lint` and `npm run build` must pass before every commit. One commit per step: `step N: <summary>`.
- Secrets live only in `.env.local` (gitignored). `.env.example` lists every variable with a one-line comment.

## 8. Target folder layout

```
src/app/
  layout.tsx                  html shell, metadata, favicon
  page.tsx                    no session → /login; admin → /admin; framer → /submit
  login/page.tsx
  (app)/layout.tsx            requires a session, loads profile, renders <Header>
  (app)/submit/page.tsx       framer: the safety form
  (app)/submissions/page.tsx  framer: my submissions
  (app)/submissions/[id]/page.tsx   detail — framer sees own, admin sees any (RLS decides)
  (app)/admin/page.tsx        dashboard: summary + filters + table (redirects framers to /submit)
src/components/   Header, SafetyForm, PhotoInput, ChecklistField, SubmissionTable,
                  FilterBar, SummaryCards, PhotoGallery, StatusBadge, Message
src/lib/supabase/ client.ts, server.ts, middleware.ts (names per current Supabase guide)
src/lib/data/     sites.ts, submissions.ts, photos.ts, summary.ts, profiles.ts
src/lib/          actions.ts, constants.ts, types.ts, validation.ts, dates.ts
supabase/schema.sql           the whole database: tables, trigger, RLS, bucket, storage policies
scripts/seed.ts  scripts/seed-photos/   seed users, sites, sample submissions
docs/erd.mmd  docs/erd.png  docs/CODE_WALKTHROUGH.md
PROCESS.md  CLAUDE.md  README.md  .env.example
```

## 9. Steps

Protocol for every step: do only this step → run `npm run lint && npm run build` → commit `step N: …` → ≤10-line summary → **stop**. Lines marked **STOP: Puneet** are things only I can do; list them in the summary and wait.

### Step 0 — Read and confirm
Read this whole file. Check what's installed: `node -v`, `npm -v`, `gh --version`, `vercel --version`, `supabase --version`. Ask at most 3 questions, and only if something genuinely blocks Step 1. Otherwise say "ready" and stop.

### Step 1 — Scaffold, brand, conventions
- `npx create-next-app@latest .` — TypeScript, Tailwind, ESLint, App Router, `src/` dir, `@/*` alias. Then `npm i @supabase/supabase-js @supabase/ssr` and dev deps `tsx dotenv`.
- Brand colours from §5 as Tailwind theme tokens in `globals.css`. Move `ras-logo.png` to `public/`. Set metadata title "RAS Safety"; use the logo as favicon if trivial, skip otherwise.
- Create `CLAUDE.md` (= §7 verbatim), `.env.example`, `src/lib/constants.ts` (CHECKLIST_ITEMS, photo rules, timezone, test-account constants), `src/lib/types.ts` (Profile, Site, Submission, SubmissionPhoto, plus `SubmissionWithRelations` for list rows), `src/lib/dates.ts`, a README skeleton with the §4 "Assumptions" list already filled in.
- Replace the default home page with a temporary page that shows the green header with the logo (proves the brand tokens work). `git init`, first commit.

**Done when:** `npm run dev` shows the green header + logo; lint and build pass; committed.

### Step 2 — Database
- Write `supabase/schema.sql`: everything in §6 — tables, constraints, `handle_new_user()` trigger that creates the `profiles` row with `full_name` from `raw_user_meta_data` and role hard-coded to `framer`, `is_admin()`, `enable row level security` on all tables, every policy, the storage bucket (`insert into storage.buckets … public = false`) and its policies. Make it re-runnable (`create table if not exists`, `drop policy if exists …` before each `create policy`). Comment each block in one line of plain English — this file is shown to the client.
- Draft `docs/erd.mmd` (Mermaid `erDiagram`) from the same schema so the two never drift.

**STOP: Puneet** — create the Supabase project (free tier, region Canada Central), paste `schema.sql` into the SQL editor and run it, turn **off** "Allow new users to sign up" (Authentication → Sign In / Providers — the app has no signup page), then fill `.env.local` from `.env.example`: the project URL, the publishable/anon key, and the service role key (seed script only — never shipped to Vercel). Use whatever variable names the Supabase guide uses; `.env.example` is the source of truth.

**Done when:** schema runs clean in the SQL editor (I confirm); `.env.local` filled; committed.

### Step 3 — Auth, app shell, seed users
- `src/lib/supabase/*` per the current Supabase Next.js guide, including the session-refresh middleware/proxy.
- `/login`: client component — email, password, submit, loading state, error message. On success go to `/`, which redirects by role.
- `(app)/layout.tsx`: no session → `/login`; load profile; render `<Header>` (logo, nav by role — framer: New form / My submissions; admin: Dashboard — user name, role, Sign out via a server action).
- Placeholder pages for `/submit`, `/submissions`, `/admin` ("Step 4/5"). `/admin` redirects non-admins to `/submit`.
- `scripts/seed.ts` + `"seed": "tsx scripts/seed.ts"` in package.json. Uses the service role key via `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })`. Creates 1 admin (`admin@example.com` / `RasAdmin2026!` — created as a framer by the trigger, then promoted with an `update profiles set role = 'admin'`) and 5 framers (`first.last@example.com` / `RasFramer2026!`) with realistic names, and 4–5 sites with plausible BC construction-site names. Idempotent: skip anything that already exists. Run it.

**STOP: Puneet** — log in as admin and as a framer, desktop and phone (`npm run dev -- -H 0.0.0.0` and open the LAN IP on the phone).

**Done when:** both roles log in and land on the right page; Sign out works; visiting `/admin` logged-out → `/login`; framer visiting `/admin` → `/submit`; committed.

### Step 4 — Framer side
- `/submit` → `<SafetyForm>` (client): site `<select>` of active sites, date defaulting to today (company timezone, max = today), one `<ChecklistField>` per `CHECKLIST_ITEMS` entry (full-width tappable label rows, 44 px+ tall), notes textarea, `<PhotoInput>` (multiple, accept types from constants, shows thumbnails + per-file validation errors, remove button).
- `src/lib/validation.ts` holds the rules from §4 and returns plain-English messages. Validate on the client before any upload.
- Submit flow, in `src/lib/data/submissions.ts` as `submitSafetyForm(supabase, input)`, with the steps commented in order:
  1. Check no submission exists for (me, site, date) → friendly error if it does.
  2. `submissionId = crypto.randomUUID()`.
  3. Upload each photo to `{userId}/{submissionId}/{randomUUID}.{ext}`.
  4. Insert the `submissions` row (with that id), then the `submission_photos` rows.
  5. Any failure → one clear error, stay on the form. Success → `router.push('/submissions/' + id + '?created=1')`.
- `/submissions`: my submissions, newest first — date, site, photo count, status badge, link to detail.
- `/submissions/[id]`: server component; `getSubmissionById(supabase, id)` returns null when RLS hides it → `notFound()`. Shows worker, site, date, submitted time, checklist as ✓/✗ list, notes, `<PhotoGallery>` using signed URLs from `getSignedPhotoUrls(supabase, paths)`. Green "Form submitted" banner when `?created=1`.

**Done when:** on a phone, a framer submits a form with 2 photos and sees it with the photos in the detail view; every validation rule from §4 produces its message; a second submission for the same site/day is refused with a clear message; committed.

### Step 5 — Admin side
- `/admin` (server component). Filters live in the URL: `?site=&worker=&from=&to=`. `<FilterBar>` (client) has site select, worker select, from/to dates, Apply + Clear — it only pushes search params.
- `getSubmissions(supabase, filters)` joins `profiles(full_name)`, `sites(name)` and a photo count; newest first. `<SubmissionTable>`: worker, site, date, submitted time, photos, status, "View" link. Table scrolls horizontally on small screens. Empty state text when nothing matches.
- `<SummaryCards>` from `src/lib/data/summary.ts`: (a) **Today by site** — each site with its count and the names who submitted; (b) **Not submitted today** — framers with no submission today; (c) **Last 7 days** — total per site.
- Detail page: when the viewer is admin and status is `submitted`, show **Mark reviewed** → server action `markSubmissionReviewed(id)` in `actions.ts` → `revalidatePath`. Header back-link goes to `/admin` for admins, `/submissions` for framers.

**Done when:** admin sees all submissions, every filter works alone and combined, summary matches the table, Mark reviewed flips the badge, a framer cannot open another worker's detail URL (404); committed.

### Step 6 — Seed sample submissions
- Extend `scripts/seed.ts`: if `submissions` is empty, create ~25 submissions over the last 10 days spread across framers and sites (random checklist values, some with notes, a few with `hazards_identified = true`, a few `reviewed`). Leave one or two framers without a submission today so the "Not submitted today" card has content.
- If `scripts/seed-photos/` contains images, attach 1–2 of them to a handful of submissions (upload via service role, paths per §6). If the folder is empty, skip photos and say so.
- Run it. `npm run seed` must stay re-runnable without duplicating.

**Done when:** dashboard and summary look populated with the seed data; committed.

### Step 7 — Deploy
- Push to GitHub: `gh repo create ras-safety --public --source=. --push` if `gh` is authenticated; otherwise tell me and I'll create the repo and give you the remote.

**STOP: Puneet** — Vercel → Import the repo → add env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only → Deploy. In Supabase → Authentication → URL Configuration set Site URL to the Vercel URL. Then test on a phone over the real URL: login, submit with camera photos, admin view.

**Done when:** the public URL works for both roles end to end; the URL is in the README; committed.

### Step 8 — Documentation (the client-facing part)
- `docs/erd.mmd` final + render `docs/erd.png` with `npx -y @mermaid-js/mermaid-cli -i docs/erd.mmd -o docs/erd.png`. If the renderer fails (it needs a headless browser), say so and I'll export it at mermaid.live.
- `README.md`: what it is, deployed URL, test credentials, tech stack, local setup (clone → `.env.local` → run `schema.sql` → `npm run seed` → `npm run dev`), deployment steps, ERD (Mermaid inline + link to the PNG), Assumptions, manual test checklist (the Done-when checks of Steps 4–5), known limitations.
- `docs/CODE_WALKTHROUGH.md`, written for a non-developer with me presenting, ≤ 2 pages: the big picture (phone → Next.js on Vercel → Supabase), folder map one line each, the life of one submission from tap to dashboard, how security works in plain English (login, roles, "the database itself refuses to show a framer other people's rows"), and how-to recipes: add a site, add/remove a worker, make someone admin, add a checklist item (list the exact 3–4 places to touch), change colours/logo, export submissions to CSV from the Supabase table editor.

**Done when:** README and walkthrough read cleanly top to bottom; ERD image is linked and matches `schema.sql`; committed and pushed.

### Step 9 — Optional extras (only if I say so; one at a time)
- **Email notification to admin** on each new submission: `npm i resend`; server action `notifyAdminOfSubmission(submissionId)` called by the form after a successful save; it re-reads the submission server-side (RLS confirms it's the caller's), emails `ADMIN_NOTIFICATION_EMAIL` with worker, site, date, hazards flag and a link to the detail page. Env: `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`, `NEXT_PUBLIC_APP_URL`. Email failure must never fail the submission. Note in README: without a verified domain, Resend only delivers to the Resend account owner's own address from `onboarding@resend.dev`.
- **Chart**: `npm i recharts`; one bar chart on `/admin` — submissions per site, last 7 days — fed by the existing summary function. Client component, brand green bars, nothing else.

## 10. Puneet's manual checklist (all STOP points in one place)

1. Before Step 1: empty folder with `PROCESS.md` + `ras-logo.png`; GitHub + Vercel + Supabase accounts logged in; Node 20+.
2. After Step 2: create Supabase project → run `schema.sql` → turn off public signups → fill `.env.local`.
3. After Step 3: test login both roles, desktop + phone.
4. After Step 7: Vercel import + 2 env vars; Supabase Site URL; phone test on the real URL.
5. Deliverables to hand over: Vercel URL, repo link, README (creds + assumptions), `docs/erd.png`.
