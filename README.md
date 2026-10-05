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
- **Out of scope:** self-signup, a password-reset screen, editing or deleting submissions, a site-management screen, and pagination. Workers and sites are added in the Supabase dashboard (steps in `docs/CODE_WALKTHROUGH.md`).

## Manual test checklist

_TODO (Step 8)_

## Known limitations

_TODO (Step 8)_
