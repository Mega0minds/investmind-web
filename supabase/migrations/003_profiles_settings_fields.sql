-- Optional profile fields for Settings (avatar, location, bio).
-- Run in Supabase → SQL Editor if you already applied 001/002.

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists location text,
  add column if not exists bio text,
  add column if not exists profile_visible boolean default true;

-- Optional: in SQL Editor also add the RLS policy from supabase/run_once_profiles.sql
-- ("Public can read profiles when visible") so discover/explore can show public profiles.
