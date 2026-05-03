"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardShell } from "../_components/DashboardShell";
import { THEME } from "@/lib/constants";

const TABS = ["All", "Investor Requests", "Connections", "Community"] as const;
type Tab = (typeof TABS)[number];

type NotifType = "investor" | "mentorship" | "community" | "moderation" | "social";

const NOTIFICATIONS: Array<{
  id: string;
  type: NotifType;
  time: string;
}> = [
  {
    id: "1",
    type: "investor",
    time: "2h ago",
  },
  {
    id: "2",
    type: "mentorship",
    time: "5h ago",
  },
  {
    id: "3",
    type: "community",
    time: "Yesterday",
  },
  {
    id: "4",
    type: "moderation",
    time: "2 days ago",
  },
  {
    id: "5",
    type: "social",
    time: "3 days ago",
  },
];

function matchesTab(type: NotifType, tab: Tab): boolean {
  if (tab === "All") return true;
  if (tab === "Investor Requests") return type === "investor";
  if (tab === "Connections") return type === "mentorship";
  if (tab === "Community") return type === "community" || type === "social";
  return true;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const filtered = NOTIFICATIONS.filter((n) => matchesTab(n.type, activeTab));

  return (
    <DashboardShell title="Notifications">
      <div className="min-w-0 w-full max-w-3xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Notifications</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1 wrap-break-word">
            Stay updated with your investor requests, connections, and community activity.
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-2 mb-4 sm:mb-6">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 snap-x touch-pan-x">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`snap-start shrink-0 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition min-h-[40px] sm:min-h-0 touch-manipulation whitespace-nowrap ${
                  activeTab === tab
                    ? "text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                style={activeTab === tab ? { backgroundColor: THEME.primary } : undefined}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <ul className="space-y-3 sm:space-y-4">
          {filtered.length === 0 ? (
            <li className="text-center text-gray-500 py-12 bg-white rounded-2xl border border-gray-200">
              No notifications in this category yet.
            </li>
          ) : (
            filtered.map((n) => (
              <li key={n.id}>
                {n.type === "investor" && (
                  <article
                    className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex min-w-0 border-l-4"
                    style={{ borderLeftColor: THEME.primary }}
                  >
                    <div className="p-4 flex gap-3 sm:gap-4 flex-1 min-w-0">
                      <div
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-cover bg-center shrink-0"
                        style={{
                          backgroundImage:
                            "url(https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80)",
                        }}
                        aria-hidden
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 items-start">
                          <p className="text-sm sm:text-[15px] text-gray-800 wrap-break-word pr-2">
                            Investor <strong className="font-semibold text-gray-900">Sarah Chen</strong> requested
                            more details for{" "}
                            <em className="font-semibold not-italic text-gray-900">SolarGrid Connect</em>
                          </p>
                          <time className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{n.time}</time>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2 wrap-break-word">
                          Sarah is interested in your Series A deck and financial projections for the next quarter.
                        </p>
                        <div className="mt-3 flex flex-col xs:flex-row gap-2 sm:flex-row">
                          <button
                            type="button"
                            className="rounded-lg px-4 py-2.5 sm:py-2 text-sm font-semibold text-white min-h-[44px] sm:min-h-0 touch-manipulation w-full sm:w-auto opacity-90 hover:opacity-100"
                            style={{ backgroundColor: THEME.primary }}
                          >
                            View Request
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 sm:py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 min-h-[44px] sm:min-h-0 touch-manipulation w-full sm:w-auto"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )}

                {n.type === "mentorship" && (
                  <article className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-3 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2 items-start">
                        <p className="text-sm sm:text-[15px] text-gray-800 wrap-break-word">
                          Investor <strong className="font-semibold">Robert Patterson</strong> accepted your connection request
                          request
                        </p>
                        <time className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{n.time}</time>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-2 wrap-break-word">
                        You can now schedule your first 1-on-1 strategy session to discuss growth hacking.
                      </p>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white hover:bg-slate-900 min-h-[44px] sm:min-h-0 touch-manipulation w-full sm:w-auto"
                      >
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Schedule Session
                      </button>
                    </div>
                  </article>
                )}

                {n.type === "community" && (
                  <article className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-3 sm:gap-4 min-w-0">
                    <div
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-cover bg-center shrink-0"
                      style={{
                        backgroundImage:
                          "url(https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80)",
                      }}
                      aria-hidden
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2 items-start">
                        <p className="text-sm sm:text-[15px] text-gray-800 wrap-break-word">
                          New comment on your project &apos;<strong>AgroTrace</strong>&apos; from Marcus Aris
                        </p>
                        <time className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{n.time}</time>
                      </div>
                      <blockquote className="mt-3 rounded-lg bg-sky-50 border border-sky-100 px-3 py-2.5 text-sm text-gray-700 wrap-break-word">
                        Great traction on the pilot — have you considered expanding to Kenya next quarter?
                      </blockquote>
                      <Link
                        href="/community"
                        className="mt-2 inline-block text-sm font-semibold hover:underline"
                        style={{ color: THEME.primary }}
                      >
                        Reply to Marcus
                      </Link>
                    </div>
                  </article>
                )}

                {n.type === "moderation" && (
                  <article className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-3 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-sky-100 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2 items-start">
                        <p className="text-sm sm:text-[15px] text-gray-800 wrap-break-word">
                          Your project &apos;<strong>NairaFlow AI</strong>&apos; passed initial moderation
                        </p>
                        <time className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{n.time}</time>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] sm:text-xs font-bold px-2 py-0.5">
                          UNDER REVIEW
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 wrap-break-word">
                          Your project is now being reviewed by our top-tier incubator panel.
                        </span>
                      </div>
                    </div>
                  </article>
                )}

                {n.type === "social" && (
                  <article className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-3 sm:gap-4 min-w-0">
                    <div className="flex shrink-0 -space-x-2 pt-0.5">
                      <div
                        className="w-9 h-9 rounded-full border-2 border-white bg-cover bg-center z-10"
                        style={{
                          backgroundImage:
                            "url(https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80)",
                        }}
                      />
                      <div
                        className="w-9 h-9 rounded-full border-2 border-white bg-cover bg-center"
                        style={{
                          backgroundImage:
                            "url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80)",
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm sm:text-[15px] text-gray-800 wrap-break-word">
                          <strong>Elena Vance and 4 others</strong> followed your progress
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Your visibility score increased by +12% this week.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg shrink-0 touch-manipulation"
                        aria-label="More options"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                    </div>
                  </article>
                )}
              </li>
            ))
          )}
        </ul>

        <div className="mt-6 sm:mt-8 text-center pb-4">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-medium hover:underline touch-manipulation"
            style={{ color: THEME.primary }}
          >
            Load older notifications
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
