"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { THEME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import {
  exploreProjectMatchesViewerCategories,
  type ExplorePublishedProject,
  type TrendingProject,
} from "@/lib/explore-projects";
import { projectMediaPublicUrl } from "@/lib/project-media-url";

const CATEGORY_CHIPS = [
  { key: "all", label: "All Ideas" },
  { key: "fintech", label: "Fintech" },
  { key: "agritech", label: "Agrotech" },
  { key: "healthtech", label: "Healthtech" },
  { key: "edtech", label: "Edutech" },
  { key: "renewable energy", label: "Renewable Energy" },
] as const;

const BADGE_ROTATION = ["High Interest", "Trending"] as const;

function formatDiscoveryTag(raw: string): string {
  const t = raw.trim().replace(/^#/, "");
  if (!t) return "";
  return `#${t.replace(/\s+/g, "_").toUpperCase()}`;
}

function IconBox({ children }: { children: ReactNode }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-white/80 border border-gray-200 flex items-center justify-center shadow-sm">
      {children}
    </div>
  );
}

function byRecentUpdated(a: ExplorePublishedProject, b: ExplorePublishedProject): number {
  return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
}

function ExploreProjectCard({
  item,
  badgeIndex,
  canConnect,
  hasRequested,
  connecting,
  onConnect,
}: {
  item: ExplorePublishedProject;
  badgeIndex: number;
  canConnect: boolean;
  hasRequested: boolean;
  connecting: boolean;
  onConnect: (project: ExplorePublishedProject) => void;
}) {
  const title = item.project_name?.trim() || "Untitled project";
  const desc =
    item.short_description?.trim() || item.tagline?.trim() || "No description yet.";
  const coverUrl = projectMediaPublicUrl(item.cover_image_file_name);
  const tags = (item.discovery_tags ?? [])
    .map(formatDiscoveryTag)
    .filter(Boolean)
    .slice(0, 4);
  const sectorTags = [item.sector, item.subcategory]
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => formatDiscoveryTag(s));
  const displayTags = tags.length ? tags : sectorTags.slice(0, 4);
  const badge = BADGE_ROTATION[badgeIndex % BADGE_ROTATION.length];
  const updated =
    item.updated_at &&
    !Number.isNaN(Date.parse(item.updated_at)) &&
    new Date(item.updated_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-0 flex flex-col">
      <div className="relative h-24 sm:h-28 md:h-32 shrink-0 bg-linear-to-br from-teal-500/15 to-emerald-600/15">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
          />
        ) : null}
        <div className="absolute inset-0 flex items-start justify-end p-3 sm:p-4 pointer-events-none">
          <div className="rounded-full bg-white/90 border border-white/40 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-gray-700 shadow-sm flex items-center gap-1.5 sm:gap-2 max-w-[85%]">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{badge}</span>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base wrap-break-word">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 wrap-break-word">{desc}</p>

        {displayTags.length > 0 && (
          <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
            {displayTags.map((t) => (
              <span
                key={t}
                className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 sm:mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-1 min-w-0">
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 shrink-0">
            <span className="inline-flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {updated || "Recently"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:shrink-0">
            <Link
              href={`/listings/${item.id}`}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 sm:py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition text-center min-h-[44px] sm:min-h-0 inline-flex items-center justify-center touch-manipulation w-full sm:w-auto"
            >
              Details
            </Link>
            {canConnect ? (
              <button
                type="button"
                onClick={() => onConnect(item)}
                disabled={hasRequested || connecting}
                className="rounded-lg px-3 py-2.5 sm:py-2 text-xs font-semibold text-white transition text-center min-h-[44px] sm:min-h-0 inline-flex items-center justify-center touch-manipulation w-full sm:w-auto hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: hasRequested ? "#64748B" : THEME.primary }}
              >
                {hasRequested ? "Requested" : connecting ? "Sending..." : "Connect"}
              </button>
            ) : (
              <Link
                href="/signup"
                className="rounded-lg px-3 py-2.5 sm:py-2 text-xs font-semibold text-white transition text-center min-h-[44px] sm:min-h-0 inline-flex items-center justify-center touch-manipulation w-full sm:w-auto hover:opacity-90"
                style={{ backgroundColor: THEME.primary }}
              >
                Connect
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ExploreIdeasContent({
  projects,
  trending,
  viewerCategoryKeys = [],
}: {
  projects: ExplorePublishedProject[];
  trending: TrendingProject[];
  /** Logged-in viewer: interests + sectors from their own projects; used to rank “For you” first. */
  viewerCategoryKeys?: string[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [activeChip, setActiveChip] = useState<(typeof CATEGORY_CHIPS)[number]["key"]>("all");
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [requestedProjectIds, setRequestedProjectIds] = useState<Set<string>>(new Set());
  const [selectedProject, setSelectedProject] = useState<ExplorePublishedProject | null>(null);
  const [connectMessage, setConnectMessage] = useState("");
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectingProjectId, setConnectingProjectId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;
      const uid = user?.id ?? null;
      setViewerId(uid);
      if (!uid) return;
      const { data } = await supabase
        .from("project_connection_requests")
        .select("project_id")
        .eq("requester_id", uid)
        .in("status", ["connecting", "accepted"]);
      if (!active) return;
      setRequestedProjectIds(
        new Set(
          ((data ?? []) as Array<{ project_id?: string | null }>)
            .map((r) => r.project_id ?? null)
            .filter((id): id is string => Boolean(id))
        )
      );
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const chipFiltered = useMemo(() => {
    if (activeChip === "all") return projects;
    return projects.filter((p) => {
      const s = p.sector?.toLowerCase().trim() ?? "";
      const sub = p.subcategory?.toLowerCase().trim() ?? "";
      const key = activeChip.toLowerCase();
      return s.includes(key) || sub.includes(key);
    });
  }, [projects, activeChip]);

  const {
    relatedProjects,
    otherProjects,
    showForYouHeading,
    showOutsideHeading,
    showNoOutsideMatches,
  } = useMemo(() => {
    if (!viewerCategoryKeys.length) {
      return {
        relatedProjects: [] as ExplorePublishedProject[],
        otherProjects: chipFiltered,
        showForYouHeading: false,
        showOutsideHeading: false,
        showNoOutsideMatches: false,
      };
    }
    const related = chipFiltered.filter((p) =>
      exploreProjectMatchesViewerCategories(p, viewerCategoryKeys)
    );
    const relatedIds = new Set(related.map((p) => p.id));
    const other = chipFiltered.filter((p) => !relatedIds.has(p.id));
    related.sort(byRecentUpdated);
    other.sort(byRecentUpdated);
    return {
      relatedProjects: related,
      otherProjects: other,
      showForYouHeading: related.length > 0,
      showOutsideHeading: related.length > 0 && other.length > 0,
      showNoOutsideMatches: related.length > 0 && other.length === 0,
    };
  }, [chipFiltered, viewerCategoryKeys]);

  async function submitConnectRequest() {
    if (!selectedProject || !viewerId || connectingProjectId) return;
    const message = connectMessage.trim();
    if (message.length < 5 || message.length > 300) {
      setConnectError("Message must be between 5 and 300 characters.");
      return;
    }
    setConnectError(null);
    setConnectingProjectId(selectedProject.id);
    const { error } = await supabase.from("project_connection_requests").insert({
      requester_id: viewerId,
      project_id: selectedProject.id,
      creator_id: selectedProject.creator_id,
      message,
      status: "connecting",
    });
    if (error) {
      setConnectError(error.message || "Could not send connection request.");
      setConnectingProjectId(null);
      return;
    }
    setRequestedProjectIds((prev) => new Set([...prev, selectedProject.id]));
    setConnectingProjectId(null);
    setSelectedProject(null);
    setConnectMessage("");
  }

  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden">
      <div
        className="flex items-stretch gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 snap-x snap-mandatory touch-pan-x"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {CATEGORY_CHIPS.map((c) => {
          const isActive = activeChip === c.key;
          return (
          <button
            key={c.key}
            type="button"
            onClick={() => setActiveChip(c.key)}
            className={
              isActive
                ? "snap-start shrink-0 rounded-full text-white px-3 py-2.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm min-h-[44px] inline-flex items-center justify-center touch-manipulation"
                : "snap-start shrink-0 rounded-full border border-gray-200 bg-white text-gray-700 px-3 py-2.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap hover:bg-gray-50 transition shadow-sm min-h-[44px] inline-flex items-center justify-center touch-manipulation"
            }
            style={isActive ? { backgroundColor: THEME.primary } : undefined}
          >
            {c.label}
          </button>
        )})}
      </div>

      <div className="mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
        <div className="lg:col-span-8 min-w-0 order-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 wrap-break-word">
              Featured Innovations
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 shrink-0">
              Sort by: <span className="font-medium text-gray-700">Most Recent</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {chipFiltered.length === 0 ? (
              <div className="sm:col-span-2 rounded-xl sm:rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
                {activeChip === "all"
                  ? "No published projects from other founders yet. When founders publish their ideas, they will appear here for you to explore."
                  : "No ideas found in this category yet. Try another filter."}
              </div>
            ) : (
              <>
                {showForYouHeading && (
                  <div className="sm:col-span-2 pt-1">
                    <h3 className="text-sm font-bold text-gray-900">For you</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ideas aligned with your interests and project sectors.
                    </p>
                  </div>
                )}
                {relatedProjects.map((item, i) => (
                  <ExploreProjectCard
                    key={item.id}
                    item={item}
                    badgeIndex={i}
                    canConnect={Boolean(viewerId)}
                    hasRequested={requestedProjectIds.has(item.id)}
                    connecting={connectingProjectId === item.id}
                    onConnect={(project) => {
                      setSelectedProject(project);
                      setConnectMessage(
                        `Hi, I’m interested in your project "${project.project_name?.trim() || "this project"}". I would love to connect.`
                      );
                      setConnectError(null);
                    }}
                  />
                ))}
                {showOutsideHeading && (
                  <div className="sm:col-span-2 mt-6 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-bold text-gray-900">Outside your interests</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ideas that don&apos;t match your saved sectors or portfolio—still worth exploring,
                      newest first.
                    </p>
                  </div>
                )}
                {showNoOutsideMatches && (
                  <div className="sm:col-span-2 mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3 text-xs text-gray-600">
                    Everything in this view fits your profile. Switch to{" "}
                    <span className="font-semibold text-gray-800">All Ideas</span> or another category
                    to see projects outside your usual sectors.
                  </div>
                )}
                {otherProjects.map((item, i) => (
                  <ExploreProjectCard
                    key={item.id}
                    item={item}
                    badgeIndex={relatedProjects.length + i}
                    canConnect={Boolean(viewerId)}
                    hasRequested={requestedProjectIds.has(item.id)}
                    connecting={connectingProjectId === item.id}
                    onConnect={(project) => {
                      setSelectedProject(project);
                      setConnectMessage(
                        `Hi, I’m interested in your project "${project.project_name?.trim() || "this project"}". I would love to connect.`
                      );
                      setConnectError(null);
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 min-w-0 order-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-4 content-start">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 min-w-0 h-fit self-start">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Trending Now</h3>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {trending.length === 0 ? (
                <p className="text-xs sm:text-sm text-gray-500">No views tracked yet.</p>
              ) : (
                trending.map((t) => (
                  <div key={t.sub} className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <IconBox>
                      <div
                        className="w-6 h-6 rounded flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: THEME.primary }}
                      >
                        {t.name[0]}
                      </div>
                    </IconBox>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-semibold text-gray-900 wrap-break-word">
                        {t.sub}
                      </div>
                      <div className="text-[11px] sm:text-xs text-gray-500 mt-0.5 wrap-break-word leading-snug">
                        {t.followers}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Connect on Project</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Send a message about {selectedProject.project_name?.trim() || "this project"}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!connectingProjectId) {
                    setSelectedProject(null);
                    setConnectError(null);
                  }
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="project-connect-message">
              Message
            </label>
            <textarea
              id="project-connect-message"
              value={connectMessage}
              onChange={(e) => setConnectMessage(e.target.value.slice(0, 300))}
              rows={5}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder="Write a short message..."
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>
                {connectError ? <span className="text-red-600">{connectError}</span> : "Keep it short and clear."}
              </span>
              <span>{connectMessage.trim().length}/300</span>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!connectingProjectId) {
                    setSelectedProject(null);
                    setConnectError(null);
                  }
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitConnectRequest()}
                disabled={connectingProjectId === selectedProject.id}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: THEME.primary }}
              >
                {connectingProjectId === selectedProject.id ? "Sending..." : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
