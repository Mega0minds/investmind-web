import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminShellNavKeys, redirectIfLacksNavAccess } from "@/lib/admin-access";
import { AdminConsoleShell } from "../_components/AdminConsoleShell";

type ProjectConnectionRow = {
  id: string;
  requester_id: string;
  project_id: string;
  creator_id: string;
  message: string;
  status: "connecting" | "accepted" | "declined" | string;
  created_at: string | null;
};

type BasicProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

type ProjectRow = {
  id: string;
  project_name: string | null;
};

function createdDate(s: string | null): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function roleLabel(role: string | null): string {
  if (!role) return "Unassigned";
  if (role === "mentor" || role === "investor") return "Investor";
  if (role === "founder" || role === "innovator") return "Creative";
  if (role === "admin") return "Admin";
  return role;
}

function profileDisplayName(profile: BasicProfileRow | undefined): string {
  if (!profile) return "Unknown user";
  const full = profile.full_name?.trim();
  if (full) return full;
  const composed = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  if (composed) return composed;
  return profile.email?.split("@")[0] ?? "Unknown user";
}

export default async function AdminProjectConnectionsPage() {
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
  const guard = redirectIfLacksNavAccess(allowedNavKeys, "project_connections");
  if (guard) redirect(guard);

  const admin = createAdminClient();
  let requests: ProjectConnectionRow[] = [];
  let requestsEnabled = true;

  const requestsRes = await admin
    .from("project_connection_requests")
    .select("id, requester_id, project_id, creator_id, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (requestsRes.error) {
    requestsEnabled = !/does not exist|relation/i.test(requestsRes.error.message);
  } else {
    requests = (requestsRes.data ?? []) as ProjectConnectionRow[];
  }

  const profileIds = Array.from(new Set(requests.flatMap((r) => [r.requester_id, r.creator_id]).filter(Boolean)));
  const projectIds = Array.from(new Set(requests.map((r) => r.project_id).filter(Boolean)));
  const profilesRes = profileIds.length
    ? await admin.from("profiles").select("id, first_name, last_name, full_name, email, role").in("id", profileIds)
    : { data: [] as BasicProfileRow[] };
  const projectsRes = projectIds.length
    ? await admin.from("projects").select("id, project_name").in("id", projectIds)
    : { data: [] as ProjectRow[] };

  const profileMap = new Map<string, BasicProfileRow>(((profilesRes.data ?? []) as BasicProfileRow[]).map((p) => [p.id, p]));
  const projectMap = new Map<string, ProjectRow>(((projectsRes.data ?? []) as ProjectRow[]).map((p) => [p.id, p]));

  const adminName =
    me?.first_name?.trim() ||
    me?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Admin";
  const requestedRows = requests.filter((r) => r.status === "connecting");
  const decidedRows = requests.filter((r) => r.status !== "connecting");

  return (
    <AdminConsoleShell
      activeNav="project_connections"
      allowedNavKeys={allowedNavKeys}
      title="Project Connections"
      subtitle={`Requests to connect through projects. Welcome back, ${adminName}.`}
    >
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Project-based connection requests</h2>
        <p className="text-sm text-gray-500">
          Requests created from a project/listing page to connect with that project owner.
        </p>

        {!requestsEnabled ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Project connection requests table is not enabled yet. Run `supabase/migrations/012_project_connection_requests.sql`.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Requester</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Project owner</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Project</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Message</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {requestedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-gray-500">
                      No requested project connections right now.
                    </td>
                  </tr>
                ) : (
                  requestedRows.map((req) => {
                    const requester = profileMap.get(req.requester_id);
                    const owner = profileMap.get(req.creator_id);
                    const project = projectMap.get(req.project_id);

                    return (
                      <tr key={req.id} className="border-t border-gray-100">
                        <td className="px-3 py-3 text-sm text-gray-800">
                          <p className="font-medium text-gray-900">{profileDisplayName(requester)}</p>
                          <p className="text-xs text-gray-500">{roleLabel(requester?.role ?? null)}</p>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-800">
                          <p className="font-medium text-gray-900">{profileDisplayName(owner)}</p>
                          <p className="text-xs text-gray-500">{roleLabel(owner?.role ?? null)}</p>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">{project?.project_name?.trim() || "Untitled project"}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">{req.message}</td>
                        <td className="px-3 py-3 text-sm">
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                            requested
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{createdDate(req.created_at)}</td>
                        <td className="px-3 py-3 text-right">
                          <Link
                            href={`/admin/project-connections/${req.id}`}
                            className="inline-flex rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-200"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {requestsEnabled ? (
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Accepted / Declined</h2>
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Requester</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Project owner</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Project</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {decidedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">
                      No accepted or declined requests yet.
                    </td>
                  </tr>
                ) : (
                  decidedRows.map((req) => {
                    const requester = profileMap.get(req.requester_id);
                    const owner = profileMap.get(req.creator_id);
                    const project = projectMap.get(req.project_id);
                    const statusClass =
                      req.status === "accepted"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700";
                    return (
                      <tr key={req.id} className="border-t border-gray-100">
                        <td className="px-3 py-3 text-sm text-gray-800">{profileDisplayName(requester)}</td>
                        <td className="px-3 py-3 text-sm text-gray-800">{profileDisplayName(owner)}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">{project?.project_name?.trim() || "Untitled project"}</td>
                        <td className="px-3 py-3 text-sm">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{createdDate(req.created_at)}</td>
                        <td className="px-3 py-3 text-right">
                          <Link
                            href={`/admin/project-connections/${req.id}`}
                            className="inline-flex rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-200"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </AdminConsoleShell>
  );
}
