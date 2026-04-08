-- Projects created from the founder upload wizard.
-- Separate from profiles; linked by creator_id (auth.users.id).

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

-- Storage bucket for project media (cover + screenshots)
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

