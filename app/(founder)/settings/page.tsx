import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    .select("full_name, first_name, last_name, avatar_url, location, bio, profile_visible")
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
        }
      : null;
  } else if (profileResult.error) {
    throw profileResult.error;
  }

  const resolved = resolveProfileFormFields(profile, user);
  const initialProfileVisible = profile?.profile_visible !== false;

  return (
    <DashboardShell title="Settings">
      <SettingsPageClient
        initialFullName={resolved.fullName}
        initialProfileVisible={initialProfileVisible}
        initialLocation={resolved.location}
        initialBio={resolved.bio}
        initialAvatarUrl={resolved.avatarUrl}
        email={user.email ?? ""}
      />
    </DashboardShell>
  );
}
