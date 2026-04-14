-- Founder interests + mentor expertise for category-based mentor recommendations.

alter table public.profiles add column if not exists interest_sectors text[] not null default '{}';
alter table public.profiles add column if not exists mentor_expertise text[] not null default '{}';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role is null or role in ('founder', 'innovator', 'investor', 'mentor'));
