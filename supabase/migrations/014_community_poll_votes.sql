-- One vote per user per poll message (community message with __POLL__: prefix in body).
-- Run in Supabase SQL Editor if you use manual migrations.

create table if not exists public.community_poll_votes (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.community_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_index smallint not null check (option_index >= 0 and option_index < 10),
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create index if not exists community_poll_votes_message_id_idx
  on public.community_poll_votes (message_id);

alter table public.community_poll_votes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_poll_votes'
      and policyname = 'community_poll_votes_select_authenticated'
  ) then
    create policy community_poll_votes_select_authenticated
      on public.community_poll_votes
      for select
      to authenticated
      using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_poll_votes'
      and policyname = 'community_poll_votes_insert_own'
  ) then
    create policy community_poll_votes_insert_own
      on public.community_poll_votes
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_poll_votes'
      and policyname = 'community_poll_votes_update_own'
  ) then
    create policy community_poll_votes_update_own
      on public.community_poll_votes
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_poll_votes'
  ) then
    alter publication supabase_realtime add table public.community_poll_votes;
  end if;
end
$$;
