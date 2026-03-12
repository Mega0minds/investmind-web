-- Profiles table: email, name, role, age synced from auth/signup.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).

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

-- RLS: users can read and update their own row
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Optional: trigger to create profile on signup (then you can skip client-side upsert)
-- create or replace function public.handle_new_user()
-- returns trigger as $$
-- begin
--   insert into public.profiles (id, email, full_name)
--   values (
--     new.id,
--     new.email,
--     coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
--   );
--   return new;
-- end;
-- $$ language plpgsql security definer;

-- create or replace trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();
