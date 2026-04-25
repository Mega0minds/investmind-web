import type { SupabaseClient } from "@supabase/supabase-js";

export type ExplorePublishedProject = {
  id: string;
  creator_id: string;
  project_name: string | null;
  tagline: string | null;
  short_description: string | null;
  sector: string | null;
  subcategory: string | null;
  cover_image_file_name: string | null;
  discovery_tags: string[] | null;
  updated_at: string | null;
};

const SELECT =
  "id, creator_id, project_name, tagline, short_description, sector, subcategory, cover_image_file_name, discovery_tags, updated_at";

export type TrendingProject = {
  name: string;
  sub: string;
  followers: string;
};

/** Published projects from other founders (excludes current user when logged in). */
export async function fetchExploreProjects(
  supabase: SupabaseClient,
  options: { excludeCreatorId?: string | null }
): Promise<ExplorePublishedProject[]> {
  let query = supabase
    .from("projects")
    .select(SELECT)
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (options.excludeCreatorId) {
    query = query.neq("creator_id", options.excludeCreatorId);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) {
    return [];
  }
  return data as ExplorePublishedProject[];
}

/** Top projects by creator profile view counts (first 3). */
export async function fetchTrendingProjectsByViews(
  supabase: SupabaseClient,
  options: { excludeCreatorId?: string | null; limit?: number }
): Promise<TrendingProject[]> {
  const limit = options.limit ?? 3;
  const projects = await fetchExploreProjects(supabase, {
    excludeCreatorId: options.excludeCreatorId ?? null,
  });
  if (!projects.length) return [];

  const creatorIds = [...new Set(projects.map((p) => p.creator_id).filter(Boolean))];
  if (!creatorIds.length) return [];

  const { data: viewRows } = await supabase
    .from("profile_views")
    .select("profile_id")
    .in("profile_id", creatorIds);

  const viewCounts = new Map<string, number>();
  for (const id of creatorIds) viewCounts.set(id, 0);
  for (const row of viewRows ?? []) {
    const profileId =
      typeof (row as { profile_id?: unknown }).profile_id === "string"
        ? (row as { profile_id: string }).profile_id
        : null;
    if (!profileId) continue;
    viewCounts.set(profileId, (viewCounts.get(profileId) ?? 0) + 1);
  }

  const ranked = [...projects]
    .sort((a, b) => {
      const byViews = (viewCounts.get(b.creator_id) ?? 0) - (viewCounts.get(a.creator_id) ?? 0);
      if (byViews !== 0) return byViews;
      return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
    })
    .slice(0, limit);

  return ranked.map((p) => {
    const views = viewCounts.get(p.creator_id) ?? 0;
    const bucket = (p.sector?.trim() || "IDEA").toUpperCase().slice(0, 12);
    const title = p.project_name?.trim() || "Untitled project";
    return {
      name: bucket,
      sub: title,
      followers: views > 0 ? `${views} profile views` : "New project",
    };
  });
}
