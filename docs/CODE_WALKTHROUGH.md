# RAS Safety: how it works

## The big picture

**Phone or laptop → the app on Vercel → Supabase.** The app (Next.js on Vercel) draws the pages. Supabase keeps everything that lasts: the logins, a Postgres database of sites and forms, and a private photo store. Photos go straight from the phone to Supabase, because Vercel caps uploads at 4.5 MB.

## Where things live

| Folder or file | What's in it |
|---|---|
| `src/app/` | One folder per page: `login`, and inside `(app)` the logged-in `submit`, `submissions`, `admin`. |
| `src/components/` | Page building blocks (SafetyForm, FilterBar…), one per file. |
| `src/lib/data/` | Every database read and write; pages never query directly. |
| `src/lib/` | Shared rules: limits (`constants.ts`), form checks (`validation.ts`), Vancouver "today" (`dates.ts`), server actions (`actions.ts`), data shapes (`types.ts`). |
| `src/lib/supabase/`, `src/proxy.ts` | The Supabase connection; keeps each login fresh. |
| `supabase/schema.sql` | The whole database: tables, security rules, photo store. |
| `scripts/` | `npm run seed`: test logins, sites, sample forms. |

## One form's journey

1. **Jasdeep, a framer, opens New form.** The server loads the active sites and today's date in Vancouver.
2. **Jasdeep fills it in and taps Submit.** The phone checks every rule first (`validation.ts`) and explains problems in plain English.
3. **The phone saves it** (`submitSafetyForm`): no earlier form for that site and day, photos uploaded into Jasdeep's own folder, then the form and its photo list saved.
4. **A green "Form submitted" note** shows the saved form. On any failure the form stays open with one clear message.
5. **Sarah, the supervisor, opens the Dashboard**: today per site, who hasn't submitted, a 7-day chart, and the filterable list.
6. **Sarah taps Mark reviewed**; the server checks the admin role and the badge turns green.

## How security works

- **Logins and roles:** an admin creates every login (no public sign-up). Each starts as a `framer`; becoming `admin` is a deliberate change in Supabase.
- **The database enforces it:** Row Level Security rules in `schema.sql` make the database itself refuse to show a framer anyone else's forms or photos.
- **Private photos:** each phone uploads only into its owner's folder; pages show photos through links that expire after an hour.
- **Keys:** the app holds only the "publishable" key, which can't get past those rules. The "secret" key is for the seed script on a developer's computer, never Vercel.

## How to… (in the Supabase dashboard, unless a file is named)

**Add a site.** Table Editor → `sites` → Insert → Insert row; fill in `name` and `address`, Save. To retire one, set `is_active` to false: it leaves the form, its old forms stay on the dashboard.

**Add a worker.** Authentication → Users → Add user → Create new user; email, password, keep "Auto Confirm User" ticked. Then fix their `full_name` in Table Editor → `profiles` (it starts as the email's first part) and give them the login.

**Remove a worker.** No forms sent: Authentication → Users → open them → Delete user. With forms, Supabase refuses ("Database error deleting user") so the safety records stay; block the login instead in SQL Editor (`null` undoes it):
`update auth.users set banned_until = 'infinity' where email = 'name@example.com';`

**Make someone an admin.** Table Editor → `profiles` → set `role` to `admin`, Save.

**Add a checklist item**, e.g. a first aid kit:
1. SQL Editor: `alter table public.submissions add column first_aid_kit boolean not null default false;` Then add that column to `submissions` in `supabase/schema.sql`.
2. `src/lib/types.ts`: add `"first_aid_kit"` to `ChecklistKey` and `first_aid_kit: boolean;` to `Submission`.
3. `src/lib/constants.ts`: add `{ key: "first_aid_kit", label: "First aid kit on site" }` to `CHECKLIST_ITEMS`.
4. Add the column to `docs/erd.mmd` and the README diagram, then re-render `docs/erd.png` (the command is at the top of `erd.mmd`). The form, detail page and seed follow `CHECKLIST_ITEMS` by themselves; push to `main` to redeploy.

**Change colours or logo.** Colours: the `--color-ras-…` lines in `src/app/globals.css` and the three at the top of `src/components/SiteChart.tsx` (dashboard chart). Logo: replace `public/ras-logo.png` (same name).

**Export to a spreadsheet.** Table Editor → `…` beside `submissions` → Export data → Export table as CSV (with ids). For names, run this in SQL Editor, then download the results as CSV:
`select p.full_name as worker, si.name as site, s.* from submissions s join profiles p on p.id = s.user_id join sites si on si.id = s.site_id order by s.work_date desc;`
