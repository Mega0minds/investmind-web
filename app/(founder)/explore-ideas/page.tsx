import { DashboardShell } from "../_components/DashboardShell";
import { ExploreIdeasContent } from "@/components/explore/ExploreIdeasContent";
import { createClient } from "@/lib/supabase/server";
import { fetchExploreProjects, fetchTrendingProjectsByViews } from "@/lib/explore-projects";

export default async function ExploreIdeasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const projects = await fetchExploreProjects(supabase, {
    excludeCreatorId: user?.id ?? undefined,
  });
  const trending = await fetchTrendingProjectsByViews(supabase, {
    excludeCreatorId: user?.id ?? undefined,
    limit: 3,
  });

  return (
    <DashboardShell title="Explore Ideas">
      <ExploreIdeasContent projects={projects} trending={trending} />
    </DashboardShell>
  );
}
