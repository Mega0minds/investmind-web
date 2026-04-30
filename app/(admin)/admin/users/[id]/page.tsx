import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminShellNavKeys, redirectIfLacksNavAccess } from "@/lib/admin-access";
import { projectMediaPublicUrl } from "@/lib/project-media-url";
import { AdminConsoleShell } from "../../_components/AdminConsoleShell";
import { ProfileSocialLinks } from "@/components/ProfileSocialLinks";
import { AdminUserEditForm } from "./AdminUserEditForm";
import { ProjectRowActions } from "./ProjectRowActions";

type UserProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ email?: string }>;
};

type AdminViewProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  location: string | null;
  bio: string | null;
  profile_visible: boolean | null;
  created_at: string | null;
  interest_sectors: string[] | null;
  mentor_expertise: string[] | null;
  social_twitter: string | null;
  social_linkedin: string | null;
  social_instagram: string | null;
  social_website: string | null;
};

type AdminViewProject = {
  id: string;
  creator_id: string;
  status: "draft" | "published";
  project_name: string | null;
  tagline: string | null;
  cover_image_file_name: string | null;
  updated_at: string | null;
};

function prettyRole(role: string | null): string {
  if (!role) return "Unassigned";
  if (role === "founder" || role === "innovator") return "Creative";
  if (role === "investor" || role === "mentor") return "Mentor";
  if (role === "admin") return "Admin";
  return role;
}

function fullName(p: AdminViewProfile): string {
  return (
    p.full_name?.trim() ||
    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
    p.email?.split("@")[0] ||
    "User"
  );
}

export default async function AdminUserProfilePage({ params, searchParams }: UserProfilePageProps) {
  const { id } = await params;
  const emailHint = ((searchParams ? await searchParams : {})?.email ?? "").trim().toLowerCase();
  const supabase = await createClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, admin_approval_status")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "admin") redirect("/admin/login");
  if (me?.admin_approval_status !== "approved") redirect("/admin/pending-approval");

  const allowedNavKeys = await getAdminShellNavKeys(user.id);
  const dashGuard = redirectIfLacksNavAccess(allowedNavKeys, "dashboard");
  if (dashGuard) redirect(dashGuard);

  const profileSelectBase =
    "id, first_name, last_name, full_name, email, role, location, bio, profile_visible, created_at, interest_sectors, mentor_expertise";
  const profileSelectWithSocial =
    `${profileSelectBase}, social_twitter, social_linkedin, social_instagram, social_website`;

  async function getProfileBy(field: "id" | "email", value: string) {
    const first = await admin.from("profiles").select(profileSelectWithSocial).eq(field, value).maybeSingle();
    if (first.data) return first.data;
    if (!first.error) return null;

    // Backward compatibility: DB may not have social_* columns yet.
    const missingSocialColumn =
      first.error.message.includes("social_twitter") ||
      first.error.message.includes("social_linkedin") ||
      first.error.message.includes("social_instagram") ||
      first.error.message.includes("social_website");
    if (!missingSocialColumn) return null;

    const fallback = await admin.from("profiles").select(profileSelectBase).eq(field, value).maybeSingle();
    if (!fallback.data) return null;
    return {
      ...fallback.data,
      social_twitter: null,
      social_linkedin: null,
      social_instagram: null,
      social_website: null,
    };
  }

  let profile = await getProfileBy("id", id);
  if (!profile && emailHint) {
    profile = await getProfileBy("email", emailHint);
  }

  if (!profile) {
    return (
      <AdminConsoleShell
        activeNav="dashboard"
        allowedNavKeys={allowedNavKeys}
        title="User Management"
        subtitle="User not found"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-gray-600">User not found.</p>
          <Link href="/admin" className="mt-4 inline-block text-sm font-semibold text-purple-700 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </AdminConsoleShell>
    );
  }

  const userProfile = profile as AdminViewProfile;
  const creatorLike = userProfile.role === "founder" || userProfile.role === "innovator";

  const interests = Array.isArray(userProfile.interest_sectors) ? userProfile.interest_sectors.filter(Boolean) : [];
  const expertise = Array.isArray(userProfile.mentor_expertise) ? userProfile.mentor_expertise.filter(Boolean) : [];

  async function updateUser(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return;

    const supabase = await createClient();
    const {
      data: { user: actor },
    } = await supabase.auth.getUser();
    if (!actor) return;
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("role, admin_approval_status")
      .eq("id", actor.id)
      .maybeSingle();
    if (actorProfile?.role !== "admin" || actorProfile?.admin_approval_status !== "approved") return;
    const actorNav = await getAdminShellNavKeys(actor.id);
    if (!actorNav.includes("dashboard")) return;

    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const bio = String(formData.get("bio") ?? "").trim();
    const role = String(formData.get("role") ?? "").trim();
    const roleValue =
      role === "founder" || role === "innovator" || role === "investor" || role === "mentor" || role === "admin"
        ? role
        : null;

    const interestSectors = String(formData.get("interestSectors") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const mentorExpertise = String(formData.get("mentorExpertise") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const socialTwitter = String(formData.get("socialTwitter") ?? "").trim();
    const socialLinkedin = String(formData.get("socialLinkedin") ?? "").trim();
    const socialInstagram = String(formData.get("socialInstagram") ?? "").trim();
    const socialWebsite = String(formData.get("socialWebsite") ?? "").trim();

    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        full_name: fullName || null,
        location: location || null,
        bio: bio || null,
        role: roleValue,
        interest_sectors: interestSectors,
        mentor_expertise: mentorExpertise,
        social_twitter: socialTwitter || null,
        social_linkedin: socialLinkedin || null,
        social_instagram: socialInstagram || null,
        social_website: socialWebsite || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    revalidatePath(`/admin/users/${id}`);
    revalidatePath("/admin");
  }

  async function setVisibility(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "").trim();
    const makeVisible = String(formData.get("makeVisible") ?? "").trim() === "1";
    if (!id) return;

    const supabase = await createClient();
    const {
      data: { user: actor },
    } = await supabase.auth.getUser();
    if (!actor) return;
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("role, admin_approval_status")
      .eq("id", actor.id)
      .maybeSingle();
    if (actorProfile?.role !== "admin" || actorProfile?.admin_approval_status !== "approved") return;
    const actorNav = await getAdminShellNavKeys(actor.id);
    if (!actorNav.includes("dashboard")) return;

    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ profile_visible: makeVisible, updated_at: new Date().toISOString() })
      .eq("id", id);

    revalidatePath(`/admin/users/${id}`);
    revalidatePath("/admin");
  }

  async function deleteProject(formData: FormData) {
    "use server";
    const projectId = String(formData.get("projectId") ?? "").trim();
    if (!projectId) return;

    const supabase = await createClient();
    const {
      data: { user: actor },
    } = await supabase.auth.getUser();
    if (!actor) return;
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("role, admin_approval_status")
      .eq("id", actor.id)
      .maybeSingle();
    if (actorProfile?.role !== "admin" || actorProfile?.admin_approval_status !== "approved") return;
    const actorNav = await getAdminShellNavKeys(actor.id);
    if (!actorNav.includes("dashboard")) return;

    const admin = createAdminClient();
    await admin.from("projects").delete().eq("id", projectId).eq("creator_id", userProfile.id);

    revalidatePath(`/admin/users/${id}`);
    revalidatePath("/admin");
  }

  const projectsQuery = admin
    .from("projects")
    .select("id, creator_id, status, project_name, tagline, cover_image_file_name, updated_at")
    .eq("creator_id", userProfile.id)
    .order("updated_at", { ascending: false });
  if (creatorLike) {
    projectsQuery.eq("status", "published");
  }
  const { data: projectsData } = await projectsQuery;
  const projects = (projectsData ?? []) as AdminViewProject[];

  return (
    <AdminConsoleShell
      activeNav="dashboard"
      allowedNavKeys={allowedNavKeys}
      title="User Management"
      subtitle="View, edit, and moderate user accounts"
    >
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">User profile</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{fullName(userProfile)}</h1>
            <p className="mt-1 text-sm text-gray-600">{userProfile.email ?? "-"}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-800">
                {prettyRole(userProfile.role)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  userProfile.profile_visible === false
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {userProfile.profile_visible === false ? "Suspended" : "Active"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <form action={setVisibility}>
              <input type="hidden" name="id" value={userProfile.id} />
              <input type="hidden" name="makeVisible" value={userProfile.profile_visible === false ? "1" : "0"} />
              <button
                type="submit"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  userProfile.profile_visible === false
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                }`}
              >
                {userProfile.profile_visible === false ? "Activate user" : "Suspend user"}
              </button>
            </form>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">About</h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              {userProfile.bio?.trim() || "This user has not added a bio yet."}
            </p>
            <ProfileSocialLinks
              profile={{
                social_twitter: userProfile.social_twitter,
                social_linkedin: userProfile.social_linkedin,
                social_instagram: userProfile.social_instagram,
                social_website: userProfile.social_website,
              }}
            />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Account</h2>
            <p className="mt-2 text-sm text-gray-700">Visibility: {userProfile.profile_visible === false ? "Suspended" : "Active"}</p>
            <p className="mt-1 text-sm text-gray-700">Location: {userProfile.location?.trim() || "-"}</p>
            <p className="mt-1 text-sm text-gray-700">Joined: {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : "-"}</p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Sectors</h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              {interests.length ? interests.join(", ") : "No sectors set."}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Expertise</h2>
            <p className="mt-2 text-sm leading-6 text-gray-700">
              {expertise.length ? expertise.join(", ") : "No expertise set."}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Edit user profile</h2>
          <AdminUserEditForm
            userId={userProfile.id}
            action={updateUser}
            initial={{
              firstName: userProfile.first_name ?? "",
              lastName: userProfile.last_name ?? "",
              fullName: userProfile.full_name ?? "",
              role: userProfile.role ?? "",
              location: userProfile.location ?? "",
              bio: userProfile.bio ?? "",
              interestSectors: interests,
              mentorExpertise: expertise,
              socialTwitter: userProfile.social_twitter ?? "",
              socialLinkedin: userProfile.social_linkedin ?? "",
              socialInstagram: userProfile.social_instagram ?? "",
              socialWebsite: userProfile.social_website ?? "",
            }}
          />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-gray-900">
              {creatorLike ? "Published projects" : "User projects"}
            </h2>
            <Link href="/admin" className="text-sm font-semibold text-purple-700 hover:underline">
              Back
            </Link>
          </div>
          {!projects.length ? (
            <p className="mt-3 text-sm text-gray-500">No projects found.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Project</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Updated</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => {
                    const cover = projectMediaPublicUrl(p.cover_image_file_name);
                    return (
                      <tr key={p.id} className="border-t border-gray-100">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100">
                              {cover ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={cover} alt="" className="h-full w-full object-cover" />
                              ) : null}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{p.project_name?.trim() || "Untitled project"}</p>
                              {p.tagline ? <p className="text-xs text-gray-500 line-clamp-1">{p.tagline}</p> : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">{p.status}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">
                          {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <ProjectRowActions
                            projectId={p.id}
                            projectName={p.project_name?.trim() || "Untitled project"}
                            editHref={`/admin/projects/${encodeURIComponent(p.id)}/edit`}
                            deleteAction={deleteProject}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminConsoleShell>
  );
}

