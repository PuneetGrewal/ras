# RAS Safety

Daily site safety forms for Ron Anderson & Sons (RAS) crews. Before starting work, each framer fills in a short checklist with photos on their phone; supervisors (admins) see every submission on a dashboard, with filters, photos and a summary of who has and hasn't submitted today.

> Work in progress — sections marked _TODO_ are filled in as the build proceeds (see `PROCESS.md`).

## Deployed app

_TODO (Step 7)_

## Test credentials

_TODO (Step 8)_

## Tech stack

- **Next.js** (App Router, TypeScript) with **Tailwind CSS** — the web app, hosted on **Vercel**
- **Supabase** — Postgres database, email + password login, private photo storage, and Row Level Security (the database itself decides who can see which rows)

## Local setup

_TODO (Step 8)_

## Deployment

_TODO (Step 8)_

## Data model (ERD)

_TODO (Step 8)_

## Assumptions

Decisions made where the brief left a gap:

- **Status** goes `submitted` → `reviewed`. An admin clicks **Mark reviewed** on the submission's detail page.
- **One submission per worker, per site, per day** (enforced by a unique constraint in the database). A second attempt shows a clear error.
- **Photos:** 1–5 required per submission, JPEG, PNG or WebP only, 10 MB or less each. iPhones convert HEIC photos to JPEG automatically for this upload field. The field deliberately has no `capture` attribute, so phones offer the "Take photo / Photo library" choice.
- **Notes** are optional (up to 1000 characters) **unless "Hazards identified" is checked — then notes are required**.
- **"Today"** means today in the `America/Vancouver` timezone, not the server's UTC clock.
- **Date:** the form starts on today and refuses future dates. Earlier dates are allowed, so a framer can still send a form they forgot.
- **Dashboard summary:** "Last 7 days" means today and the 6 days before it. "Not submitted today" lists framers with no form for any site today. A switched-off site only appears in the summary when it has forms in that period. The worker filter lists framers.
- **Sample data:** `npm run seed` adds 25 sample forms over the last 10 days. Their ids start with `5eed`, so running the seed again never adds the same one twice, it never touches forms people have sent (a sample that would clash with one is skipped), and they are easy to find and delete in the Supabase table editor before going live. Running `npm run seed` again after deleting them puts them back. (PROCESS.md planned "only when the table is empty"; this lets the samples sit next to forms made while testing.) Only a handful get photos, from `scripts/seed-photos/`; the rest are demo data without the app's one-photo minimum.
- **Workers added in the Supabase dashboard** get the part of their email before the @ as their name (the dashboard's "Add user" form has no name field); edit `full_name` in the `profiles` table to fix it.
- **Safety records are kept:** a worker who has submitted forms can't be deleted from the database, because their submissions point at them.
- **Out of scope:** self-signup, a password-reset screen, editing or deleting submissions, a site-management screen, and pagination. Workers and sites are added in the Supabase dashboard (steps in `docs/CODE_WALKTHROUGH.md`).

## Manual test checklist

_TODO (Step 8)_

## Known limitations

- Photos upload straight from the phone before the form is saved. If a later step fails (e.g. the connection drops), the uploaded files stay in Storage unused; the framer sees an error and can send the form again.
- In the rare case the form saves but its photo list doesn't, the framer is told to contact their supervisor, because submissions can't be edited or deleted in the app.
- The dashboard shows every matching submission on one page (no pagination, as the brief asks). Supabase returns at most 1,000 rows per request, so beyond that the date filters are needed to see older forms.

_TODO (Step 8)_
