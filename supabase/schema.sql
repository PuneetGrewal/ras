-- RAS Safety: the whole database in one file (tables, sign-up trigger, security rules, photo storage).
-- Paste into Supabase → SQL Editor, click Run, then "Run query" on the warning (it only means old rules get replaced). Safe to run again.
-- In the rules below, "(select auth.uid())" means "the id of the person logged in".


-- ─── Tables ──────────────────────────────────────────────────────────────────

-- profiles: one row per login with the person's name and role (framer or admin).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'framer' check (role in ('framer', 'admin')),
  created_at timestamptz not null default now()
);

-- sites: the construction sites crews fill in forms for.
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- submissions: one safety form per worker, per site, per day; notes are capped and required when hazards are ticked.
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  site_id uuid not null references public.sites (id),
  work_date date not null,
  ppe_hard_hat boolean not null default false,
  ppe_vest boolean not null default false,
  ppe_boots boolean not null default false,
  ppe_eye_protection boolean not null default false,
  fall_protection boolean not null default false,
  ladders_scaffolding_inspected boolean not null default false,
  tools_cords_ok boolean not null default false,
  hazards_identified boolean not null default false,
  notes text,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  created_at timestamptz not null default now(),
  constraint one_submission_per_worker_site_day unique (user_id, site_id, work_date),
  constraint notes_max_1000_chars check (char_length(notes) <= 1000),
  constraint notes_required_when_hazards check (not hazards_identified or btrim(coalesce(notes, '')) <> '')
);

-- submission_photos: one row per photo, pointing at the image file in Storage.
create table if not exists public.submission_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- Indexes so looking up a site's submissions and a submission's photos stays fast (user_id is covered by the unique rule).
create index if not exists submissions_site_id_idx on public.submissions (site_id);
create index if not exists submission_photos_submission_id_idx on public.submission_photos (submission_id);


-- ─── New logins get a profile ────────────────────────────────────────────────

-- Creates the profile for each new user: always as a framer (so nobody can sign up as admin), named from their metadata or else their email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    'framer'
  );
  return new;
end;
$$;

-- Nobody calls handle_new_user() directly; only the trigger below runs it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Runs handle_new_user() after every new row in Supabase's own users table.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── Who is an admin? ────────────────────────────────────────────────────────

-- True when the logged-in user is an admin; "security definer" lets it read profiles without looping through the profiles rule.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Only logged-in users can run is_admin(), and it only ever answers "am I an admin?".
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;


-- ─── Security rules (Row Level Security) ─────────────────────────────────────

-- Turn on row-level security: unless a rule below allows it, the database shows nothing and refuses every change.
alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_photos enable row level security;

-- profiles: see your own row; admins see everyone. Nobody edits profiles from the app (the trigger creates them).
drop policy if exists "Read own profile, admins read all" on public.profiles;
create policy "Read own profile, admins read all" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

-- sites: anyone logged in can see the list of sites.
drop policy if exists "Logged-in users read sites" on public.sites;
create policy "Logged-in users read sites" on public.sites
  for select to authenticated
  using (true);

-- sites: only admins can add a site.
drop policy if exists "Admins add sites" on public.sites;
create policy "Admins add sites" on public.sites
  for insert to authenticated
  with check ((select public.is_admin()));

-- sites: only admins can change a site.
drop policy if exists "Admins update sites" on public.sites;
create policy "Admins update sites" on public.sites
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- submissions: framers see their own; admins see all.
drop policy if exists "Read own submissions, admins read all" on public.submissions;
create policy "Read own submissions, admins read all" on public.submissions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- submissions: you can only submit a form as yourself, it starts as 'submitted', and its time is the real time (no backdating).
drop policy if exists "Submit own forms" on public.submissions;
create policy "Submit own forms" on public.submissions
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'submitted' and created_at = now());

-- submissions: only admins can change a submission (to mark it reviewed).
drop policy if exists "Admins update submissions" on public.submissions;
create policy "Admins update submissions" on public.submissions
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- submission_photos: see photos on your own submissions; admins see all.
drop policy if exists "Read photos of own submissions, admins read all" on public.submission_photos;
create policy "Read photos of own submissions, admins read all" on public.submission_photos
  for select to authenticated
  using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_photos.submission_id and s.user_id = (select auth.uid())
    )
    or (select public.is_admin())
  );

-- submission_photos: you can only attach photos to your own submissions.
drop policy if exists "Add photos to own submissions" on public.submission_photos;
create policy "Add photos to own submissions" on public.submission_photos
  for insert to authenticated
  with check (
    exists (
      select 1 from public.submissions s
      where s.id = submission_photos.submission_id and s.user_id = (select auth.uid())
    )
  );


-- ─── Table access ────────────────────────────────────────────────────────────

-- Logged-in users may reach these tables (the rules above then pick the rows); logged-out visitors get nothing.
grant select on public.profiles to authenticated;
grant select, insert, update on public.sites to authenticated;
grant select, insert, update on public.submissions to authenticated;
grant select, insert on public.submission_photos to authenticated;

-- The seed script's secret key skips the rules above but still needs access to the tables.
grant select, insert, update, delete on public.profiles, public.sites, public.submissions, public.submission_photos to service_role;


-- ─── Photo storage ───────────────────────────────────────────────────────────

-- Private bucket for the photos (no public links); Storage itself refuses files over 10 MB or not JPEG/PNG/WebP.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('submission-photos', 'submission-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Uploading: you can only upload into the folder named after your own user id.
drop policy if exists "submission-photos: upload to own folder" on storage.objects;
create policy "submission-photos: upload to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submission-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- Viewing: you can open photos in your own folder; admins can open all of them.
drop policy if exists "submission-photos: read own folder, admins read all" on storage.objects;
create policy "submission-photos: read own folder, admins read all" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'submission-photos'
    and ((storage.foldername(name))[1] = (select auth.uid()::text) or (select public.is_admin()))
  );
