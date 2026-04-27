import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../_components/DashboardShell";
import { THEME } from "@/lib/constants";
import { DeleteProjectButton } from "./_components/DeleteProjectButton";
import { redirectInvestorFromListingsArea } from "./_lib/redirectInvestorFromListings";

const FILTERS = ["All Projects", "Published", "Drafts", "Under Review"] as const;
type FilterValue = "all" | "published" | "drafts" | "under-review";

type ProjectRow = {
  id: string;
  status: "draft" | "published";
  step: number;
  project_name: string | null;
  tagline: string | null;
  cover_image_file_name: string | null;
  updated_at: string | null;
};

function completionPct(step: number): number {
  const s = Math.max(1, Math.min(5, step || 1));
  return Math.round((s / 5) * 100);
}

function toPublicMediaUrl(path: string | null): string | null {
  if (!path) return null;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) return null;
  const encodedPath = path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${baseUrl}/storage/v1/object/public/project-media/${encodedPath}`;
}

export default async function FounderListings({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawFilter = resolvedSearchParams?.filter;
  const activeFilter: FilterValue =
    rawFilter === "published" || rawFilter === "drafts" || rawFilter === "under-review"
      ? rawFilter
      : "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await redirectInvestorFromListingsArea(supabase, user.id);

  let projects: ProjectRow[] = [];
  const { data, error } = await supabase
    .from("projects")
    .select("id, status, step, project_name, tagline, cover_image_file_name, updated_at")
    .eq("creator_id", user.id)
    .order("updated_at", { ascending: false });
  if (!error && Array.isArray(data)) {
    projects = data as ProjectRow[];
  }

  const filteredProjects =
    activeFilter === "all"
      ? projects
      : activeFilter === "published"
      ? projects.filter((p) => p.status === "published")
      : activeFilter === "drafts"
      ? projects.filter((p) => p.status === "draft")
      : [];

  return (
    <DashboardShell title="My Projects">
      <div className="min-w-0 w-full max-w-full overflow-x-hidden">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4 sm:mb-6">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Projects</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Manage and scale your innovation portfolio
            </p>
          </div>
          <Link
            href="/listings/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 sm:py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 shrink-0 min-h-[48px] sm:min-h-0 touch-manipulation w-full sm:w-auto"
            style={{ backgroundColor: THEME.primary }}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload New Idea
          </Link>
        </div>

        {/* Filter chips */}
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 snap-x snap-mandatory touch-pan-x mb-4 sm:mb-6">
          {FILTERS.map((label) => {
            const value: FilterValue =
              label === "Published"
                ? "published"
                : label === "Drafts"
                ? "drafts"
                : label === "Under Review"
                ? "under-review"
                : "all";
            const isActive = activeFilter === value;
            const href = value === "all" ? "/listings" : `/listings?filter=${value}`;
            return (
            <Link
              key={label}
              href={href}
              className={
                isActive
                  ? "snap-start shrink-0 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold text-white min-h-[44px] inline-flex items-center shadow-sm"
                  : "snap-start shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-700 min-h-[44px] inline-flex items-center hover:bg-gray-50 transition shadow-sm"
              }
              style={isActive ? { backgroundColor: THEME.primary } : undefined}
            >
              {label}
            </Link>
          )})}
        </div>

        <div className="min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredProjects.map((project) => {
                const pct = completionPct(project.step);
                const isDraft = project.status === "draft";
                const title = project.project_name?.trim() || "Untitled Project";
                const coverUrl = toPublicMediaUrl(project.cover_image_file_name);
                return (
                  <article
                    key={project.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-w-0"
                  >
                    <div className="relative h-36 sm:h-40 bg-linear-to-br from-indigo-100 to-violet-200 shrink-0">
                      {coverUrl && (
                        <Image
                          src={coverUrl}
                          alt={`${title} cover`}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      )}
                      <span
                        className={`absolute top-3 right-3 rounded-full text-[10px] sm:text-xs font-bold px-2.5 py-1 shadow ${
                          isDraft
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isDraft ? "DRAFT" : "PUBLISHED"}
                      </span>
                      {isDraft && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/45 px-3 py-2">
                          <div className="flex justify-between text-[10px] sm:text-xs text-white font-medium mb-1">
                            <span>COMPLETION</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/30 overflow-hidden">
                            <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{title}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 min-h-10">
                        {project.tagline?.trim() || "No tagline yet."}
                      </p>
                      <div className="mt-3 sm:mt-4 flex items-center gap-2">
                        <Link
                          href={`/listings/manage/${project.id}`}
                          className="flex-1 rounded-xl py-2.5 sm:py-2 text-center text-sm font-semibold text-[#5A2D8F] bg-[#EDE9F5] hover:bg-[#E5DEF0] transition min-h-[44px] inline-flex items-center justify-center"
                        >
                          View
                        </Link>
                        <Link
                          href={`/listings/new?listingId=${project.id}&step=${Math.max(1, Math.min(5, project.step || 1))}`}
                          className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                          aria-label="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Link>
                        <DeleteProjectButton projectId={project.id} />
                      </div>
                    </div>
                  </article>
                );
              })}

              {!filteredProjects.length && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 text-center text-gray-500 sm:col-span-2 lg:col-span-3">
                  {activeFilter === "all"
                    ? "No projects yet. Create your first one to see it here."
                    : "No projects found for this filter."}
                </div>
              )}

              {/* Start new innovation */}
              <Link
                href="/listings/new"
                className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/80 hover:bg-gray-100 hover:border-[#5A2D8F]/40 transition flex flex-col items-center justify-center min-h-[280px] sm:min-h-[320px] p-6 text-center group touch-manipulation"
              >
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white mb-4 group-hover:scale-105 transition"
                  style={{ backgroundColor: THEME.primary }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Start a New Innovation</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-2 max-w-[220px]">
                  Share your next big idea with mentors and creatives across Africa.
                </p>
              </Link>
            </div>
        </div>
      </div>
    </DashboardShell>
  );
}
