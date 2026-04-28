import Image from "next/image";
import Link from "next/link";
import { DashboardShell } from "../_components/DashboardShell";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole, roleIn, rolesForAudienceFilter } from "@/lib/roles";
import { RecordProfileView } from "@/components/RecordProfileView";
import { MentorProfileConnect } from "./MentorProfileConnect";
import { projectMediaPublicUrl } from "@/lib/project-media-url";
import { ProfileSocialLinks } from "@/components/ProfileSocialLinks";

type MentorshipPageProps = {
  searchParams?: Promise<{ mentor?: string }>;
};

/** Row for `/mentorship?mentor=` — social fields optional when DB not migrated yet. */
type MentorshipProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  location: string | null;
  role: string | null;
  mentor_expertise: string[] | null;
  interest_sectors: string[] | null;
  profile_visible: boolean | null;
  social_twitter?: string | null;
  social_linkedin?: string | null;
  social_instagram?: string | null;
  social_website?: string | null;
};

export default async function MentorshipPage({ searchParams }: MentorshipPageProps) {
  const params = searchParams ? await searchParams : {};
  const mentorId = params?.mentor?.trim() || "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!mentorId) {
    const { data: mentors } = await supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name, bio, location, role, mentor_expertise, profile_visible")
      .in("role", rolesForAudienceFilter("investor"))
      .eq("profile_visible", true)
      .neq("id", user?.id ?? "")
      .order("updated_at", { ascending: false })
      .limit(100);

    const { data: creatives } = await supabase
      .from("profiles")
      .select("id, full_name, first_name, last_name, bio, location, role, mentor_expertise, profile_visible")
      .in("role", rolesForAudienceFilter("founder"))
      .eq("profile_visible", true)
      .neq("id", user?.id ?? "")
      .order("updated_at", { ascending: false })
      .limit(100);

    return (
      <DashboardShell title="Mentorship Hub">
        <div className="space-y-8">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Mentors</h2>
            <p className="mt-1 text-sm text-gray-500">
              Browse mentors and open a profile to connect or read more.
            </p>
            {!mentors?.length ? (
              <p className="mt-4 text-sm text-gray-600">No visible mentors found right now.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {mentors.map((mentor) => {
                  const name =
                    mentor.full_name?.trim() ||
                    [mentor.first_name, mentor.last_name].filter(Boolean).join(" ").trim() ||
                    "Mentor";
                  const expertise = Array.isArray(mentor.mentor_expertise)
                    ? mentor.mentor_expertise.filter(
                        (item): item is string => typeof item === "string" && item.trim().length > 0
                      )
                    : [];
                  return (
                    <a
                      key={mentor.id}
                      href={`/mentorship?mentor=${encodeURIComponent(mentor.id)}`}
                      className="block rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-white hover:shadow-sm transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700 shrink-0">
                          {name
                            .split(" ")
                            .map((part: string) => part[0] ?? "")
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{name}</p>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {expertise.length ? expertise.slice(0, 2).join(" · ") : "Mentor"}
                          </p>
                          {mentor.location ? (
                            <p className="mt-1 text-xs text-gray-500 truncate">{mentor.location}</p>
                          ) : null}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Creatives</h2>
            <p className="mt-1 text-sm text-gray-500">
              Browse creative profiles and their published projects.
            </p>
            {!creatives?.length ? (
              <p className="mt-4 text-sm text-gray-600">No visible creatives found right now.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {creatives.map((c) => {
                  const name =
                    c.full_name?.trim() ||
                    [c.first_name, c.last_name].filter(Boolean).join(" ").trim() ||
                    "Creative";
                  const expertise = Array.isArray(c.mentor_expertise)
                    ? c.mentor_expertise.filter(
                        (item): item is string => typeof item === "string" && item.trim().length > 0
                      )
                    : [];
                  return (
                    <a
                      key={c.id}
                      href={`/mentorship?mentor=${encodeURIComponent(c.id)}`}
                      className="block rounded-xl border border-gray-200 bg-gray-50 p-4 hover:bg-white hover:shadow-sm transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-800 shrink-0">
                          {name
                            .split(" ")
                            .map((part: string) => part[0] ?? "")
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{name}</p>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {expertise.length ? expertise.slice(0, 2).join(" · ") : "Creative"}
                          </p>
                          {c.location ? <p className="mt-1 text-xs text-gray-500 truncate">{c.location}</p> : null}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </DashboardShell>
    );
  }
  const PROFILE_SELECT_WITH_SOCIAL =
    "id, full_name, first_name, last_name, bio, location, role, mentor_expertise, interest_sectors, profile_visible, social_twitter, social_linkedin, social_instagram, social_website";
  const PROFILE_SELECT_WITHOUT_SOCIAL =
    "id, full_name, first_name, last_name, bio, location, role, mentor_expertise, interest_sectors, profile_visible";

  const fullProfile = await supabase
    .from("profiles")
    .select(PROFILE_SELECT_WITH_SOCIAL)
    .eq("id", mentorId)
    .maybeSingle();

  let mentor: MentorshipProfileRow | null = (fullProfile.data as MentorshipProfileRow | null) ?? null;
  if (
    fullProfile.error?.message &&
    /column/i.test(fullProfile.error.message) &&
    /does not exist/i.test(fullProfile.error.message)
  ) {
    const fallback = await supabase
      .from("profiles")
      .select(PROFILE_SELECT_WITHOUT_SOCIAL)
      .eq("id", mentorId)
      .maybeSingle();
    mentor = (fallback.data as MentorshipProfileRow | null) ?? null;
  }

  const viewerIsOwner = Boolean(user?.id && mentor?.id && user.id === mentor.id);

  if (!mentor) {
    return (
      <DashboardShell title="Profile">
        <div className="space-y-2 text-gray-600">
          <p>This profile is unavailable right now.</p>
          <p className="text-sm text-gray-500">
            Usually this means the profile id in the URL is wrong or there is no profile row yet. After pulling app
            updates, run pending{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-800">supabase/migrations</code> so new
            profile columns exist.
          </p>
        </div>
      </DashboardShell>
    );
  }

  if (mentor.profile_visible === false && !viewerIsOwner) {
    return (
      <DashboardShell title="Profile">
        <div className="space-y-2 text-gray-600">
          <p>This profile is unavailable right now.</p>
          <p className="text-sm text-gray-500">This member has turned off profile visibility in Settings.</p>
        </div>
      </DashboardShell>
    );
  }

  let hasActiveMentorshipRequest = false;
  if (user?.id && mentor?.id && user.id !== mentor.id) {
    const { data: existingReq } = await supabase
      .from("mentorship_requests")
      .select("id")
      .eq("requester_id", user.id)
      .eq("mentor_id", mentor.id)
      .in("status", ["pending", "accepted"])
      .maybeSingle();
    hasActiveMentorshipRequest = Boolean(existingReq);
  }

  const name =
    mentor?.full_name?.trim() ||
    [mentor?.first_name, mentor?.last_name].filter(Boolean).join(" ").trim() ||
    "Mentor";
  const normalizedRole = normalizeRole(mentor?.role ?? null);
  const visibleRole = normalizedRole === "founder" ? "Creative" : "Mentor";
  const expertise = Array.isArray(mentor?.mentor_expertise)
    ? mentor.mentor_expertise.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const interests = Array.isArray(mentor?.interest_sectors)
    ? mentor.interest_sectors.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

  const isCreativeProfile = normalizedRole === "founder";
  let publishedProjects: Array<{
    id: string;
    project_name: string | null;
    tagline: string | null;
    cover_image_file_name: string | null;
    updated_at: string | null;
  }> = [];
  if (mentor && isCreativeProfile && (mentor.profile_visible !== false || viewerIsOwner)) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id, project_name, tagline, cover_image_file_name, updated_at")
      .eq("creator_id", mentor.id)
      .eq("status", "published")
      .order("updated_at", { ascending: false });
    if (Array.isArray(proj)) {
      publishedProjects = proj as typeof publishedProjects;
    }
  }

  const profileShellTitle = isCreativeProfile ? "Creative profile" : "Mentor profile";

  return (
    <DashboardShell title={profileShellTitle}>
        <div className="space-y-6">
          <RecordProfileView profileUserId={mentor.id} />
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${
                  isCreativeProfile ? "bg-indigo-100 text-indigo-800" : "bg-purple-100 text-purple-700"
                }`}
              >
                {name
                  .split(" ")
                  .map((part: string) => part[0] ?? "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                <p className="mt-1 text-sm text-gray-500">{visibleRole}</p>
                {mentor.location ? <p className="mt-2 text-sm text-gray-600">{mentor.location}</p> : null}
                {user?.id && user.id !== mentor.id && roleIn(mentor.role, "investor") ? (
                  <MentorProfileConnect
                    mentorId={mentor.id}
                    mentorName={name}
                    hasActiveRequestInitially={hasActiveMentorshipRequest}
                  />
                ) : null}
              </div>
            </div>

            {isCreativeProfile ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Published projects so far
                </h3>
                {publishedProjects.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-600">No published projects yet.</p>
                ) : (
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {publishedProjects.map((p) => {
                      const cover = projectMediaPublicUrl(p.cover_image_file_name);
                      const title = p.project_name?.trim() || "Untitled project";
                      const sub = p.tagline?.trim() || "";
                      return (
                        <li key={p.id}>
                          <Link
                            href={`/listings/${encodeURIComponent(p.id)}`}
                            className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition hover:border-purple-200 hover:bg-white hover:shadow-sm"
                          >
                            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                              {cover ? (
                                <Image
                                  src={cover}
                                  alt=""
                                  fill
                                  unoptimized
                                  className="object-cover"
                                  sizes="80px"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{title}</p>
                              {sub ? <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{sub}</p> : null}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : null}

            <div className={`grid gap-6 md:grid-cols-2 ${isCreativeProfile ? "mt-8" : "mt-6"}`}>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">About</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {mentor.bio?.trim() || "This member has not added a bio yet."}
                </p>
                <ProfileSocialLinks
                  profile={{
                    social_twitter: mentor.social_twitter ?? null,
                    social_linkedin: mentor.social_linkedin ?? null,
                    social_instagram: mentor.social_instagram ?? null,
                    social_website: mentor.social_website ?? null,
                  }}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Expertise</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {expertise.length ? expertise.join(", ") : "No expertise areas added yet."}
                </p>
                <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-gray-500">Interests</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {interests.length ? interests.join(", ") : "No interest sectors added yet."}
                </p>
              </div>
            </div>
          </section>
        </div>
    </DashboardShell>
  );
}
