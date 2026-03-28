-- =============================================================================
-- InvestMind: profiles table — run ONCE in Supabase → SQL Editor → Run
-- Idempotent: safe to re-run; adds missing columns and recreates policies.
-- Fixes: "Could not find the 'first_name' column of 'profiles' in the schema cache"
-- After run: wait ~1 min or refresh the project; schema cache updates automatically.
-- =============================================================================

-- 1) Table shell (new projects)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  first_name text,
  last_name text,
  role text,
  age int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) Ensure every column exists (fixes older / partial schemas)
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists age int;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists profile_visible boolean default true;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists state text;

-- Backfill: existing rows must not be null for NOT NULL toggle behavior
update public.profiles set profile_visible = true where profile_visible is null;
alter table public.profiles alter column profile_visible set not null;
alter table public.profiles alter column profile_visible set default true;

-- 3) Row Level Security
alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Public can read profiles when visible" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Other users (and anonymous API consumers) may read only rows the owner marked visible
create policy "Public can read profiles when visible"
  on public.profiles for select
  using (profile_visible = true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 4) Validation (drop + re-add so re-run is safe)
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role is null or role in ('founder', 'investor'));

alter table public.profiles drop constraint if exists profiles_age_check;
alter table public.profiles
  add constraint profiles_age_check check (age is null or (age >= 13 and age <= 120));

-- 5) Storage: profile photos (public bucket, 2 MB max, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Users upload own avatar folder" on storage.objects;
drop policy if exists "Users update own avatar folder" on storage.objects;
drop policy if exists "Users delete own avatar folder" on storage.objects;

create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users upload own avatar folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own avatar folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own avatar folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
