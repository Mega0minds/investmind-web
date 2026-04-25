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
  add constraint profiles_role_check check (role is null or role in ('founder', 'innovator', 'investor', 'mentor', 'admin'));

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

-- 6) Profile views (Settings elite reach / month-over-month audience). See migrations/004_profile_views.sql
create table if not exists public.profile_views (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  viewer_id uuid not null references auth.users (id) on delete cascade,
  viewer_role text,
  viewed_at timestamptz not null default now(),
  constraint profile_views_no_self check (profile_id <> viewer_id)
);

create index if not exists profile_views_profile_time_idx
  on public.profile_views (profile_id, viewed_at desc);

create index if not exists profile_views_profile_role_time_idx
  on public.profile_views (profile_id, viewer_role, viewed_at desc);

alter table public.profile_views enable row level security;

drop policy if exists "Profile owners read own view events" on public.profile_views;
create policy "Profile owners read own view events"
  on public.profile_views for select
  using (profile_id = auth.uid());

drop policy if exists "Users record view of another profile" on public.profile_views;
create policy "Users record view of another profile"
  on public.profile_views for insert
  with check (
    auth.uid() is not null
    and viewer_id = auth.uid()
    and profile_id <> auth.uid()
  );

create or replace function public.set_profile_view_viewer_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select p.role into new.viewer_role
  from public.profiles p
  where p.id = new.viewer_id;
  return new;
end;
$$;

drop trigger if exists profile_views_set_viewer_role on public.profile_views;
create trigger profile_views_set_viewer_role
  before insert on public.profile_views
  for each row
  execute procedure public.set_profile_view_viewer_role();

-- 7) Projects (upload wizard) - linked to auth user, not profiles.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'published')),
  step int not null default 1 check (step >= 1 and step <= 5),
  project_name text,
  tagline text,
  short_description text,
  sector text,
  subcategory text,
  stage text,
  cover_image_file_name text,
  screenshot_file_names text[] not null default '{}',
  product_video_url text,
  discovery_tags text[] not null default '{}',
  market text,
  pitch_summary text,
  team_size text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_creator_updated_idx
  on public.projects (creator_id, updated_at desc);

alter table public.projects enable row level security;

drop policy if exists "Users read own projects" on public.projects;
create policy "Users read own projects"
  on public.projects for select
  using (creator_id = auth.uid());

drop policy if exists "Users insert own projects" on public.projects;
create policy "Users insert own projects"
  on public.projects for insert
  with check (creator_id = auth.uid());

drop policy if exists "Users update own projects" on public.projects;
create policy "Users update own projects"
  on public.projects for update
  using (creator_id = auth.uid());

drop policy if exists "Users delete own projects" on public.projects;
create policy "Users delete own projects"
  on public.projects for delete
  using (creator_id = auth.uid());

-- 8) Project media storage (cover + screenshots)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media',
  'project-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read project media" on storage.objects;
drop policy if exists "Users upload own project media folder" on storage.objects;
drop policy if exists "Users update own project media folder" on storage.objects;
drop policy if exists "Users delete own project media folder" on storage.objects;

create policy "Public read project media"
  on storage.objects for select
  using (bucket_id = 'project-media');

create policy "Users upload own project media folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own project media folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own project media folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 9) Published projects visible for Explore (public read)
drop policy if exists "Public read published projects" on public.projects;
create policy "Public read published projects"
  on public.projects for select
  using (status = 'published');

-- 10) Founder interests + mentor expertise (for mentor recommendations)
alter table public.profiles add column if not exists interest_sectors text[] not null default '{}';
alter table public.profiles add column if not exists mentor_expertise text[] not null default '{}';

-- 10b) Company admin approval + authority (role = 'admin')
alter table public.profiles add column if not exists admin_approval_status text not null default 'none';
alter table public.profiles add column if not exists admin_authority_level int;

alter table public.profiles drop constraint if exists profiles_admin_approval_status_check;
alter table public.profiles
  add constraint profiles_admin_approval_status_check
  check (admin_approval_status in ('none', 'pending', 'approved', 'rejected'));

alter table public.profiles drop constraint if exists profiles_admin_authority_level_check;
alter table public.profiles
  add constraint profiles_admin_authority_level_check
  check (admin_authority_level is null or (admin_authority_level >= 1 and admin_authority_level <= 10));

drop policy if exists "Approved admins read all profiles" on public.profiles;
create policy "Approved admins read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.profiles adm
      where adm.id = auth.uid()
        and adm.role = 'admin'
        and adm.admin_approval_status = 'approved'
    )
  );

drop policy if exists "Approved admins update any profile" on public.profiles;
create policy "Approved admins update any profile"
  on public.profiles for update
  using (
    exists (
      select 1
      from public.profiles adm
      where adm.id = auth.uid()
        and adm.role = 'admin'
        and adm.admin_approval_status = 'approved'
    )
  );

-- 11) Mentorship requests
create table if not exists public.mentorship_requests (
  id bigint generated always as identity primary key,
  requester_id uuid not null references auth.users (id) on delete cascade,
  mentor_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mentorship_requests_no_self check (requester_id <> mentor_id),
  constraint mentorship_requests_message_len check (char_length(trim(message)) between 5 and 300)
);

create index if not exists mentorship_requests_mentor_status_time_idx
  on public.mentorship_requests (mentor_id, status, created_at desc);

create index if not exists mentorship_requests_requester_status_time_idx
  on public.mentorship_requests (requester_id, status, created_at desc);

alter table public.mentorship_requests enable row level security;

drop policy if exists "Requesters insert own mentorship requests" on public.mentorship_requests;
create policy "Requesters insert own mentorship requests"
  on public.mentorship_requests for insert
  with check (requester_id = auth.uid());

drop policy if exists "Requesters read own mentorship requests" on public.mentorship_requests;
create policy "Requesters read own mentorship requests"
  on public.mentorship_requests for select
  using (requester_id = auth.uid());

drop policy if exists "Mentors read incoming mentorship requests" on public.mentorship_requests;
create policy "Mentors read incoming mentorship requests"
  on public.mentorship_requests for select
  using (mentor_id = auth.uid());

drop policy if exists "Mentors update incoming mentorship requests" on public.mentorship_requests;
create policy "Mentors update incoming mentorship requests"
  on public.mentorship_requests for update
  using (mentor_id = auth.uid());
