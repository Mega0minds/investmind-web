import { DashboardShell } from "../_components/DashboardShell";
import { createClient } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/roles";
import { RecordProfileView } from "@/components/RecordProfileView";

type MentorshipPageProps = {
  searchParams?: Promise<{ mentor?: string }>;
};

export default async function MentorshipPage({ searchParams }: MentorshipPageProps) {
  const params = searchParams ? await searchParams : {};
  const mentorId = params?.mentor?.trim() || "";

  if (!mentorId) {
    return (
      <DashboardShell title="Mentorship Hub">
        <p className="text-gray-600">Pick a mentor from your dashboard to view their profile.</p>
      </DashboardShell>
    );
  }

  const supabase = await createClient();
  const { data: mentor } = await supabase
    .from("profiles")
    .select(
      "id, full_name, first_name, last_name, bio, location, role, mentor_expertise, interest_sectors, profile_visible"
    )
    .eq("id", mentorId)
    .maybeSingle();

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

  return (
    <DashboardShell title="Mentor Profile">
      {!mentor || mentor.profile_visible === false ? (
        <p className="text-gray-600">This profile is unavailable right now.</p>
      ) : (
        <div className="space-y-6">
          <RecordProfileView profileUserId={mentor.id} />
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-lg font-semibold text-purple-700">
                {name
                  .split(" ")
                  .map((part: string) => part[0] ?? "")
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
                <p className="mt-1 text-sm text-gray-500">{visibleRole}</p>
                {mentor.location ? <p className="mt-2 text-sm text-gray-600">{mentor.location}</p> : null}
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">About</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  {mentor.bio?.trim() || "This member has not added a bio yet."}
                </p>
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
      )}
    </DashboardShell>
  );
}
