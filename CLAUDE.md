# CLAUDE.md — coding conventions for RAS Safety

Copied verbatim from PROCESS.md §7. Follow these on every change.

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
