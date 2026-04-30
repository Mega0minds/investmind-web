import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminShellNavKeys, redirectIfLacksNavAccess } from "@/lib/admin-access";
import { THEME } from "@/lib/constants";
import { FOUNDER_INTEREST_SECTOR_OPTIONS } from "@/lib/mentor-matching";
import { AdminConsoleShell } from "../../../_components/AdminConsoleShell";
import { DiscoveryTagsInput } from "./DiscoveryTagsInput";
import { TeamSizeInput } from "./TeamSizeInput";
import { AdminProjectMediaFields } from "./AdminProjectMediaFields";
import { ProjectSaveButton } from "./ProjectSaveButton";

type AdminProjectEditPageProps = {
  params: Promise<{ id: string }>;
};

const STAGE_OPTIONS = ["Idea Stage", "Prototype", "Early Users", "Growing"] as const;

export default async function AdminProjectEditPage({ params }: AdminProjectEditPageProps) {
  const { id } = await params;
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

  async function saveProject(formData: FormData) {
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

    const projectName = String(formData.get("projectName") ?? "").trim();
    const tagline = String(formData.get("tagline") ?? "").trim();
    const shortDescription = String(formData.get("shortDescription") ?? "").trim();
    const sector = String(formData.get("sector") ?? "").trim();
    const stage = String(formData.get("stage") ?? "").trim();
    const coverImageFileName = String(formData.get("coverImageFileName") ?? "").trim();
    const screenshotFileNames = String(formData.get("screenshotFileNames") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const productVideoUrl = String(formData.get("productVideoUrl") ?? "").trim();
    const discoveryTags = String(formData.get("discoveryTags") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const market = String(formData.get("market") ?? "").trim();
    const pitchSummary = String(formData.get("pitchSummary") ?? "").trim();
    const teamSizeRaw = String(formData.get("teamSize") ?? "").trim();
    const teamSizeDigits = teamSizeRaw.replace(/\D+/g, "");
    const statusRaw = String(formData.get("status") ?? "").trim();
    const status = statusRaw === "published" ? "published" : "draft";

    const admin = createAdminClient();
    await admin
      .from("projects")
      .update({
        project_name: projectName || null,
        tagline: tagline || null,
        short_description: shortDescription || null,
        sector: sector || null,
        stage: stage || null,
        cover_image_file_name: coverImageFileName || null,
        screenshot_file_names: screenshotFileNames,
        product_video_url: productVideoUrl || null,
        discovery_tags: discoveryTags,
        market: market || null,
        pitch_summary: pitchSummary || null,
        team_size: teamSizeDigits || null,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    revalidatePath(`/admin/projects/${id}/edit`);
    revalidatePath("/admin");
  }

  const { data: project } = await admin
    .from("projects")
    .select(
      "id, creator_id, project_name, tagline, short_description, sector, stage, cover_image_file_name, screenshot_file_names, product_video_url, discovery_tags, market, pitch_summary, team_size, step, status"
    )
    .eq("id", id)
    .maybeSingle();

  if (!project) {
    return (
      <AdminConsoleShell
        activeNav="dashboard"
        allowedNavKeys={allowedNavKeys}
        title="Edit Project"
        subtitle="Project not found"
      >
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-gray-600">Project not found.</p>
          <Link href="/admin" className="mt-4 inline-block text-sm font-semibold text-purple-700 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </AdminConsoleShell>
    );
  }

  return (
    <AdminConsoleShell
      activeNav="dashboard"
      allowedNavKeys={allowedNavKeys}
      title="Edit Project"
      subtitle="Admin override editor for creator content."
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
          <Link href={`/admin/users/${encodeURIComponent(project.creator_id)}`} className="text-sm font-semibold text-purple-700 hover:underline">
            Back to user
          </Link>
        </div>

        <form id="admin-project-edit-form" action={saveProject} className="mt-5 space-y-4">
          <input type="hidden" name="id" value={project.id} />
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Step 1 - Basic information
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Project name</label>
            <input
              name="projectName"
              defaultValue={project.project_name ?? ""}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Tagline</label>
            <input
              name="tagline"
              defaultValue={project.tagline ?? ""}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-300"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Short description</label>
            <textarea
              name="shortDescription"
              defaultValue={project.short_description ?? ""}
              rows={5}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-300"
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Step 2 - Sector and stage
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Sector</label>
              <select
                name="sector"
                defaultValue={project.sector ?? ""}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-300"
              >
                <option value="">Select sector</option>
                {FOUNDER_INTEREST_SECTOR_OPTIONS.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Stage</label>
              <select
                name="stage"
                defaultValue={project.stage ?? ""}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-300"
              >
                <option value="">Select stage</option>
                {STAGE_OPTIONS.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Step 3 - Media
          </div>
          <AdminProjectMediaFields
            initialCoverImageFileName={project.cover_image_file_name ?? ""}
            initialScreenshotFileNames={
              Array.isArray(project.screenshot_file_names) ? project.screenshot_file_names : []
            }
          />
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Product video URL</label>
            <input
              name="productVideoUrl"
              defaultValue={project.product_video_url ?? ""}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-300"
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Step 4 - Tags and market
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Discovery tags (comma separated)</label>
            <DiscoveryTagsInput
              initialTags={Array.isArray(project.discovery_tags) ? project.discovery_tags : []}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Market</label>
            <textarea
              name="market"
              defaultValue={project.market ?? ""}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-300"
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Step 5 - Pitch and team
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Pitch summary</label>
            <textarea
              name="pitchSummary"
              defaultValue={project.pitch_summary ?? ""}
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-300"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Team size</label>
            <TeamSizeInput initialValue={project.team_size ?? ""} />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
            <select
              name="status"
              defaultValue={project.status ?? "draft"}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-300"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </div>

          <ProjectSaveButton formId="admin-project-edit-form" />
        </form>
      </div>
    </AdminConsoleShell>
  );
}

