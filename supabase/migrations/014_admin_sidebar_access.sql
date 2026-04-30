-- Feature-based admin sidebar access (JSON array of keys: dashboard, verification).

alter table public.profiles add column if not exists admin_sidebar_access jsonb;

comment on column public.profiles.admin_sidebar_access is
  'Approved non-super admins: allowed sidebar keys, e.g. ["dashboard","verification"]. Super admin is controlled by SUPER_ADMIN_EMAIL / emperorshubnetwork@gmail.com.';
