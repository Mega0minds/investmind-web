import type { SupabaseClient } from "@supabase/supabase-js";

function monthStartUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

/**
 * Month-over-month growth for profile views.
 * Returns null when there is no activity in either month (show neutral copy).
 */
export function computeVisibilityGrowthPercent(thisMonth: number, lastMonth: number): number | null {
  if (thisMonth === 0 && lastMonth === 0) return null;
  if (lastMonth === 0) return thisMonth > 0 ? 100 : 0;
  return Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
}

export type AudienceRoleFilter = "investor" | "founder";

export async function fetchProfileAudienceViewCounts(
  supabase: SupabaseClient,
  profileUserId: string,
  audienceRole: AudienceRoleFilter | null
): Promise<{ thisMonth: number; lastMonth: number; error: string | null }> {
  const now = new Date();
  const curStart = monthStartUtc(now);
  const prevStart = monthStartUtc(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));

  const baseThis = supabase
    .from("profile_views")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileUserId)
    .gte("viewed_at", curStart.toISOString());

  const baseLast = supabase
    .from("profile_views")
    .select("*", { count: "exact", head: true })
    .eq("profile_id", profileUserId)
    .gte("viewed_at", prevStart.toISOString())
    .lt("viewed_at", curStart.toISOString());

  const thisQ = audienceRole ? baseThis.eq("viewer_role", audienceRole) : baseThis;
  const lastQ = audienceRole ? baseLast.eq("viewer_role", audienceRole) : baseLast;

  const [thisRes, lastRes] = await Promise.all([thisQ, lastQ]);

  const err = thisRes.error?.message ?? lastRes.error?.message ?? null;
  if (err && /does not exist|relation/i.test(err)) {
    return { thisMonth: 0, lastMonth: 0, error: err };
  }
  if (thisRes.error || lastRes.error) {
    return { thisMonth: 0, lastMonth: 0, error: err };
  }

  return {
    thisMonth: thisRes.count ?? 0,
    lastMonth: lastRes.count ?? 0,
    error: null,
  };
}

export type SettingsEliteRole = "founder" | "investor" | "unknown";

export function audienceRoleForProfileRole(profileRole: string | null | undefined): AudienceRoleFilter | null {
  if (profileRole === "founder") return "investor";
  if (profileRole === "investor") return "founder";
  return null;
}

export function normalizeSettingsEliteRole(profileRole: string | null | undefined): SettingsEliteRole {
  if (profileRole === "investor") return "investor";
  if (profileRole === "founder") return "founder";
  return "unknown";
}
