import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminShellNavKeys, redirectIfLacksNavAccess } from "@/lib/admin-access";
import { AdminUserSearch } from "./_components/AdminUserSearch";
import { AdminConsoleShell } from "./_components/AdminConsoleShell";
import { AdminUserActionButtons } from "./_components/AdminUserActionButtons";

type AdminDashboardProps = {
  searchParams?: Promise<{
    q?: string;
    tab?: string;
    page?: string;
  }>;
};

type StatCardProps = {
  label: string;
  value: number;
  sub?: string;
};

function StatCard({ label, value, sub }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
      {sub ? <p className="mt-1 text-sm text-gray-500">{sub}</p> : null}
    </div>
  );
}

type UserRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
  profile_visible: boolean | null;
};

function roleLabel(role: string | null): string {
  if (!role) return "Unassigned";
  if (role === "mentor" || role === "investor") return "Mentor";
  if (role === "founder" || role === "innovator") return "Creative";
  if (role === "admin") return "Admin";
  return role;
}

function displayName(u: UserRow): string {
  const full = u.full_name?.trim();
  if (full) return full;
  const composed = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  if (composed) return composed;
  return u.email?.split("@")[0] ?? "Unknown user";
}

function createdDate(s: string | null): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function statusFromVisibility(v: boolean | null): "Active" | "Suspended" {
  return v === false ? "Suspended" : "Active";
}

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  const params = searchParams ? await searchParams : {};
  const q = (params?.q ?? "").trim();
  const tabRaw = (params?.tab ?? "all").trim().toLowerCase();
  const tab =
    tabRaw === "mentors" || tabRaw === "creatives" || tabRaw === "suspended" ? tabRaw : "all";
  const pageNum = Math.max(1, Number.parseInt(params?.page ?? "1", 10) || 1);
  const pageSize = 12;
  const from = (pageNum - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const myProfile = await supabase
    .from("profiles")
    .select("first_name, full_name, role, admin_approval_status")
    .eq("id", user.id)
    .maybeSingle();

  const role = myProfile.data?.role ?? null;
  const approval = myProfile.data?.admin_approval_status ?? "none";
  if (role !== "admin") redirect("/admin/login");
  if (approval !== "approved") redirect("/admin/pending-approval");

  const allowedNavKeys = await getAdminShellNavKeys(user.id);
  const dashGuard = redirectIfLacksNavAccess(allowedNavKeys, "dashboard");
  if (dashGuard) redirect(dashGuard);

  // Use service-role reads for admin dashboard so suspended users remain visible in admin lists.
  const admin = createAdminClient();
  const [totalUsersQ, totalMentorsQ, totalCreativesQ, totalSuspendedQ] = await Promise.all([
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .or("role.is.null,role.neq.admin")
      .neq("profile_visible", false),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["investor", "mentor"])
      .neq("profile_visible", false),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["founder", "innovator"])
      .neq("profile_visible", false),
    admin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .or("role.is.null,role.neq.admin")
      .eq("profile_visible", false),
  ]);

  let usersQuery = admin
    .from("profiles")
    .select(
      "id, first_name, last_name, full_name, email, role, created_at, profile_visible",
      { count: "exact" }
    )
    .or("role.is.null,role.neq.admin")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (tab === "mentors") {
    usersQuery = usersQuery.in("role", ["investor", "mentor"]);
  } else if (tab === "creatives") {
    usersQuery = usersQuery.in("role", ["founder", "innovator"]);
  } else if (tab === "suspended") {
    usersQuery = usersQuery.eq("profile_visible", false);
  }

  if (q) {
    const safeQ = q.replace(/[%_,]/g, "");
    usersQuery = usersQuery.or(
      `email.ilike.%${safeQ}%,full_name.ilike.%${safeQ}%,first_name.ilike.%${safeQ}%,last_name.ilike.%${safeQ}%`
    );
  }

  const usersResult = await usersQuery;
  const users = (usersResult.data ?? []) as UserRow[];
  const totalRows = usersResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const adminName =
    myProfile.data?.first_name?.trim() ||
    myProfile.data?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Admin";

  const totalUsers = totalUsersQ.count ?? 0;
  const totalMentors = totalMentorsQ.count ?? 0;
  const totalCreatives = totalCreativesQ.count ?? 0;
  const totalSuspended = totalSuspendedQ.count ?? 0;

  async function toggleUserStatus(formData: FormData) {
    "use server";

    const userId = String(formData.get("userId") ?? "").trim();
    const makeVisible = String(formData.get("makeVisible") ?? "").trim() === "1";
    if (!userId) return;

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

    if (actorProfile?.role !== "admin" || actorProfile?.admin_approval_status !== "approved") {
      return;
    }

    const actorNav = await getAdminShellNavKeys(actor.id);
    if (!actorNav.includes("dashboard")) return;

    const admin = createAdminClient();
    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({ profile_visible: makeVisible, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .neq("role", "admin")
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw new Error(`Failed to update user status: ${updateError.message}`);
    }
    if (!updated) {
      throw new Error("User status update was not applied.");
    }

    revalidatePath("/admin");
  }

  return (
    <AdminConsoleShell
      activeNav="dashboard"
      allowedNavKeys={allowedNavKeys}
      title="Dashboard"
      subtitle={`Welcome back, ${adminName}`}
    >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total users" value={totalUsers} sub="Active only, excludes admins" />
              <StatCard label="Total mentors" value={totalMentors} sub="Active only: investor + mentor" />
              <StatCard label="Total creatives" value={totalCreatives} sub="Active only: founder + innovator" />
              <StatCard label="Total suspended" value={totalSuspended} sub="Users with suspended visibility" />
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">User Management</h2>
                  <p className="text-sm text-gray-500">Manage customer accounts and platform access.</p>
                </div>
                <AdminUserSearch initialQuery={q} tab={tab} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { key: "all", label: "All Users" },
                  { key: "mentors", label: "Mentors" },
                  { key: "creatives", label: "Creatives" },
                  { key: "suspended", label: "Suspended" },
                ].map((t) => {
                  const active = tab === t.key;
                  const href = `/admin?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
                  return (
                    <Link
                      key={t.key}
                      href={href}
                      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                        active ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {t.label}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Join date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">
                          No users found for this filter.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => {
                        const status = statusFromVisibility(u.profile_visible);
                        const active = status === "Active";
                        return (
                          <tr key={u.id} className="border-t border-gray-100">
                            <td className="px-3 py-3 text-sm font-medium text-gray-900">{displayName(u)}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{u.email ?? "-"}</td>
                            <td className="px-3 py-3 text-sm text-gray-700">{roleLabel(u.role)}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{createdDate(u.created_at)}</td>
                            <td className="px-3 py-3 text-sm">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  active ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <AdminUserActionButtons
                                userId={u.id}
                                userName={displayName(u)}
                                active={active}
                                editHref={`/admin/users/${encodeURIComponent(u.id)}${
                                  u.email ? `?email=${encodeURIComponent(u.email)}` : ""
                                }`}
                                action={toggleUserStatus}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
                <p>
                  Showing {users.length ? from + 1 : 0}-{Math.min(from + users.length, totalRows)} of {totalRows} users
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin?tab=${tab}&q=${encodeURIComponent(q)}&page=${Math.max(1, pageNum - 1)}`}
                    className={`rounded-lg border px-3 py-1.5 ${pageNum <= 1 ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
                  >
                    Prev
                  </Link>
                  <span>
                    Page {pageNum} / {totalPages}
                  </span>
                  <Link
                    href={`/admin?tab=${tab}&q=${encodeURIComponent(q)}&page=${Math.min(totalPages, pageNum + 1)}`}
                    className={`rounded-lg border px-3 py-1.5 ${pageNum >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-gray-50"}`}
                  >
                    Next
                  </Link>
                </div>
              </div>
            </div>
    </AdminConsoleShell>
  );
}
