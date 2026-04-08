-- Profile views for audience reach (month-over-month stats on Settings).
-- viewer_role is set automatically from the viewer's profiles.role.

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
