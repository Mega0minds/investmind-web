"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { PROFILE_BIO_MAX_LENGTH, PROFILE_SOCIAL_MAX_LENGTH, THEME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { resolveProfileFormFields, type ProfileRowForSettings } from "@/lib/profile-fields";
import { FOUNDER_INTEREST_SECTOR_OPTIONS } from "@/lib/mentor-matching";
import { normalizeRole } from "@/lib/roles";
import { clampSocialInput } from "@/lib/social-links";
import { ChangePasswordModal } from "./_components/ChangePasswordModal";
import { EliteReachCard, type EliteReachStats } from "./_components/EliteReachCard";

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/** Two-letter initials for avatar when no photo is set. */
function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] ?? "";
    const b = parts[parts.length - 1][0] ?? "";
    return (a + b).toUpperCase() || "?";
  }
  const single = parts[0] ?? "";
  if (single.length >= 2) return single.slice(0, 2).toUpperCase();
  if (single.length === 1) return (single + single).toUpperCase();
  return "?";
}

function sameStringArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function Toggle({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 touch-manipulation ${
        on ? "" : "bg-gray-200"
      }`}
      style={on ? { backgroundColor: THEME.primary } : undefined}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

type SettingsPageClientProps = {
  initialFullName: string;
  initialProfileVisible: boolean;
  initialLocation: string;
  initialBio: string;
  initialAvatarUrl: string | null;
  initialInterestSectors: string[];
  initialMentorExpertise: string[];
  initialSocialTwitter: string;
  initialSocialLinkedin: string;
  initialSocialInstagram: string;
  initialSocialWebsite: string;
  profileRole: string | null;
  email: string;
  eliteReach: EliteReachStats;
};

export function SettingsPageClient({
  initialFullName,
  initialProfileVisible,
  initialLocation,
  initialBio,
  initialAvatarUrl,
  initialInterestSectors,
  initialMentorExpertise,
  initialSocialTwitter,
  initialSocialLinkedin,
  initialSocialInstagram,
  initialSocialWebsite,
  profileRole,
  email,
  eliteReach,
}: SettingsPageClientProps) {
  const normalizedProfileRole = normalizeRole(profileRole);
  const [selectedRole, setSelectedRole] = useState<"founder" | "investor">(
    normalizedProfileRole === "investor" ? "investor" : "founder"
  );
  const isFounderRole = selectedRole === "founder";

  const [fullName, setFullName] = useState(initialFullName);
  const [location, setLocation] = useState(initialLocation);
  const [bio, setBio] = useState(() =>
    initialBio.slice(0, PROFILE_BIO_MAX_LENGTH)
  );
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [profileVisible, setProfileVisible] = useState(initialProfileVisible);
  /** Last saved values for fields that “Save Changes” persists (visibility also updates via toggle). */
  const [savedBaseline, setSavedBaseline] = useState(() => ({
    fullName: initialFullName.trim(),
    location: initialLocation.trim(),
    bio: initialBio.slice(0, PROFILE_BIO_MAX_LENGTH).trim(),
    profileVisible: initialProfileVisible,
    interestSectors: initialInterestSectors.filter((x) => typeof x === "string" && x.trim()),
    mentorExpertise: initialMentorExpertise.filter((x) => typeof x === "string" && x.trim()),
    socialTwitter: clampSocialInput(initialSocialTwitter, PROFILE_SOCIAL_MAX_LENGTH),
    socialLinkedin: clampSocialInput(initialSocialLinkedin, PROFILE_SOCIAL_MAX_LENGTH),
    socialInstagram: clampSocialInput(initialSocialInstagram, PROFILE_SOCIAL_MAX_LENGTH),
    socialWebsite: clampSocialInput(initialSocialWebsite, PROFILE_SOCIAL_MAX_LENGTH),
    role: normalizedProfileRole === "investor" ? "investor" : "founder",
  }));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [interestSectors, setInterestSectors] = useState<string[]>(() =>
    initialInterestSectors.filter((x) => typeof x === "string" && x.trim())
  );
  const [mentorExpertise, setMentorExpertise] = useState<string[]>(() =>
    initialMentorExpertise.filter((x) => typeof x === "string" && x.trim())
  );
  const [socialTwitter, setSocialTwitter] = useState(() =>
    clampSocialInput(initialSocialTwitter, PROFILE_SOCIAL_MAX_LENGTH)
  );
  const [socialLinkedin, setSocialLinkedin] = useState(() =>
    clampSocialInput(initialSocialLinkedin, PROFILE_SOCIAL_MAX_LENGTH)
  );
  const [socialInstagram, setSocialInstagram] = useState(() =>
    clampSocialInput(initialSocialInstagram, PROFILE_SOCIAL_MAX_LENGTH)
  );
  const [socialWebsite, setSocialWebsite] = useState(() =>
    clampSocialInput(initialSocialWebsite, PROFILE_SOCIAL_MAX_LENGTH)
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const full = await supabase
        .from("profiles")
        .select(
          "full_name, first_name, last_name, avatar_url, location, bio, profile_visible, role, interest_sectors, mentor_expertise, social_twitter, social_linkedin, social_instagram, social_website"
        )
        .eq("id", user.id)
        .maybeSingle();

      let profile: ProfileRowForSettings | null = null;
      if (
        full.error?.message?.includes("column") &&
        (full.error?.message?.includes("does not exist") ||
          full.error?.message?.includes("schema cache"))
      ) {
        const basic = await supabase
          .from("profiles")
          .select("full_name, first_name, last_name")
          .eq("id", user.id)
          .maybeSingle();
        profile = basic.data
          ? {
              ...basic.data,
              avatar_url: null,
              location: null,
              bio: null,
              profile_visible: true,
              interest_sectors: [] as string[],
              mentor_expertise: [] as string[],
              social_twitter: null,
              social_linkedin: null,
              social_instagram: null,
              social_website: null,
              role: null,
            }
          : null;
      } else if (full.error) {
        return;
      } else {
        profile = full.data;
      }

      if (cancelled) return;
      const r = resolveProfileFormFields(profile, user);
      const vis = profile?.profile_visible !== false;
      const bioClamped = r.bio.slice(0, PROFILE_BIO_MAX_LENGTH);
      const loadedInterests = Array.isArray(
        (profile as { interest_sectors?: unknown } | null)?.interest_sectors
      )
        ? ((profile as { interest_sectors: string[] }).interest_sectors ?? []).filter(
            (x): x is string => typeof x === "string" && x.trim().length > 0
          )
        : [];
      const loadedExpertise = Array.isArray(
        (profile as { mentor_expertise?: unknown } | null)?.mentor_expertise
      )
        ? ((profile as { mentor_expertise: string[] }).mentor_expertise ?? []).filter(
            (x): x is string => typeof x === "string" && x.trim().length > 0
          )
        : [];
      setFullName(r.fullName);
      setLocation(r.location);
      setBio(bioClamped);
      setAvatarUrl(r.avatarUrl);
      setProfileVisible(vis);
      setInterestSectors(loadedInterests);
      setMentorExpertise(loadedExpertise);
      const pSocial = profile as {
        social_twitter?: string | null;
        social_linkedin?: string | null;
        social_instagram?: string | null;
        social_website?: string | null;
      };
      const tw = clampSocialInput(pSocial.social_twitter ?? "", PROFILE_SOCIAL_MAX_LENGTH);
      const li = clampSocialInput(pSocial.social_linkedin ?? "", PROFILE_SOCIAL_MAX_LENGTH);
      const ig = clampSocialInput(pSocial.social_instagram ?? "", PROFILE_SOCIAL_MAX_LENGTH);
      const web = clampSocialInput(pSocial.social_website ?? "", PROFILE_SOCIAL_MAX_LENGTH);
      setSocialTwitter(tw);
      setSocialLinkedin(li);
      setSocialInstagram(ig);
      setSocialWebsite(web);
      const loadedRole = normalizeRole((profile as { role?: string | null } | null)?.role ?? null);
      setSelectedRole(loadedRole === "investor" ? "investor" : "founder");
      setSavedBaseline({
        fullName: r.fullName.trim(),
        location: r.location.trim(),
        bio: bioClamped.trim(),
        profileVisible: vis,
        interestSectors: loadedInterests,
        mentorExpertise: loadedExpertise,
        socialTwitter: tw,
        socialLinkedin: li,
        socialInstagram: ig,
        socialWebsite: web,
        role: loadedRole === "investor" ? "investor" : "founder",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasProfilePhoto = Boolean(avatarUrl?.trim());
  const avatarInitials = initialsFromName(fullName);

  function openAvatarPicker() {
    avatarFileInputRef.current?.click();
  }

  async function handleAvatarFileSelected(file: File | undefined) {
    if (!file) return;
    setSaveMessage(null);
    if (!file.type.startsWith("image/")) {
      setSaveMessage("Please choose an image (JPEG, PNG, WebP, or GIF).");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setSaveMessage("Use JPEG, PNG, WebP, or GIF.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setSaveMessage("Photo must be 2 MB or smaller.");
      return;
    }

    setAvatarUploading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAvatarUploading(false);
      setSaveMessage("Session expired. Sign in again.");
      return;
    }

    const path = `${user.id}/avatar`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

    if (uploadError) {
      setAvatarUploading(false);
      if (/bucket|not found/i.test(uploadError.message)) {
        setSaveMessage(
          "Photo storage is not set up yet. Run the storage section in supabase/run_once_profiles.sql (bucket avatars), then try again."
        );
      } else {
        setSaveMessage(uploadError.message);
      }
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    const now = new Date().toISOString();

    const { data: updatedRows, error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl, updated_at: now })
      .eq("id", user.id)
      .select("id");

    if (updateError) {
      setAvatarUploading(false);
      setSaveMessage(updateError.message);
      return;
    }

    if (!updatedRows?.length) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email ?? null,
        avatar_url: publicUrl,
        profile_visible: true,
        updated_at: now,
      });
      if (insertError) {
        setAvatarUploading(false);
        setSaveMessage(insertError.message);
        return;
      }
    }

    setAvatarUrl(`${publicUrl}?v=${Date.now()}`);
    setAvatarUploading(false);
    setSaveMessage("Profile photo updated.");
    setTimeout(() => setSaveMessage(null), 3000);
  }

  async function persistProfileVisible(next: boolean) {
    setSaveMessage(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaveMessage("Session expired. Sign in again.");
      return;
    }
    const prev = profileVisible;
    setProfileVisible(next);
    const { data: rows, error } = await supabase
      .from("profiles")
      .update({ profile_visible: next, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("id");

    if (error) {
      setProfileVisible(prev);
      if (/column/i.test(error.message) && /does not exist/i.test(error.message)) {
        setSaveMessage(
          "Add column profile_visible: run supabase/run_once_profiles.sql in the SQL Editor, then try again."
        );
      } else {
        setSaveMessage(error.message);
      }
      return;
    }
    if (!rows?.length) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email ?? null,
        profile_visible: next,
        updated_at: new Date().toISOString(),
      });
      if (insertError) {
        setProfileVisible(prev);
        setSaveMessage(insertError.message);
        return;
      }
    }
    setSavedBaseline((b) => ({ ...b, profileVisible: next }));
  }

  async function handleSaveProfile() {
    setSaveState("saving");
    setSaveMessage(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaveState("error");
      setSaveMessage("Session expired. Sign in again.");
      return;
    }
    if (bio.length > PROFILE_BIO_MAX_LENGTH) {
      setSaveState("error");
      setSaveMessage(`Bio must be at most ${PROFILE_BIO_MAX_LENGTH} characters.`);
      return;
    }
    const trimmedName = fullName.trim();
    const parts = trimmedName.split(/\s+/).filter(Boolean);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ") || null;

    const stTw = clampSocialInput(socialTwitter, PROFILE_SOCIAL_MAX_LENGTH);
    const stLi = clampSocialInput(socialLinkedin, PROFILE_SOCIAL_MAX_LENGTH);
    const stIg = clampSocialInput(socialInstagram, PROFILE_SOCIAL_MAX_LENGTH);
    const stWeb = clampSocialInput(socialWebsite, PROFILE_SOCIAL_MAX_LENGTH);

    const roleChanged = selectedRole !== savedBaseline.role;

    const { data: updatedRows, error } = await supabase
      .from("profiles")
      .update({
        full_name: trimmedName || null,
        first_name: firstName || null,
        last_name: lastName,
        location: location.trim() || null,
        bio: bio.trim().slice(0, PROFILE_BIO_MAX_LENGTH) || null,
        profile_visible: profileVisible,
        role: selectedRole,
        interest_sectors: interestSectors,
        mentor_expertise: mentorExpertise,
        social_twitter: stTw || null,
        social_linkedin: stLi || null,
        social_instagram: stIg || null,
        social_website: stWeb || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id");

    if (error) {
      setSaveState("error");
      if (
        /column/i.test(error.message) &&
        (/does not exist/i.test(error.message) || /schema cache/i.test(error.message))
      ) {
        setSaveMessage(
          "Database missing profile columns. Run supabase/migrations (e.g. 003_profiles_settings_fields.sql, 013_profiles_social.sql) in the SQL Editor, then try again."
        );
      } else {
        setSaveMessage(error.message);
      }
      return;
    }
    if (!updatedRows?.length) {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email ?? null,
        full_name: trimmedName || null,
        first_name: firstName || null,
        last_name: lastName,
        location: location.trim() || null,
        bio: bio.trim().slice(0, PROFILE_BIO_MAX_LENGTH) || null,
        profile_visible: profileVisible,
        role: selectedRole,
        interest_sectors: interestSectors,
        mentor_expertise: mentorExpertise,
        social_twitter: stTw || null,
        social_linkedin: stLi || null,
        social_instagram: stIg || null,
        social_website: stWeb || null,
        updated_at: new Date().toISOString(),
      });
      if (insertError) {
        setSaveState("error");
        setSaveMessage(insertError.message);
        return;
      }
    }
    setSaveState("saved");
    setSaveMessage("Profile saved.");
    setSavedBaseline((b) => ({
      fullName: trimmedName,
      location: location.trim(),
      bio: bio.trim().slice(0, PROFILE_BIO_MAX_LENGTH),
      profileVisible,
      interestSectors: [...interestSectors],
      mentorExpertise: [...mentorExpertise],
      socialTwitter: stTw,
      socialLinkedin: stLi,
      socialInstagram: stIg,
      socialWebsite: stWeb,
      role: selectedRole,
    }));

    // Role-sensitive navigation (e.g. sidebar categories) is initialized at app shell load.
    // Force a reload after role change so menu visibility updates immediately.
    if (roleChanged && typeof window !== "undefined") {
      window.location.reload();
      return;
    }

    setTimeout(() => {
      setSaveState("idle");
      setSaveMessage(null);
    }, 2500);
  }

  const saveMessageIsSuccess =
    saveMessage === "Profile saved." || saveMessage === "Profile photo updated.";

  const hasUnsavedProfileChanges = useMemo(
    () =>
      fullName.trim() !== savedBaseline.fullName ||
      location.trim() !== savedBaseline.location ||
      bio.trim() !== savedBaseline.bio ||
      profileVisible !== savedBaseline.profileVisible ||
      selectedRole !== savedBaseline.role ||
      !sameStringArray(interestSectors, savedBaseline.interestSectors) ||
      !sameStringArray(mentorExpertise, savedBaseline.mentorExpertise) ||
      clampSocialInput(socialTwitter, PROFILE_SOCIAL_MAX_LENGTH) !== savedBaseline.socialTwitter ||
      clampSocialInput(socialLinkedin, PROFILE_SOCIAL_MAX_LENGTH) !== savedBaseline.socialLinkedin ||
      clampSocialInput(socialInstagram, PROFILE_SOCIAL_MAX_LENGTH) !== savedBaseline.socialInstagram ||
      clampSocialInput(socialWebsite, PROFILE_SOCIAL_MAX_LENGTH) !== savedBaseline.socialWebsite,
    [
      fullName,
      location,
      bio,
      profileVisible,
      selectedRole,
      interestSectors,
      mentorExpertise,
      socialTwitter,
      socialLinkedin,
      socialInstagram,
      socialWebsite,
      savedBaseline,
    ]
  );

  const saveDisabled = saveState === "saving" || !hasUnsavedProfileChanges;

  const saveButtonClass =
    "shrink-0 rounded-xl px-5 py-2.5 sm:py-3 text-sm font-semibold shadow-sm min-h-[44px] touch-manipulation w-full sm:w-auto transition " +
    (saveDisabled
      ? "cursor-not-allowed bg-gray-200 text-gray-500"
      : "text-white hover:opacity-95");

  return (
    <div className="min-w-0 w-full max-w-6xl mx-auto pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-6 sm:mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Manage your professional identity and preferences.
          </p>
          {saveMessage && (
            <p
              className={`text-sm mt-2 ${saveMessageIsSuccess ? "text-emerald-600" : "text-red-600"}`}
              role="status"
            >
              {saveMessage}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saveDisabled}
          className={`hidden sm:inline-flex items-center justify-center ${saveButtonClass}`}
          style={saveDisabled ? undefined : { backgroundColor: THEME.primary }}
        >
          {saveState === "saving" ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <section className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5">Profile Information</h3>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="relative shrink-0 mx-auto sm:mx-0 w-36 h-36 sm:w-40 sm:h-40">
              <input
                ref={avatarFileInputRef}
                type="file"
                accept={AVATAR_ACCEPT}
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  void handleAvatarFileSelected(f);
                }}
              />
              <button
                type="button"
                disabled={avatarUploading}
                onClick={openAvatarPicker}
                className="relative w-full h-full rounded-2xl border border-gray-100 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5A2D8F] focus-visible:ring-offset-2 disabled:opacity-60 touch-manipulation"
                aria-label={
                  hasProfilePhoto ? "Change profile photo (max 2 MB)" : "Add profile photo (max 2 MB)"
                }
              >
                {hasProfilePhoto ? (
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${avatarUrl})` }}
                    role="presentation"
                  />
                ) : (
                  <div className="w-full h-full bg-[#E0E7FF] flex items-center justify-center text-[#3730A3] font-semibold text-3xl sm:text-4xl">
                    {avatarInitials}
                  </div>
                )}
                <span
                  className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 pointer-events-none"
                  aria-hidden
                >
                  {avatarUploading ? (
                    <span className="w-5 h-5 border-2 border-gray-300 border-t-[#5A2D8F] rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </span>
              </button>
              <p className="text-[11px] text-gray-400 text-center mt-2 max-w-40 mx-auto sm:mx-0 sm:text-left">
                Tap to upload · JPEG, PNG, WebP, GIF · max 2 MB
              </p>
            </div>
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                  Account type
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "founder" as const, label: "Creative" },
                    { value: "investor" as const, label: "Investor" },
                  ].map((option) => {
                    const active = selectedRole === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedRole(option.value)}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition min-h-[40px] touch-manipulation ${
                          active
                            ? "border-[#5A2D8F] bg-[#EEF2FF] text-[#5A2D8F]"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Switch between Creative and Investor. Save changes to apply.
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-0 min-h-[44px] focus:ring-[#5A2D8F]/40"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                  Location
                </label>
                {!location.trim() && (
                  <p className="text-xs text-gray-500 mb-2">
                    You haven&apos;t added a location yet. Enter your city or region below — it&apos;s optional and you can change it anytime.
                  </p>
                )}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Nairobi, Kenya"
                    className="w-full rounded-xl border border-gray-200 pl-11 pr-4 py-2.5 text-gray-900 text-sm sm:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/40 min-h-[44px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                  Bio
                </label>
                {!bio.trim() && (
                  <p className="text-xs text-gray-500 mb-2">
                    No bio yet. Add a short introduction — what you do, what you&apos;re building, or what you care about.
                  </p>
                )}
                <textarea
                  rows={3}
                  value={bio}
                  maxLength={PROFILE_BIO_MAX_LENGTH}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write your bio here…"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 text-sm sm:text-base placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/40 resize-y min-h-[88px]"
                />
                <p className="text-xs text-gray-400 mt-1.5 text-right tabular-nums">
                  {bio.length}/{PROFILE_BIO_MAX_LENGTH}
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4 space-y-3">
                <div>
                  <h4 className="text-[11px] font-semibold tracking-wide text-gray-500 uppercase">Social</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional — shown under your bio on your public profile. Use @handle or a full URL where
                    helpful.
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                    X (Twitter)
                  </label>
                  <input
                    type="text"
                    value={socialTwitter}
                    maxLength={PROFILE_SOCIAL_MAX_LENGTH}
                    onChange={(e) =>
                      setSocialTwitter(clampSocialInput(e.target.value, PROFILE_SOCIAL_MAX_LENGTH))
                    }
                    placeholder="@you or https://x.com/you"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/40 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    value={socialLinkedin}
                    maxLength={PROFILE_SOCIAL_MAX_LENGTH}
                    onChange={(e) =>
                      setSocialLinkedin(clampSocialInput(e.target.value, PROFILE_SOCIAL_MAX_LENGTH))
                    }
                    placeholder="Profile URL or your public username"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/40 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={socialInstagram}
                    maxLength={PROFILE_SOCIAL_MAX_LENGTH}
                    onChange={(e) =>
                      setSocialInstagram(clampSocialInput(e.target.value, PROFILE_SOCIAL_MAX_LENGTH))
                    }
                    placeholder="@you or profile URL"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/40 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                    Website
                  </label>
                  <input
                    type="text"
                    value={socialWebsite}
                    maxLength={PROFILE_SOCIAL_MAX_LENGTH}
                    onChange={(e) =>
                      setSocialWebsite(clampSocialInput(e.target.value, PROFILE_SOCIAL_MAX_LENGTH))
                    }
                    placeholder="https://yoursite.com"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/40 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                  Expertise
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {isFounderRole
                    ? "Areas you know well — shown on your profile and used to match you with investors."
                    : "Areas you can help with — shown on your investor profile when others browse."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {FOUNDER_INTEREST_SECTOR_OPTIONS.map((sector) => {
                    const active = mentorExpertise.includes(sector);
                    return (
                      <button
                        key={sector}
                        type="button"
                        onClick={() =>
                          setMentorExpertise((prev) =>
                            prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
                          )
                        }
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition min-h-[40px] touch-manipulation ${
                          active
                            ? "border-[#5A2D8F] bg-[#EEF2FF] text-[#5A2D8F]"
                            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {sector}
                      </button>
                    );
                  })}
                </div>
              </div>

              {isFounderRole ? (
                <div>
                  <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                    Sectors you care about
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    We use this to recommend investors who match your interests (along with sectors from your
                    projects).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FOUNDER_INTEREST_SECTOR_OPTIONS.map((sector) => {
                      const active = interestSectors.includes(sector);
                      return (
                        <button
                          key={sector}
                          type="button"
                          onClick={() =>
                            setInterestSectors((prev) =>
                              prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
                            )
                          }
                          className={`rounded-full border px-3 py-2 text-xs font-semibold transition min-h-[40px] touch-manipulation ${
                            active
                              ? "border-[#5A2D8F] bg-[#EEF2FF] text-[#5A2D8F]"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {sector}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                    Interest sectors
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Sectors you follow or want to engage with — shown as interests on your investor profile.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {FOUNDER_INTEREST_SECTOR_OPTIONS.map((sector) => {
                      const active = interestSectors.includes(sector);
                      return (
                        <button
                          key={`int-${sector}`}
                          type="button"
                          onClick={() =>
                            setInterestSectors((prev) =>
                              prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
                            )
                          }
                          className={`rounded-full border px-3 py-2 text-xs font-semibold transition min-h-[40px] touch-manipulation ${
                            active
                              ? "border-[#5A2D8F] bg-[#EEF2FF] text-[#5A2D8F]"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {sector}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 sm:hidden">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saveDisabled}
              className={`inline-flex w-full items-center justify-center ${saveButtonClass}`}
              style={saveDisabled ? undefined : { backgroundColor: THEME.primary }}
            >
              {saveState === "saving" ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </section>

        <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: THEME.primary }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Account Security</h3>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative mb-4">
              <input
                type="email"
                readOnly
                value={email}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/80 pr-11 pl-4 py-2.5 text-sm text-gray-800 min-h-[44px]"
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
                aria-label="Verified"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setChangePasswordOpen(true)}
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 min-h-[44px] touch-manipulation"
            >
              Change Password
            </button>
          </section>

          <section className="rounded-2xl border border-purple-100/80 p-5 sm:p-6 bg-linear-to-br from-purple-50 to-violet-50/90">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900">Profile Visibility</h3>
                <p className="text-sm text-gray-600 mt-0.5">Control who sees your profile</p>
              </div>
              <Toggle
                on={profileVisible}
                onChange={(v) => {
                  void persistProfileVisible(v);
                }}
                ariaLabel="Profile visibility"
              />
            </div>
          </section>
        </div>

        <EliteReachCard {...eliteReach} />
      </div>

      <ChangePasswordModal
        email={email}
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
}
