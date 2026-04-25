-- Company admin accounts: approval workflow + authority level (profiles.role = 'admin').
--
-- First approved admin (after they sign up at /admin/signup), run in SQL Editor once:
--   update public.profiles
--   set admin_approval_status = 'approved', admin_authority_level = 10
--   where id = '<their-auth-user-uuid>';

alter table public.profiles add column if not exists admin_approval_status text not null default 'none';
alter table public.profiles add column if not exists admin_authority_level int;

alter table public.profiles drop constraint if exists profiles_admin_approval_status_check;
alter table public.profiles
  add constraint profiles_admin_approval_status_check
  check (admin_approval_status in ('none', 'pending', 'approved', 'rejected'));

alter table public.profiles drop constraint if exists profiles_admin_authority_level_check;
alter table public.profiles
  add constraint profiles_admin_authority_level_check
  check (admin_authority_level is null or (admin_authority_level >= 1 and admin_authority_level <= 10));

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (
    role is null
    or role in ('founder', 'innovator', 'investor', 'mentor', 'admin')
  );

-- Approved company admins can read any profile (for moderation / approvals). OR-combines with existing SELECT policies.
drop policy if exists "Approved admins read all profiles" on public.profiles;
create policy "Approved admins read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.profiles adm
      where adm.id = auth.uid()
        and adm.role = 'admin'
        and adm.admin_approval_status = 'approved'
    )
  );

-- Approved company admins can update any profile (e.g. set admin_approval_status / admin_authority_level).
drop policy if exists "Approved admins update any profile" on public.profiles;
create policy "Approved admins update any profile"
  on public.profiles for update
  using (
    exists (
      select 1
      from public.profiles adm
      where adm.id = auth.uid()
        and adm.role = 'admin'
        and adm.admin_approval_status = 'approved'
    )
  );
