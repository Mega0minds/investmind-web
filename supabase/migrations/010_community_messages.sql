-- Community text messages (realtime-ready).
-- Run this migration in Supabase to enable the community feed.

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists community_messages_created_at_idx
  on public.community_messages (created_at desc);

alter table public.community_messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_messages'
      and policyname = 'community_messages_select_authenticated'
  ) then
    create policy community_messages_select_authenticated
      on public.community_messages
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
      and tablename = 'community_messages'
      and policyname = 'community_messages_insert_own'
  ) then
    create policy community_messages_insert_own
      on public.community_messages
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Required for postgres_changes realtime on this table.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_messages'
  ) then
    alter publication supabase_realtime add table public.community_messages;
  end if;
end
$$;
