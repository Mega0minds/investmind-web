-- Allow anyone (including anonymous) to read published projects for Explore / public discovery.
-- Own-draft access remains via existing "Users read own projects" policy.

drop policy if exists "Public read published projects" on public.projects;
create policy "Public read published projects"
  on public.projects for select
  using (status = 'published');
