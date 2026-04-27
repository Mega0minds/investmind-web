-- Community post interactions: likes + replies (text-only).

create table if not exists public.community_message_likes (
  message_id uuid not null references public.community_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.community_message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.community_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists community_message_replies_message_created_idx
  on public.community_message_replies (message_id, created_at desc);

alter table public.community_message_likes enable row level security;
alter table public.community_message_replies enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_message_likes'
      and policyname = 'community_message_likes_select_authenticated'
  ) then
    create policy community_message_likes_select_authenticated
      on public.community_message_likes
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
      and tablename = 'community_message_likes'
      and policyname = 'community_message_likes_insert_own'
  ) then
    create policy community_message_likes_insert_own
      on public.community_message_likes
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
      and tablename = 'community_message_likes'
      and policyname = 'community_message_likes_delete_own'
  ) then
    create policy community_message_likes_delete_own
      on public.community_message_likes
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'community_message_replies'
      and policyname = 'community_message_replies_select_authenticated'
  ) then
    create policy community_message_replies_select_authenticated
      on public.community_message_replies
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
      and tablename = 'community_message_replies'
      and policyname = 'community_message_replies_insert_own'
  ) then
    create policy community_message_replies_insert_own
      on public.community_message_replies
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end
$$;

-- Realtime for live likes/replies.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'community_message_likes'
  ) then
    alter publication supabase_realtime add table public.community_message_likes;
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
      and tablename = 'community_message_replies'
  ) then
    alter publication supabase_realtime add table public.community_message_replies;
  end if;
end
$$;
