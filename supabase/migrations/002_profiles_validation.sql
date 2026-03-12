-- Validation at the database so invalid data cannot be saved (matches frontend).
-- Run after 001_profiles.sql.
-- These checks ensure: role is founder/investor when set; age is 13–120 when set.

alter table public.profiles
  add constraint profiles_role_check check (role is null or role in ('founder', 'investor'));

alter table public.profiles
  add constraint profiles_age_check check (age is null or (age >= 13 and age <= 120));

-- Optional: require non-empty names and role/age for new rows (uncomment if no existing NULLs)
-- alter table public.profiles alter column first_name set not null;
-- alter table public.profiles alter column last_name set not null;
-- alter table public.profiles alter column role set not null;
-- alter table public.profiles alter column age set not null;
