"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { safeGetUser } from "@/lib/supabase/safe-auth";
import { THEME } from "@/lib/constants";
import { projectMediaPublicUrl } from "@/lib/project-media-url";
import {
  founderCategoryKeys,
  initialsFromMentorName,
  mentorDisplayName,
  mentorExpertiseLabel,
  mentorOverlapScore,
  type MentorProfileRow,
} from "@/lib/mentor-matching";
import { normalizeRole, rolesForAudienceFilter } from "@/lib/roles";

type StatCard = {
  label: string;
  value: string;
  icon: "bulb" | "doc" | "chat";
  color: "blue" | "purple" | "gray";
  tag?: string;
};

const DASHBOARD_PROJECT_LIMIT = 2;
const DASHBOARD_EXPLORE_LIMIT = 6;
const DASHBOARD_MENTOR_LIMIT = 4;
const DASHBOARD_CACHE_TTL_MS = 30_000;

type DashboardProjectRow = {
  id: string;
  status: "draft" | "published";
  project_name: string | null;
  tagline: string | null;
  short_description: string | null;
  cover_image_file_name: string | null;
};

type DashboardExploreIdeaRow = {
  id: string;
  project_name: string | null;
  tagline: string | null;
  short_description: string | null;
  sector: string | null;
  subcategory: string | null;
  cover_image_file_name: string | null;
  updated_at: string | null;
};

type RecommendedMentor = {
  id: string;
  name: string;
  role: string;
  initials: string;
};

type DashboardCachedPayload = {
  firstName: string;
  statCards: StatCard[];
  dashboardProjects: DashboardProjectRow[];
  mentors: RecommendedMentor[];
  mentorsHint: string | null;
  requestedMentorIds: string[];
  exploreIdeas: DashboardExploreIdeaRow[];
  exploreHint: string | null;
  /** Mentors (investor role) should not see founder project UI on the dashboard. */
  hideMyProjectsSection: boolean;
};

const DASHBOARD_CACHE_KEY_SUFFIX = ":v2";

const dashboardCache = new Map<string, { expiresAt: number; payload: DashboardCachedPayload }>();

export function DashboardWelcome() {
  const [firstName, setFirstName] = useState<string>("there");
  const [statCards, setStatCards] = useState<StatCard[]>([
    { label: "Ideas Submitted", value: "0", icon: "bulb", color: "blue" },
    { label: "Mentor Requests", value: "0", icon: "doc", color: "purple" },
    { label: "Mentor Connections", value: "0", icon: "chat", color: "purple" },
  ]);
  const [dashboardProjects, setDashboardProjects] = useState<DashboardProjectRow[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [mentors, setMentors] = useState<RecommendedMentor[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [mentorsHint, setMentorsHint] = useState<string | null>(null);
  const [requestedMentorIds, setRequestedMentorIds] = useState<string[]>([]);
  const [exploreIdeas, setExploreIdeas] = useState<DashboardExploreIdeaRow[]>([]);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [exploreHint, setExploreHint] = useState<string | null>(null);
  const [hideMyProjectsSection, setHideMyProjectsSection] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<RecommendedMentor | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestingMentorId, setRequestingMentorId] = useState<string | null>(null);

  const requestedMentorSet = useMemo(() => new Set(requestedMentorIds), [requestedMentorIds]);

  useEffect(() => {
    let cancelled = false;

    function applyPayload(payload: DashboardCachedPayload) {
      setFirstName(payload.firstName || "there");
      setStatCards(
        payload.statCards.map((card) => ({
          ...card,
          label: card.label.replace("Mentot", "Mentor"),
        }))
      );
      setDashboardProjects(payload.dashboardProjects);
      setMentors(payload.mentors);
      setMentorsHint(payload.mentorsHint);
      setRequestedMentorIds(payload.requestedMentorIds);
      setExploreIdeas(payload.exploreIdeas);
      setExploreHint(payload.exploreHint);
      setHideMyProjectsSection(payload.hideMyProjectsSection);
      setProjectsLoading(false);
      setMentorsLoading(false);
      setExploreLoading(false);
    }

    (async () => {
      const supabase = createClient();
      const user = await safeGetUser<{ id: string }>(supabase);
      if (!user) {
        if (!cancelled) {
          setProjectsLoading(false);
          setMentorsLoading(false);
          setExploreLoading(false);
        }
        return;
      }

      const cached = dashboardCache.get(user.id + DASHBOARD_CACHE_KEY_SUFFIX);
      const now = Date.now();
      if (cached && cached.expiresAt > now && !cancelled) {
        applyPayload(cached.payload);
      }

      const profileRes = await supabase
        .from("profiles")
        .select("first_name, role, interest_sectors, mentor_expertise")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (normalizeRole((profileRes.data as { role?: string | null } | null)?.role ?? null) === "investor") {
        setHideMyProjectsSection(true);
        setProjectsLoading(false);
      }

      const [
        ideasCountRes,
        projectCardsRes,
        projectCategoriesRes,
        mentorRowsRes,
        mentorshipRequestsRes,
        exploreProjectsRes,
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", user.id)
          .eq("status", "published"),
        supabase
          .from("projects")
          .select("id, status, project_name, tagline, short_description, cover_image_file_name")
          .eq("creator_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(DASHBOARD_PROJECT_LIMIT),
        supabase
          .from("projects")
          .select("sector, subcategory")
          .eq("creator_id", user.id),
        supabase
          .from("profiles")
          .select("id, first_name, last_name, full_name, mentor_expertise")
          .in("role", rolesForAudienceFilter("investor"))
          .eq("profile_visible", true)
          .neq("id", user.id)
          .limit(40),
        supabase
          .from("mentorship_requests")
          .select("mentor_id")
          .eq("requester_id", user.id)
          .in("status", ["pending", "accepted"]),
        supabase
          .from("projects")
          .select(
            "id, project_name, tagline, short_description, sector, subcategory, cover_image_file_name, updated_at"
          )
          .eq("status", "published")
          .neq("creator_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(60),
      ]);

      const profile = profileRes.data as
        | {
            first_name?: string | null;
            role?: string | null;
            interest_sectors?: unknown;
            mentor_expertise?: unknown;
          }
        | null;
      const first = profile?.first_name?.trim() || "there";
      const normalized = normalizeRole(profile?.role ?? null);
      const isFounderLike = normalized === "founder";
      const hideProjectsUi = normalized === "investor";

      const statsRequestsRes = isFounderLike
        ? await supabase
            .from("mentorship_requests")
            .select("mentor_id, status")
            .eq("requester_id", user.id)
            .in("status", ["pending", "accepted"])
        : await supabase
            .from("mentorship_requests")
            .select("requester_id, status")
            .eq("mentor_id", user.id)
            .in("status", ["pending", "accepted"]);

      const statsRows = Array.isArray(statsRequestsRes.data) ? statsRequestsRes.data : [];
      const requestCount = statsRows.length;
      const connectionCount = new Set(
        statsRows
          .filter((row) => (row as { status?: string | null }).status === "accepted")
          .map((row) =>
            isFounderLike
              ? (row as { mentor_id?: string | null }).mentor_id ?? null
              : (row as { requester_id?: string | null }).requester_id ?? null
          )
          .filter((id): id is string => Boolean(id))
      ).size;
      const ideasCount = ideasCountRes.count ?? 0;

      const stats: StatCard[] = isFounderLike
        ? [
            {
              label: "Ideas Submitted",
              value: String(ideasCount).padStart(2, "0"),
              icon: "bulb",
              color: "blue",
            },
            {
              label: "Mentor Requests",
              value: String(requestCount),
              icon: "doc",
              color: "purple",
            },
            {
              label: "Mentor Connections",
              value: String(connectionCount),
              icon: "chat",
              color: "purple",
            },
          ]
        : [
            {
              label: "Creative Requests",
              value: String(requestCount),
              icon: "doc",
              color: "purple",
            },
            {
              label: "Creative Connections",
              value: String(connectionCount),
              icon: "chat",
              color: "purple",
            },
          ];

      const dashboardProjects = Array.isArray(projectCardsRes.data)
        ? (projectCardsRes.data as DashboardProjectRow[])
        : [];

      const interestSectorsSource = Array.isArray(profile?.interest_sectors)
        ? (profile?.interest_sectors ?? [])
        : [];
      const interestRaw =
        profileRes.error
          ? []
          : interestSectorsSource.filter(
              (x): x is string => typeof x === "string" && x.trim().length > 0
            );
      const myProjectCategories = projectCategoriesRes.error ? [] : (projectCategoriesRes.data ?? []);
      const founderKeys = founderCategoryKeys(interestRaw, myProjectCategories);
      const mentorExpertiseRaw = Array.isArray(profile?.mentor_expertise)
        ? (profile.mentor_expertise as unknown[]).filter(
            (x): x is string => typeof x === "string" && x.trim().length > 0
          )
        : [];
      const exploreCategoryKeys = isFounderLike
        ? founderKeys
        : mentorExpertiseRaw.length
          ? mentorExpertiseRaw
          : interestRaw;
      const requestedMentorIds = mentorshipRequestsRes.error
        ? []
        : Array.isArray(mentorshipRequestsRes.data)
          ? mentorshipRequestsRes.data
              .map((row) =>
                typeof (row as { mentor_id?: unknown }).mentor_id === "string"
                  ? (row as { mentor_id: string }).mentor_id
                  : null
              )
              .filter((id): id is string => Boolean(id))
          : [];
      const requestedMentorIdSet = new Set(requestedMentorIds);

      let mentors: RecommendedMentor[] = [];
      let mentorsHint: string | null = null;
      if (mentorRowsRes.error || !mentorRowsRes.data?.length) {
        mentors = [];
        mentorsHint = mentorRowsRes.error
          ? null
          : "No mentor profiles yet. Mentors appear here when they join with matching expertise.";
      } else {
        const rows = mentorRowsRes.data as MentorProfileRow[];
        const scored = rows
          .map((m) => ({ m, score: mentorOverlapScore(m.mentor_expertise, founderKeys) }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score);
        let list = scored;
        if (!list.length && founderKeys.length && rows.length) {
          mentorsHint = "No mentors listed in your sectors yet. Try more interests in Settings.";
          list = rows.slice(0, 5).map((m) => ({ m, score: 0 }));
        } else if (!list.length && !founderKeys.length && rows.length) {
          mentorsHint =
            "Choose sectors you care about in Settings, or add a project—we’ll match mentors to those categories.";
          list = rows.slice(0, 5).map((m) => ({ m, score: 0 }));
        }
        mentors = list
          .filter(({ m }) => !requestedMentorIdSet.has(m.id))
          .slice(0, DASHBOARD_MENTOR_LIMIT)
          .map(({ m }) => {
            const name = mentorDisplayName(m);
            return {
              id: m.id,
              name,
              role: mentorExpertiseLabel(m, founderKeys),
              initials: initialsFromMentorName(name),
            };
          });
      }

      let exploreIdeas: DashboardExploreIdeaRow[] = [];
      let exploreHint: string | null = null;
      const exploreKeySet = new Set(exploreCategoryKeys.map((x) => x.toLowerCase()));
      const allExploreRows = exploreProjectsRes.error ? [] : ((exploreProjectsRes.data ?? []) as DashboardExploreIdeaRow[]);

      if (!allExploreRows.length) {
        exploreIdeas = [];
        exploreHint = "No published ideas yet.";
      } else if (!exploreKeySet.size) {
        exploreIdeas = allExploreRows.slice(0, DASHBOARD_EXPLORE_LIMIT);
        exploreHint = isFounderLike
          ? "Add sectors in Settings or create a project so we can match ideas for you."
          : "Showing recent published ideas. Add expertise in Settings to get better matches.";
      } else {
        const scored = allExploreRows
          .map((idea) => {
            const keys = [idea.sector, idea.subcategory]
              .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
              .map((v) => v.trim().toLowerCase());
            const score = keys.reduce((acc, k) => acc + (exploreKeySet.has(k) ? 1 : 0), 0);
            return { idea, score };
          })
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score);
        const top = scored.slice(0, DASHBOARD_EXPLORE_LIMIT).map((x) => x.idea);
        if (top.length) {
          exploreIdeas = top;
          exploreHint = null;
        } else {
          const fallbackIdeas = allExploreRows.slice(0, DASHBOARD_EXPLORE_LIMIT);
          exploreIdeas = fallbackIdeas;
          exploreHint = fallbackIdeas.length
            ? "No matching published ideas yet. Showing recent ideas for now."
            : "No matching published ideas yet.";
        }
      }

      const payload: DashboardCachedPayload = {
        firstName: first,
        statCards: stats,
        dashboardProjects,
        mentors,
        mentorsHint,
        requestedMentorIds,
        exploreIdeas,
        exploreHint,
        hideMyProjectsSection: hideProjectsUi,
      };
      dashboardCache.set(user.id + DASHBOARD_CACHE_KEY_SUFFIX, {
        payload,
        expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
      });

      if (!cancelled) {
        applyPayload(payload);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function submitMentorshipRequest() {
    if (!selectedMentor || requestingMentorId) return;

    const trimmed = requestMessage.trim();
    if (trimmed.length < 5 || trimmed.length > 300) {
      setRequestError("Message must be between 5 and 300 characters.");
      return;
    }

    setRequestError(null);
    setRequestingMentorId(selectedMentor.id);
    try {
      const res = await fetch("/api/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: selectedMentor.id,
          message: trimmed,
        }),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(data?.error || "Could not send mentorship request.");
      }

      setRequestedMentorIds((prev) =>
        prev.includes(selectedMentor.id) ? prev : [...prev, selectedMentor.id]
      );
      setSelectedMentor(null);
      setRequestMessage("");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Could not send mentorship request.");
    } finally {
      setRequestingMentorId(null);
    }
  }

  const mentorsSection = (
    <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm min-w-0">
      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recommended Mentors</h3>
        <Link
          href="/mentorship"
          className="text-xs sm:text-sm font-medium hover:underline shrink-0"
          style={{ color: THEME.primary }}
        >
          See all
        </Link>
      </div>
      {mentorsHint && <p className="text-xs text-gray-500 mb-3 wrap-break-word">{mentorsHint}</p>}
      {mentorsLoading ? (
        <p className="text-sm text-gray-500">Loading mentors…</p>
      ) : mentors.length === 0 ? (
        <p className="text-sm text-gray-500">
          No matches yet. Add sectors in Settings or publish a project to see mentors in your space.
        </p>
      ) : (
        <ul className="space-y-3 sm:space-y-4">
          {mentors.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <Link
                href={`/mentorship?mentor=${encodeURIComponent(m.id)}`}
                className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center text-xs sm:text-sm font-semibold text-purple-700 shrink-0">
                  {m.initials}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{m.name}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{m.role}</p>
                </div>
              </Link>
              {requestedMentorSet.has(m.id) ? (
                <span
                  className="rounded-full bg-purple-50 px-3 py-1 text-xs sm:text-sm font-medium shrink-0"
                  style={{ color: THEME.primary }}
                >
                  Requested
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMentor(m);
                    setRequestMessage(`Hi ${m.name}, I would love to learn from your experience.`);
                    setRequestError(null);
                  }}
                  className="text-xs sm:text-sm font-medium hover:underline shrink-0"
                  style={{ color: THEME.primary }}
                >
                  Request Mentorship
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-6 sm:space-y-8 w-full min-w-0 max-w-full">
      {/* Welcome + CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Welcome back, {firstName} 👋</h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Your innovative ideas are bridging gaps across the continent.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link
            href="/listings/new"
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:opacity-90 whitespace-nowrap"
            style={{ backgroundColor: THEME.primary }}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload New Idea
          </Link>
          <Link
            href="/explore-ideas"
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-gray-200 bg-white px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 whitespace-nowrap"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Explore Ideas
          </Link>
          <Link
            href="/mentorship"
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl border border-gray-200 bg-white px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 whitespace-nowrap"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Mentors
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div
        className={`grid gap-2 sm:gap-3 ${
          statCards.length >= 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
        }`}
      >
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="relative rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition hover:shadow-md min-w-0"
          >
            {stat.tag && (
              <span className="absolute top-2 right-2 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-indigo-800">
                {stat.tag}
              </span>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-4 sm:text-xs sm:leading-5 font-medium text-gray-500 wrap-break-word">
                  {stat.label}
                </p>
                <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div
                className={`shrink-0 rounded-lg sm:rounded-xl p-2 sm:p-2.5 ${
                  stat.color === "blue"
                    ? "bg-blue-100 text-blue-600"
                    : stat.color === "purple"
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {stat.icon === "bulb" && (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74C19 5.14 15.86 2 12 2z" />
                  </svg>
                )}
                {stat.icon === "doc" && (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                {stat.icon === "chat" && (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid: Projects + Requests | Mentors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
        {/* Left: My Projects + Recent Requests */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
          {!hideMyProjectsSection && (
            <section className="min-w-0">
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">My Projects</h3>
                <Link
                  href="/listings"
                  className="text-xs sm:text-sm font-medium hover:underline shrink-0"
                  style={{ color: THEME.primary }}
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {projectsLoading ? (
                  <>
                    <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm min-w-0 animate-pulse">
                      <div className="h-28 sm:h-32 bg-gray-200" />
                      <div className="p-3 sm:p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-full" />
                      </div>
                    </div>
                    <div className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm min-w-0 animate-pulse hidden sm:block">
                      <div className="h-28 sm:h-32 bg-gray-200" />
                      <div className="p-3 sm:p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-full" />
                      </div>
                    </div>
                  </>
                ) : dashboardProjects.length === 0 ? (
                  <div className="sm:col-span-2 rounded-xl sm:rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 p-6 text-center">
                    <p className="text-sm text-gray-600">No projects yet. Create your first idea to see it here.</p>
                    <Link
                      href="/listings/new"
                      className="mt-3 inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      Upload New Idea
                    </Link>
                  </div>
                ) : (
                  dashboardProjects.map((proj) => {
                    const title = proj.project_name?.trim() || "Untitled Project";
                    const desc =
                      proj.short_description?.trim() || proj.tagline?.trim() || "No description yet.";
                    const isPublished = proj.status === "published";
                    const coverUrl = projectMediaPublicUrl(proj.cover_image_file_name);
                    return (
                      <div
                        key={proj.id}
                        className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm transition hover:shadow-md min-w-0"
                      >
                        <div className="relative h-28 sm:h-32 bg-linear-to-br from-gray-100 to-gray-200 shrink-0">
                          {coverUrl ? (
                            <Image
                              src={coverUrl}
                              alt={title}
                              fill
                              unoptimized
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 50vw"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <div className="w-16 h-16 rounded-lg bg-gray-300/80 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-3 sm:p-4 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5 sm:mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{title}</h4>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
                                isPublished ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isPublished ? "PUBLISHED" : "DRAFT"}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3 sm:mb-4">{desc}</p>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/listings/manage/${proj.id}`}
                              className="rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white transition hover:opacity-90"
                              style={{ backgroundColor: THEME.primary }}
                            >
                              View
                            </Link>
                            <Link
                              href={`/listings/new?listingId=${proj.id}&step=1`}
                              className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          <div className="lg:hidden">{mentorsSection}</div>

          <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm min-w-0">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Explore Ideas</h3>
              <Link
                href="/explore-ideas"
                className="text-xs sm:text-sm font-medium hover:underline shrink-0"
                style={{ color: THEME.primary }}
              >
                See more
              </Link>
            </div>

            {exploreLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm animate-pulse">
                    <div className="h-24 bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : exploreIdeas.length === 0 ? (
              <p className="text-sm text-gray-500">{exploreHint ?? "No matching ideas right now."}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {exploreIdeas.map((idea) => {
                  const title = idea.project_name?.trim() || "Untitled project";
                  const desc = idea.short_description?.trim() || idea.tagline?.trim() || "No description yet.";
                  const coverUrl = projectMediaPublicUrl(idea.cover_image_file_name);
                  return (
                    <div
                      key={idea.id}
                      className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm transition hover:shadow-md min-w-0"
                    >
                      <div className="relative h-24 bg-linear-to-br from-gray-100 to-gray-200">
                        {coverUrl ? (
                          <Image
                            src={coverUrl}
                            alt={title}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : null}
                      </div>
                      <div className="p-3 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1 mb-2">{desc}</p>
                        <Link
                          href={`/listings/${idea.id}`}
                          className="text-xs font-medium hover:underline"
                          style={{ color: THEME.primary }}
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>

        {/* Right: Recommended Mentors */}
        <div className="hidden lg:block space-y-4 sm:space-y-6 min-w-0">{mentorsSection}</div>
      </div>
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Mentorship</h3>
                <p className="mt-1 text-sm text-gray-500">Send a short note to {selectedMentor.name}.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!requestingMentorId) {
                    setSelectedMentor(null);
                    setRequestError(null);
                  }
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="mentorship-message">
              Message
            </label>
            <textarea
              id="mentorship-message"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value.slice(0, 300))}
              rows={5}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              placeholder="Write a short message..."
            />
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>{requestError ? <span className="text-red-600">{requestError}</span> : "Keep it short and clear."}</span>
              <span>{requestMessage.trim().length}/300</span>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!requestingMentorId) {
                    setSelectedMentor(null);
                    setRequestError(null);
                  }
                }}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitMentorshipRequest()}
                disabled={requestingMentorId === selectedMentor.id}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: THEME.primary }}
              >
                {requestingMentorId === selectedMentor.id ? "Sending..." : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
