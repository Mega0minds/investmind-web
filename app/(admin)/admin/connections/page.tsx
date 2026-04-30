import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminShellNavKeys, redirectIfLacksNavAccess } from "@/lib/admin-access";
import { AdminConsoleShell } from "../_components/AdminConsoleShell";

type MentorshipRequestRow = {
  id: number;
  requester_id: string;
  mentor_id: string;
  message: string;
  status: "pending" | "accepted" | "declined" | string;
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

function createdDate(s: string | null): string {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

function roleLabel(role: string | null): string {
  if (!role) return "Unassigned";
  if (role === "mentor" || role === "investor") return "Mentor";
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

export default async function AdminConnectionsPage() {
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
  const connectionsGuard = redirectIfLacksNavAccess(allowedNavKeys, "connections");
  if (connectionsGuard) redirect(connectionsGuard);

  const admin = createAdminClient();
  let mentorshipRequests: MentorshipRequestRow[] = [];
  let mentorshipRequestsEnabled = true;

  const mentorshipRequestsRes = await admin
    .from("mentorship_requests")
    .select("id, requester_id, mentor_id, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (mentorshipRequestsRes.error) {
    mentorshipRequestsEnabled = !/does not exist|relation/i.test(mentorshipRequestsRes.error.message);
  } else {
    mentorshipRequests = (mentorshipRequestsRes.data ?? []) as MentorshipRequestRow[];
  }

  const profileIds = Array.from(new Set(mentorshipRequests.flatMap((req) => [req.requester_id, req.mentor_id]).filter(Boolean)));
  const requestProfiles = profileIds.length
    ? await admin.from("profiles").select("id, first_name, last_name, full_name, email, role").in("id", profileIds)
    : { data: [] as BasicProfileRow[] };
  const profileMap = new Map<string, BasicProfileRow>(((requestProfiles.data ?? []) as BasicProfileRow[]).map((p) => [p.id, p]));

  const adminName =
    me?.first_name?.trim() ||
    me?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Admin";
  const openRequests = mentorshipRequests.filter((req) => req.status !== "accepted");
  const acceptedRequests = mentorshipRequests.filter((req) => req.status === "accepted");

  return (
    <AdminConsoleShell
      activeNav="connections"
      allowedNavKeys={allowedNavKeys}
      title="Connections"
      subtitle={`People-to-people connection requests. Welcome back, ${adminName}.`}
    >
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Open connection requests</h2>
        <p className="text-sm text-gray-500">
          Requests from creatives/creators to connect with other users (not project requests).
        </p>

        {!mentorshipRequestsEnabled ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Mentorship requests table is not enabled yet. Run `supabase/migrations/008_mentorship_requests.sql`.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Requester</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Recipient</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Message</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {openRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">
                      No open connection requests.
                    </td>
                  </tr>
                ) : (
                  openRequests.map((req) => {
                    const requester = profileMap.get(req.requester_id);
                    const mentor = profileMap.get(req.mentor_id);
                    const statusClass =
                      req.status === "accepted"
                        ? "bg-emerald-100 text-emerald-700"
                        : req.status === "declined"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-700";
                    return (
                      <tr key={req.id} className="border-t border-gray-100">
                        <td className="px-3 py-3 text-sm text-gray-800">
                          <p className="font-medium text-gray-900">{profileDisplayName(requester)}</p>
                          <p className="text-xs text-gray-500">{roleLabel(requester?.role ?? null)}</p>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-800">
                          <p className="font-medium text-gray-900">{profileDisplayName(mentor)}</p>
                          <p className="text-xs text-gray-500">{roleLabel(mentor?.role ?? null)}</p>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">{req.message}</td>
                        <td className="px-3 py-3 text-sm">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{createdDate(req.created_at)}</td>
                        <td className="px-3 py-3 text-right">
                          <Link
                            href={`/admin/connections/${req.id}`}
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

      {mentorshipRequestsEnabled ? (
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Accepted requests</h2>
          <p className="text-sm text-gray-500">Approved connection requests.</p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Requester</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Recipient</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Message</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {acceptedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">
                      No accepted requests yet.
                    </td>
                  </tr>
                ) : (
                  acceptedRequests.map((req) => {
                    const requester = profileMap.get(req.requester_id);
                    const mentor = profileMap.get(req.mentor_id);
                    return (
                      <tr key={req.id} className="border-t border-gray-100">
                        <td className="px-3 py-3 text-sm text-gray-800">
                          <p className="font-medium text-gray-900">{profileDisplayName(requester)}</p>
                          <p className="text-xs text-gray-500">{roleLabel(requester?.role ?? null)}</p>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-800">
                          <p className="font-medium text-gray-900">{profileDisplayName(mentor)}</p>
                          <p className="text-xs text-gray-500">{roleLabel(mentor?.role ?? null)}</p>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700">{req.message}</td>
                        <td className="px-3 py-3 text-sm">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            accepted
                          </span>
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-600">{createdDate(req.created_at)}</td>
                        <td className="px-3 py-3 text-right">
                          <Link
                            href={`/admin/connections/${req.id}`}
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
