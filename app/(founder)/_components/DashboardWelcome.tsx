"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { THEME } from "@/lib/constants";

const STATS = [
  { label: "Ideas Submitted", value: "08", icon: "bulb", color: "blue" },
  { label: "Investor Requests", value: "24", icon: "doc", color: "purple" },
  { label: "Mentor Connections", value: "15", tag: "Active", icon: "chat", color: "purple" },
];

const PROJECTS = [
  {
    title: "SolarGrid Connect",
    status: "PUBLISHED",
    statusColor: "green",
    description: "Providing affordable decentralized solar energy solutions for rural Nigeria...",
    image: "circuit",
    href: "/listings/solargrid-connect",
  },
  {
    title: "NairaFlow AI",
    status: "DRAFT",
    statusColor: "orange",
    description: "AI-driven credit scoring system for unbanked micro-entrepreneurs acros...",
    image: "mobile",
    href: "/listings/nairaflow-ai",
  },
];

const RECENT_REQUESTS = [
  { from: "Marcus Sterling", org: "Sterling Ventures", message: "We are impressed by SolarGrid Connect's traction. Let's discuss a Seed A round.", time: "2h ago" },
];

const MENTORS = [
  { name: "Dr. Kwame Mensah", role: "Renewable Energy Expert", initials: "KM" },
  { name: "Zainab Aliyu", role: "Fintech Scaling Specialist", initials: "ZA" },
];

export function DashboardWelcome() {
  const [firstName, setFirstName] = useState<string>("there");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        supabase
          .from("profiles")
          .select("first_name")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.first_name) setFirstName(data.first_name);
          });
      }
    });
  }, []);

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
            href="/explore"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="relative rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md min-w-0"
          >
            {stat.tag && (
              <span className="absolute top-3 right-3 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                {stat.tag}
              </span>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{stat.label}</p>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
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
        {/* Left: My Projects + Recent Investor Requests */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
          <section className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">My Projects</h3>
              <Link href="/listings" className="text-xs sm:text-sm font-medium text-[#2563EB] hover:underline shrink-0">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {PROJECTS.map((proj) => (
                <div
                  key={proj.title}
                  className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm transition hover:shadow-md min-w-0"
                >
                  <div className="h-28 sm:h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
                    {proj.image === "circuit" ? (
                      <div className="w-16 h-16 rounded-lg bg-gray-300/80 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-20 h-14 rounded-lg bg-gray-300/80 border border-gray-300 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5 sm:mb-2">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{proj.title}</h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
                          proj.statusColor === "green" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3 sm:mb-4">{proj.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={proj.href}
                        className="rounded-lg bg-[#2563EB] px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white hover:bg-[#1d4ed8] transition"
                      >
                        View
                      </Link>
                      <Link
                        href={`${proj.href}/edit`}
                        className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm min-w-0">
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Recent Investor Requests</h3>
              <Link href="/messages" className="text-xs sm:text-sm font-medium text-[#2563EB] hover:underline shrink-0">
                Manage All
              </Link>
            </div>
            <ul className="space-y-3 sm:space-y-4">
              {RECENT_REQUESTS.map((req) => (
                <li key={req.from} className="flex gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-100 last:border-0 last:pb-0 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xs sm:text-sm font-semibold text-indigo-700 shrink-0">
                    {req.from.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{req.from} from {req.org}</p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5 line-clamp-2">&ldquo;{req.message}&rdquo;</p>
                    <p className="text-xs text-gray-400 mt-1">{req.time}</p>
                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                      <button
                        type="button"
                        className="rounded-lg bg-[#2563EB] px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-[#1d4ed8] transition"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-gray-200 bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right: Recommended Mentors */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          <section className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recommended Mentors</h3>
            <ul className="space-y-3 sm:space-y-4">
              {MENTORS.map((m) => (
                <li key={m.name} className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 flex items-center justify-center text-xs sm:text-sm font-semibold text-purple-700 shrink-0">
                    {m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{m.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{m.role}</p>
                  </div>
                  <Link
                    href="/mentorship"
                    className="text-xs sm:text-sm font-medium text-[#2563EB] hover:underline shrink-0"
                  >
                    Request Mentorship
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
