-- Project-level connection requests from viewers to project creators.

create table if not exists public.project_connection_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(trim(message)) between 5 and 300),
  status text not null default 'connecting' check (status in ('connecting', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists project_connection_requests_requester_status_idx
  on public.project_connection_requests (requester_id, status, created_at desc);

create index if not exists project_connection_requests_project_status_idx
  on public.project_connection_requests (project_id, status, created_at desc);

create unique index if not exists project_connection_requests_active_unique
  on public.project_connection_requests (requester_id, project_id)
  where status in ('connecting', 'accepted');

alter table public.project_connection_requests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_connection_requests'
      and policyname = 'project_connection_requests_select_own'
  ) then
    create policy project_connection_requests_select_own
      on public.project_connection_requests
      for select
      to authenticated
      using (requester_id = auth.uid() or creator_id = auth.uid());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'project_connection_requests'
      and policyname = 'project_connection_requests_insert_own'
  ) then
    create policy project_connection_requests_insert_own
      on public.project_connection_requests
      for insert
      to authenticated
      with check (
        requester_id = auth.uid()
        and exists (
          select 1
          from public.projects p
          where p.id = project_id
            and p.creator_id = creator_id
            and p.status = 'published'
            and p.creator_id <> auth.uid()
        )
      );
  end if;
end
$$;
