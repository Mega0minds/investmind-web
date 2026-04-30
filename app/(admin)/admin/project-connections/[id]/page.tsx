import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminShellNavKeys, redirectIfLacksNavAccess } from "@/lib/admin-access";
import { AdminConsoleShell } from "../../_components/AdminConsoleShell";

type PageProps = {
  params: Promise<{ id: string }>;
};

type RequestRow = {
  id: string;
  requester_id: string;
  project_id: string;
  creator_id: string;
  message: string;
  status: "connecting" | "accepted" | "declined" | string;
  created_at: string | null;
};

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  bio: string | null;
  location: string | null;
};

type ProjectRow = {
  id: string;
  project_name: string | null;
  tagline: string | null;
  short_description: string | null;
  status: string | null;
};

function displayName(profile: ProfileRow | undefined): string {
  if (!profile) return "Unknown user";
  const full = profile.full_name?.trim();
  if (full) return full;
  const composed = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  if (composed) return composed;
  return profile.email?.split("@")[0] ?? "Unknown user";
}

function roleLabel(role: string | null): string {
  if (!role) return "Unassigned";
  if (role === "mentor" || role === "investor") return "Mentor";
  if (role === "founder" || role === "innovator") return "Creative";
  if (role === "admin") return "Admin";
  return role;
}

function createdDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}

async function updateProjectRequestStatus(formData: FormData) {
  "use server";
  const requestId = String(formData.get("requestId") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim();
  const nextStatus = action === "accept" ? "accepted" : action === "decline" ? "declined" : "";
  if (!requestId || !nextStatus) return;

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
  if (!actorNav.includes("project_connections")) return;

  const admin = createAdminClient();
  await admin
    .from("project_connection_requests")
    .update({ status: nextStatus })
    .eq("id", requestId)
    .eq("status", "connecting");

  revalidatePath("/admin/project-connections");
  revalidatePath(`/admin/project-connections/${requestId}`);
}

export default async function AdminProjectConnectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!id) redirect("/admin/project-connections");

  const supabase = await createClient();
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
  const guard = redirectIfLacksNavAccess(allowedNavKeys, "project_connections");
  if (guard) redirect(guard);

  const admin = createAdminClient();
  const { data: requestData } = await admin
    .from("project_connection_requests")
    .select("id, requester_id, project_id, creator_id, message, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!requestData) redirect("/admin/project-connections");
  const request = requestData as RequestRow;

  const { data: profilesData } = await admin
    .from("profiles")
    .select("id, first_name, last_name, full_name, email, role, bio, location")
    .in("id", [request.requester_id, request.creator_id]);
  const profiles = (profilesData ?? []) as ProfileRow[];
  const profileMap = new Map<string, ProfileRow>(profiles.map((p) => [p.id, p]));
  const requester = profileMap.get(request.requester_id);
  const owner = profileMap.get(request.creator_id);

  const { data: projectData } = await admin
    .from("projects")
    .select("id, project_name, tagline, short_description, status")
    .eq("id", request.project_id)
    .maybeSingle();
  const project = (projectData ?? null) as ProjectRow | null;

  const statusClass =
    request.status === "accepted"
      ? "bg-emerald-100 text-emerald-700"
      : request.status === "declined"
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-700";
  const statusLabel = request.status === "connecting" ? "requested" : request.status;

  return (
    <AdminConsoleShell
      activeNav="project_connections"
      allowedNavKeys={allowedNavKeys}
      title="Project Request Review"
      subtitle="Review requester, project, and owner before deciding."
    >
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Request #{request.id}</p>
            <h2 className="text-xl font-bold text-gray-900">{project?.project_name?.trim() || "Untitled project"}</h2>
            <p className="mt-1 text-sm text-gray-600">{request.message}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>
              {statusLabel}
            </span>
            <span className="text-xs text-gray-500">{createdDate(request.created_at)}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Requester</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{displayName(requester)}</p>
            <p className="text-sm text-gray-600">{requester?.email ?? "-"}</p>
            <p className="mt-1 text-xs text-gray-500">Role: {roleLabel(requester?.role ?? null)}</p>
            <p className="mt-1 text-xs text-gray-500">Location: {requester?.location || "-"}</p>
            <p className="mt-3 text-sm text-gray-700">{requester?.bio?.trim() || "No bio yet."}</p>
          </article>

          <article className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Project owner</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{displayName(owner)}</p>
            <p className="text-sm text-gray-600">{owner?.email ?? "-"}</p>
            <p className="mt-1 text-xs text-gray-500">Role: {roleLabel(owner?.role ?? null)}</p>
            <p className="mt-1 text-xs text-gray-500">Location: {owner?.location || "-"}</p>
            <p className="mt-3 text-sm text-gray-700">{owner?.bio?.trim() || "No bio yet."}</p>
          </article>
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Project details</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{project?.project_name?.trim() || "Untitled project"}</p>
          <p className="text-sm text-gray-600">{project?.tagline?.trim() || "No tagline."}</p>
          <p className="mt-2 text-sm text-gray-700">{project?.short_description?.trim() || "No description yet."}</p>
          <p className="mt-2 text-xs text-gray-500">Status: {project?.status || "-"}</p>
        </div>

        {request.status === "connecting" ? (
          <form action={updateProjectRequestStatus} className="mt-5 flex flex-wrap items-center gap-2">
            <input type="hidden" name="requestId" value={request.id} />
            <button
              type="submit"
              name="action"
              value="accept"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Accept
            </button>
            <button
              type="submit"
              name="action"
              value="decline"
              className="rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-200"
            >
              Decline
            </button>
          </form>
        ) : null}
      </section>
    </AdminConsoleShell>
  );
}
