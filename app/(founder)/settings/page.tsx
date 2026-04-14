import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  audienceRoleForProfileRole,
  computeVisibilityGrowthPercent,
  fetchProfileAudienceViewCounts,
  normalizeSettingsEliteRole,
} from "@/lib/profile-audience-stats";
import { resolveProfileFormFields } from "@/lib/profile-fields";
import { DashboardShell } from "../_components/DashboardShell";
import { SettingsPageClient } from "./SettingsPageClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profileResult = await supabase
    .from("profiles")
    .select(
      "full_name, first_name, last_name, avatar_url, location, bio, profile_visible, role, interest_sectors"
    )
    .eq("id", user.id)
    .maybeSingle();

  let profile = profileResult.data;
  if (profileResult.error?.message?.includes("column") && profileResult.error?.message?.includes("does not exist")) {
    const basic = await supabase
      .from("profiles")
      .select("full_name, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();
    profile = basic.data
      ? {
          ...basic.data,
          avatar_url: null as string | null,
          location: "" as string | null,
          bio: "" as string | null,
          profile_visible: true as boolean | null,
          role: null as string | null,
          interest_sectors: [] as string[],
        }
      : null;
  } else if (profileResult.error) {
    throw profileResult.error;
  }

  const resolved = resolveProfileFormFields(profile, user);
  const initialProfileVisible = profile?.profile_visible !== false;

  const eliteRole = normalizeSettingsEliteRole(profile?.role);
  const audienceFilter = audienceRoleForProfileRole(profile?.role);
  const viewCounts = await fetchProfileAudienceViewCounts(supabase, user.id, audienceFilter);
  const elitePercent = viewCounts.error
    ? null
    : computeVisibilityGrowthPercent(viewCounts.thisMonth, viewCounts.lastMonth);

  return (
    <DashboardShell title="Settings">
      <SettingsPageClient
        initialFullName={resolved.fullName}
        initialProfileVisible={initialProfileVisible}
        initialLocation={resolved.location}
        initialBio={resolved.bio}
        initialAvatarUrl={resolved.avatarUrl}
        initialInterestSectors={
          profile &&
          Array.isArray((profile as { interest_sectors?: unknown }).interest_sectors)
            ? (profile as { interest_sectors: string[] }).interest_sectors.filter(
                (x): x is string => typeof x === "string" && x.trim().length > 0
              )
            : []
        }
        profileRole={profile?.role ?? null}
        email={user.email ?? ""}
        eliteReach={{
          role: eliteRole,
          percent: elitePercent,
          thisMonth: viewCounts.thisMonth,
          lastMonth: viewCounts.lastMonth,
          statsReady: !viewCounts.error,
        }}
      />
    </DashboardShell>
  );
}
