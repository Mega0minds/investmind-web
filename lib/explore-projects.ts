import type { SupabaseClient } from "@supabase/supabase-js";

export type ExplorePublishedProject = {
  id: string;
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
  "id, project_name, tagline, short_description, sector, subcategory, cover_image_file_name, discovery_tags, updated_at";

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
