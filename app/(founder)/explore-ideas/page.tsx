import { DashboardShell } from "../_components/DashboardShell";
import { ExploreIdeasContent } from "@/components/explore/ExploreIdeasContent";
import { createClient } from "@/lib/supabase/server";
import { fetchExploreProjects } from "@/lib/explore-projects";

export default async function ExploreIdeasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const projects = await fetchExploreProjects(supabase, {
    excludeCreatorId: user?.id ?? undefined,
  });

  return (
    <DashboardShell title="Explore Ideas">
      <ExploreIdeasContent projects={projects} />
    </DashboardShell>
  );
}
