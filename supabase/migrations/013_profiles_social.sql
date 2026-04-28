-- Optional social handles / URLs on profiles (settings + public profile About).

alter table public.profiles add column if not exists social_twitter text;
alter table public.profiles add column if not exists social_linkedin text;
alter table public.profiles add column if not exists social_instagram text;
alter table public.profiles add column if not exists social_website text;
