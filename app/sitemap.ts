import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/supabase/public-env";
import { getSiteUrlForMetadata } from "@/lib/site-url";

/** Public routes for discovery; authenticated shells omitted. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrlForMetadata();
  if (!base) return [];

  const now = new Date();
  const staticPaths: Array<{
    path: string;
    changeFrequency: "weekly" | "monthly";
    priority: number;
  }> = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/about", changeFrequency: "monthly", priority: 0.85 },
    { path: "/explore", changeFrequency: "weekly", priority: 0.9 },
    { path: "/login", changeFrequency: "monthly", priority: 0.4 },
    { path: "/signup", changeFrequency: "monthly", priority: 0.5 },
    { path: "/forgot-password", changeFrequency: "monthly", priority: 0.3 },
    { path: "/legal/privacy", changeFrequency: "monthly", priority: 0.25 },
    { path: "/legal/terms", changeFrequency: "monthly", priority: 0.25 },
    { path: "/legal/risk", changeFrequency: "monthly", priority: 0.25 },
  ];

  const staticEntries = staticPaths.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, base).href,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  let listingEntries: MetadataRoute.Sitemap = [];
  try {
    const { url, anonKey } = getPublicSupabaseConfig();
    const supabase = createClient(url, anonKey);
    const { data } = await supabase
      .from("projects")
      .select("id, updated_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(500);

    listingEntries = (data ?? []).map((row) => ({
      url: new URL(`/listings/${row.id}`, base).href,
      lastModified: row.updated_at ? new Date(row.updated_at as string) : now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch {
    // Missing or invalid Supabase env — ship static URLs only.
  }

  return [...staticEntries, ...listingEntries];
}
