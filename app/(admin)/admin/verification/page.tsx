import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAdminShellNavKeys,
  isSuperAdminEmail,
  navKeysFromForm,
  parseAdminSidebarAccess,
  redirectIfLacksNavAccess,
  type AdminNavKey,
} from "@/lib/admin-access";
import { AdminConsoleShell } from "../_components/AdminConsoleShell";

type AdminRequestRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  admin_approval_status: string | null;
  admin_sidebar_access: unknown;
  created_at: string | null;
};

function displayName(row: AdminRequestRow): string {
  const full = row.full_name?.trim();
  if (full) return full;
  const composed = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  if (composed) return composed;
  return row.email?.split("@")[0] ?? "Admin user";
}

function dateText(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}

function sidebarSummary(keys: AdminNavKey[] | null): string {
  if (!keys?.length) return "—";
  const labels: Record<AdminNavKey, string> = {
    dashboard: "Dashboard",
    verification: "Verification",
    connections: "Connections",
    project_connections: "Project Connections",
  };
  return keys.map((k) => labels[k]).join(", ");
}

type AdminSupabase = ReturnType<typeof createAdminClient>;
async function getTargetEmail(admin: AdminSupabase, targetId: string) {
  const { data } = await admin.from("profiles").select("email").eq("id", targetId).maybeSingle();
  return data?.email ?? null;
}

export default async function AdminVerificationPage() {
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
  const verificationRedirect = redirectIfLacksNavAccess(allowedNavKeys, "verification");
  if (verificationRedirect) redirect(verificationRedirect);

  async function approveAdmin(formData: FormData) {
    "use server";
    const targetId = String(formData.get("targetId") ?? "").trim();
    if (!targetId) return;

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
    if (!actorNav.includes("verification")) return;

    const admin = createAdminClient();
    const targetEmail = await getTargetEmail(admin, targetId);
    if (isSuperAdminEmail(targetEmail)) return;

    const keys = navKeysFromForm(formData);
    await admin
      .from("profiles")
      .update({
        role: "admin",
        admin_approval_status: "approved",
        admin_authority_level: null,
        admin_sidebar_access: keys,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetId);

    revalidatePath("/admin/verification");
    revalidatePath("/admin");
  }

  async function rejectAdmin(formData: FormData) {
    "use server";
    const targetId = String(formData.get("targetId") ?? "").trim();
    if (!targetId) return;

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
    if (!actorNav.includes("verification")) return;

    const admin = createAdminClient();
    const targetEmail = await getTargetEmail(admin, targetId);
    if (isSuperAdminEmail(targetEmail)) return;

    await admin
      .from("profiles")
      .update({
        admin_approval_status: "rejected",
        admin_authority_level: null,
        admin_sidebar_access: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetId);

    revalidatePath("/admin/verification");
    revalidatePath("/admin");
  }

  async function updateSidebarAccess(formData: FormData) {
    "use server";
    const targetId = String(formData.get("targetId") ?? "").trim();
    if (!targetId) return;

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
    if (!actorNav.includes("verification")) return;

    const admin = createAdminClient();
    const targetEmail = await getTargetEmail(admin, targetId);
    if (isSuperAdminEmail(targetEmail)) return;

    const keys = navKeysFromForm(formData);
    await admin
      .from("profiles")
      .update({
        admin_sidebar_access: keys,
        admin_authority_level: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetId)
      .eq("admin_approval_status", "approved");

    revalidatePath("/admin/verification");
    revalidatePath("/admin");
  }

  const admin = createAdminClient();
  let pending: AdminRequestRow[] = [];
  let approved: AdminRequestRow[] = [];

  const pendingRes = await admin
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, email, admin_approval_status, admin_sidebar_access, created_at"
    )
    .eq("role", "admin")
    .in("admin_approval_status", ["pending", "none"])
    .order("created_at", { ascending: true });

  if (pendingRes.error?.message?.includes("admin_sidebar_access") && pendingRes.error.message.includes("does not exist")) {
    const r = await admin
      .from("profiles")
      .select("id, full_name, first_name, last_name, email, admin_approval_status, created_at")
      .eq("role", "admin")
      .in("admin_approval_status", ["pending", "none"])
      .order("created_at", { ascending: true });
    pending = ((r.data ?? []) as Omit<AdminRequestRow, "admin_sidebar_access">[]).map((row) => ({
      ...row,
      admin_sidebar_access: null,
    }));
  } else {
    pending = (pendingRes.data ?? []) as AdminRequestRow[];
  }

  const approvedRes = await admin
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, email, admin_approval_status, admin_sidebar_access, created_at"
    )
    .eq("role", "admin")
    .eq("admin_approval_status", "approved")
    .order("created_at", { ascending: true });

  if (approvedRes.error?.message?.includes("admin_sidebar_access") && approvedRes.error.message.includes("does not exist")) {
    const r = await admin
      .from("profiles")
      .select("id, full_name, first_name, last_name, email, admin_approval_status, created_at")
      .eq("role", "admin")
      .eq("admin_approval_status", "approved")
      .order("created_at", { ascending: true });
    approved = ((r.data ?? []) as Omit<AdminRequestRow, "admin_sidebar_access">[]).map((row) => ({
      ...row,
      admin_sidebar_access: null,
    }));
  } else {
    approved = (approvedRes.data ?? []) as AdminRequestRow[];
  }

  return (
    <AdminConsoleShell
      activeNav="verification"
      allowedNavKeys={allowedNavKeys}
      title="Verification"
      subtitle="Approve admin access and choose which sidebar areas each admin can open."
    >
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Pending admin requests</h2>
          {pending.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No pending admin requests.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Requested</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Sidebar access</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((row) => {
                    const locked = isSuperAdminEmail(row.email);
                    return (
                      <tr key={row.id} className="border-t border-gray-100">
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">{displayName(row)}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{row.email ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{dateText(row.created_at)}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">
                          {locked ? (
                            <span className="text-xs text-gray-500">Protected account</span>
                          ) : (
                            <form id={`pending-${row.id}`} action={approveAdmin} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                              <input type="hidden" name="targetId" value={row.id} />
                              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                <input type="checkbox" name="nav_dashboard" value="1" defaultChecked className="rounded border-gray-300" />
                                Dashboard
                              </label>
                              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                <input type="checkbox" name="nav_verification" value="1" defaultChecked className="rounded border-gray-300" />
                                Verification
                              </label>
                              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                <input type="checkbox" name="nav_connections" value="1" defaultChecked className="rounded border-gray-300" />
                                Connections
                              </label>
                              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                <input type="checkbox" name="nav_project_connections" value="1" defaultChecked className="rounded border-gray-300" />
                                Project Connections
                              </label>
                              <button
                                type="submit"
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                              >
                                Approve
                              </button>
                            </form>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {locked ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <form action={rejectAdmin} className="inline-block">
                              <input type="hidden" name="targetId" value={row.id} />
                              <button
                                type="submit"
                                className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                              >
                                Reject
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Approved admins</h2>
          {approved.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No approved admins yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Current access</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Update access</th>
                  </tr>
                </thead>
                <tbody>
                  {approved.map((row) => {
                    const locked = isSuperAdminEmail(row.email);
                    const current = parseAdminSidebarAccess(row.admin_sidebar_access);
                    const hasDash = current?.includes("dashboard") ?? true;
                    const hasVer = current?.includes("verification") ?? true;
                    const hasConnections = current?.includes("connections") ?? true;
                    const hasProjectConnections = current?.includes("project_connections") ?? true;
                    return (
                      <tr key={row.id} className="border-t border-gray-100">
                        <td className="px-3 py-3 text-sm font-medium text-gray-900">{displayName(row)}</td>
                        <td className="px-3 py-3 text-sm text-gray-600">{row.email ?? "-"}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">
                          {locked ? (
                            <span className="inline-flex flex-col gap-1">
                              <span className="font-semibold text-purple-800">Super admin</span>
                              <span className="text-xs text-gray-500">Full sidebar — cannot be changed here.</span>
                            </span>
                          ) : (
                            sidebarSummary(current)
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {locked ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <form action={updateSidebarAccess} className="inline-flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                              <input type="hidden" name="targetId" value={row.id} />
                              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  name="nav_dashboard"
                                  value="1"
                                  defaultChecked={hasDash}
                                  className="rounded border-gray-300"
                                />
                                Dashboard
                              </label>
                              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  name="nav_verification"
                                  value="1"
                                  defaultChecked={hasVer}
                                  className="rounded border-gray-300"
                                />
                                Verification
                              </label>
                              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  name="nav_connections"
                                  value="1"
                                  defaultChecked={hasConnections}
                                  className="rounded border-gray-300"
                                />
                                Connections
                              </label>
                              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  name="nav_project_connections"
                                  value="1"
                                  defaultChecked={hasProjectConnections}
                                  className="rounded border-gray-300"
                                />
                                Project Connections
                              </label>
                              <button
                                type="submit"
                                className="rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-200"
                              >
                                Save access
                              </button>
                            </form>
                          )}
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
