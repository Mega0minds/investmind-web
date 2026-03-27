import type { User } from "@supabase/supabase-js";

export type ProfileRowForSettings = {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  bio?: string | null;
  profile_visible?: boolean | null;
};

function metaString(meta: Record<string, unknown>, key: string): string {
  const v = meta[key];
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Values for the settings profile form: DB row first, then auth user_metadata (OAuth / signup extras).
 */
export function resolveProfileFormFields(
  profile: ProfileRowForSettings | null,
  user: User | null
): {
  fullName: string;
  location: string;
  bio: string;
  avatarUrl: string | null;
} {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;

  const fullName =
    profile?.full_name?.trim() ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
    metaString(meta, "full_name") ||
    metaString(meta, "name") ||
    [metaString(meta, "given_name"), metaString(meta, "family_name")].filter(Boolean).join(" ").trim() ||
    "";

  const avatarRaw =
    profile?.avatar_url?.trim() ||
    metaString(meta, "avatar_url") ||
    metaString(meta, "picture") ||
    "";

  return {
    fullName,
    location: profile?.location?.trim() ?? "",
    bio: profile?.bio?.trim() ?? "",
    avatarUrl: avatarRaw || null,
  };
}
