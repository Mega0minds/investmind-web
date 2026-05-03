import Link from "next/link";
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
  id: number;
  requester_id: string;
  mentor_id: string;
  message: string;
  status: "pending" | "accepted" | "declined" | string;
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
  if (role === "mentor" || role === "investor") return "Investor";
  if (role === "founder" || role === "innovator") return "Creative";
  if (role === "admin") return "Admin";
  return role;
}

function createdDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}

async function acceptRequest(formData: FormData) {
  "use server";
  try {
    const rawId = String(formData.get("requestId") ?? "").trim();
    const requestId = Number.parseInt(rawId, 10);
    if (!Number.isFinite(requestId) || requestId <= 0) return;

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
    if (!actorNav.includes("connections")) return;

    const admin = createAdminClient();
    await admin
      .from("mentorship_requests")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("status", "pending");

    revalidatePath("/admin/connections");
    revalidatePath(`/admin/connections/${requestId}`);
  } catch {
    // Avoid breaking the Server Action response shape in transient network failures.
  }
}

export default async function AdminConnectionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const requestId = Number.parseInt(id, 10);
  if (!Number.isFinite(requestId) || requestId <= 0) redirect("/admin/connections");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("first_name, full_name, role, admin_approval_status")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "admin") redirect("/admin/login");
  if (me?.admin_approval_status !== "approved") redirect("/admin/pending-approval");

  const allowedNavKeys = await getAdminShellNavKeys(user.id);
  const guard = redirectIfLacksNavAccess(allowedNavKeys, "connections");
  if (guard) redirect(guard);

  const admin = createAdminClient();
  const { data: requestRow } = await admin
    .from("mentorship_requests")
    .select("id, requester_id, mentor_id, message, status, created_at")
    .eq("id", requestId)
    .maybeSingle();
  if (!requestRow) {
    return (
      <AdminConsoleShell
        activeNav="connections"
        allowedNavKeys={allowedNavKeys}
        title="Connections"
        subtitle="Request not found"
      >
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Connection request not found.</p>
          <Link href="/admin/connections" className="mt-3 inline-block text-sm font-semibold text-purple-700 hover:underline">
            Back to connections
          </Link>
        </section>
      </AdminConsoleShell>
    );
  }

  const request = requestRow as RequestRow;
  const { data: profilesData } = await admin
    .from("profiles")
    .select("id, first_name, last_name, full_name, email, role, bio, location")
    .in("id", [request.requester_id, request.mentor_id]);
  const profiles = (profilesData ?? []) as ProfileRow[];
  const profileMap = new Map<string, ProfileRow>(profiles.map((p) => [p.id, p]));
  const requester = profileMap.get(request.requester_id);
  const recipient = profileMap.get(request.mentor_id);

  const statusClass =
    request.status === "accepted"
      ? "bg-emerald-100 text-emerald-700"
      : request.status === "declined"
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-700";

  return (
    <AdminConsoleShell
      activeNav="connections"
      allowedNavKeys={allowedNavKeys}
      title="Connection Review"
      subtitle="Compare users side by side and approve the request."
    >
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">Request #{request.id}</p>
            <h2 className="text-xl font-bold text-gray-900">Connection request details</h2>
            <p className="mt-1 text-sm text-gray-600">{request.message}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>
              {request.status}
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
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recipient</p>
            <p className="mt-2 text-lg font-semibold text-gray-900">{displayName(recipient)}</p>
            <p className="text-sm text-gray-600">{recipient?.email ?? "-"}</p>
            <p className="mt-1 text-xs text-gray-500">Role: {roleLabel(recipient?.role ?? null)}</p>
            <p className="mt-1 text-xs text-gray-500">Location: {recipient?.location || "-"}</p>
            <p className="mt-3 text-sm text-gray-700">{recipient?.bio?.trim() || "No bio yet."}</p>
          </article>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {request.status === "pending" ? (
            <form action={acceptRequest}>
              <input type="hidden" name="requestId" value={String(request.id)} />
              <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
                Accept
              </button>
            </form>
          ) : null}
        </div>
      </section>
    </AdminConsoleShell>
  );
}
