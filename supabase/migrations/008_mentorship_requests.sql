-- Mentorship requests sent from founders/creatives to mentors.

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
