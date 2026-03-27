-- Profiles table: email, name, role, age synced from auth/signup.
-- Prefer the single file: ../run_once_profiles.sql (Supabase SQL Editor) for a full idempotent setup.

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
