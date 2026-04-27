import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "../../../_components/DashboardShell";
import { createClient } from "@/lib/supabase/server";
import { redirectInvestorFromListingsArea } from "../../_lib/redirectInvestorFromListings";

type ListingPageProps = {
  params: Promise<{ slug: string }>;
};

function formatTeamSize(value: string | null): string {
  const trimmed = value?.trim();
  if (!trimmed) return "N/A";
  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) {
    return `${asNumber} member${asNumber === 1 ? "" : "s"}`;
  }
  return trimmed;
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

export default async function ListingDetailsPage({ params }: ListingPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await redirectInvestorFromListingsArea(supabase, user.id);

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      "id, status, project_name, tagline, short_description, sector, subcategory, stage, team_size, cover_image_file_name, screenshot_file_names, discovery_tags, market, pitch_summary, updated_at"
    )
    .eq("id", slug)
    .eq("creator_id", user.id)
    .maybeSingle();

  if (error || !project) notFound();

  const coverUrl = toPublicMediaUrl(project.cover_image_file_name);
  const previewImages = Array.isArray(project.screenshot_file_names)
    ? project.screenshot_file_names.map((path) => toPublicMediaUrl(path)).filter((v): v is string => Boolean(v))
    : [];
  const chips = [project.sector, project.subcategory, project.stage].filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0
  );

  return (
    <DashboardShell title={project.project_name?.trim() || "Project details"}>
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <section className="xl:col-span-8 min-w-0 space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center rounded-full bg-[#EFE7FC] px-2.5 py-1 text-[11px] font-semibold text-[#5A2D8F]"
                  >
                    {chip}
                  </span>
                ))}
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    project.status === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {project.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {project.project_name?.trim() || "Untitled Project"}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {project.tagline?.trim() || "Connecting ideas directly to investors."}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="relative aspect-16/8 bg-gray-100">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt="Project cover"
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 800px"
                  />
                ) : (
                  <div className="h-full w-full bg-linear-to-br from-indigo-100 to-violet-200" />
                )}
              </div>
            </div>

            <article className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <h2 className="text-lg font-bold text-gray-900">About this Project</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {project.short_description?.trim() ||
                  "No project description yet. Add a short description from the upload wizard."}
              </p>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <h2 className="text-lg font-bold text-gray-900">Platform Preview</h2>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {previewImages.length ? (
                  previewImages.slice(0, 3).map((src, i) => (
                    <div key={src} className="relative aspect-4/3 overflow-hidden rounded-xl border border-gray-200">
                      <Image
                        src={src}
                        alt={`Preview ${i + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 220px"
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 sm:col-span-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                    No screenshots uploaded yet.
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <h2 className="text-lg font-bold text-gray-900">Target Market</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {project.market?.trim() || "Target market analysis has not been added yet."}
              </p>
              {Array.isArray(project.discovery_tags) && project.discovery_tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.discovery_tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-1 text-xs font-medium text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <h2 className="text-lg font-bold text-gray-900">The Pitch</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {project.pitch_summary?.trim() || "Pitch summary has not been added yet."}
              </p>
            </article>
          </section>

          <aside className="xl:col-span-4 min-w-0 space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Sector</p>
                  <p className="font-semibold text-gray-900 mt-1">{project.sector?.trim() || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stage</p>
                  <p className="font-semibold text-gray-900 mt-1">{project.stage?.trim() || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Team</p>
                  <p className="font-semibold text-gray-900 mt-1">{formatTeamSize(project.team_size)}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
                  style={{ backgroundColor: "#6D28D9" }}
                >
                  Request More Details
                </button>
                <Link
                  href={`/listings/new?listingId=${project.id}&step=1`}
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Edit Project
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
              <h3 className="text-xs font-bold tracking-wide text-gray-400 uppercase">The Team</h3>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-100 text-[11px] font-bold text-indigo-700">
                    IM
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-violet-100 text-[11px] font-bold text-violet-700">
                    VC
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sky-100 text-[11px] font-bold text-sky-700">
                    AI
                  </span>
                </div>
                <p className="text-sm text-gray-700">{formatTeamSize(project.team_size)}</p>
              </div>
            </div>

          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
