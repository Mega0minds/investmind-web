import Link from "next/link";
import { DashboardShell } from "../_components/DashboardShell";
import { THEME } from "@/lib/constants";

const FILTERS = ["All Projects", "Published", "Drafts", "Under Review"] as const;

export default function FounderListings() {
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
          {FILTERS.map((label, i) => (
            <button
              key={label}
              type="button"
              className={
                i === 0
                  ? "snap-start shrink-0 rounded-full px-4 py-2.5 text-xs sm:text-sm font-semibold text-white min-h-[44px] inline-flex items-center shadow-sm"
                  : "snap-start shrink-0 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-700 min-h-[44px] inline-flex items-center hover:bg-gray-50 transition shadow-sm"
              }
              style={i === 0 ? { backgroundColor: THEME.primary } : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
          {/* Main project grid */}
          <div className="lg:col-span-8 min-w-0 order-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* SolarGrid Connect — Published */}
              <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-w-0">
                <div className="relative h-36 sm:h-40 bg-linear-to-br from-amber-100 to-orange-200 shrink-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-90"
                    style={{
                      backgroundImage:
                        "url(https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&q=80)",
                    }}
                  />
                  <span className="absolute top-3 right-3 rounded-full bg-teal-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 shadow">
                    PUBLISHED
                  </span>
                </div>
                <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">SolarGrid Connect</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    <span>1,402 Views</span>
                    <span>24 Investor Requests</span>
                  </p>
                  <div className="mt-3 sm:mt-4 flex items-center gap-2 flex-wrap">
                    <Link
                      href="/listings/solargrid-connect"
                      className="flex-1 min-w-[120px] rounded-xl py-2.5 sm:py-2 text-center text-sm font-semibold text-[#5A2D8F] bg-[#EDE9F5] hover:bg-[#E5DEF0] transition"
                    >
                      View
                    </Link>
                    <Link
                      href="/listings/solargrid-connect/edit"
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                      aria-label="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                    <Link
                      href="/listings/solargrid-connect/analytics"
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                      aria-label="Analytics"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>

              {/* NairaFlow AI — Draft + completion */}
              <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-w-0">
                <div className="relative h-36 sm:h-40 shrink-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage:
                        "url(https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&q=80)",
                    }}
                  />
                  <span className="absolute top-3 right-3 rounded-full bg-amber-400 text-amber-950 text-[10px] sm:text-xs font-bold px-2.5 py-1 shadow">
                    DRAFT
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-2">
                    <div className="flex justify-between text-[10px] sm:text-xs text-white font-medium mb-1">
                      <span>COMPLETION</span>
                      <span>65%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/30 overflow-hidden">
                      <div className="h-full w-[65%] rounded-full bg-white" />
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">NairaFlow AI</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                    AI-driven credit scoring for unbanked micro-entrepreneurs.
                  </p>
                  <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2">
                    <Link
                      href="/listings/nairaflow-ai/edit"
                      className="flex-1 rounded-xl py-2.5 text-center text-xs sm:text-sm font-semibold text-white min-h-[44px] inline-flex items-center justify-center"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      Continue Editing
                    </Link>
                    <Link
                      href="#"
                      className="flex-1 rounded-xl border border-gray-200 py-2.5 text-center text-xs sm:text-sm font-semibold text-gray-800 bg-white hover:bg-gray-50 min-h-[44px] inline-flex items-center justify-center"
                    >
                      Preview
                    </Link>
                  </div>
                </div>
              </article>

              {/* AgroTrace — Under Review */}
              <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-w-0">
                <div className="relative h-36 sm:h-40 bg-linear-to-br from-emerald-600 to-green-800 flex items-center justify-center shrink-0">
                  <span className="text-white text-lg sm:text-xl font-bold tracking-tight">AgroTrace</span>
                  <span className="absolute top-3 right-3 rounded-full bg-sky-100 text-sky-800 text-[10px] sm:text-xs font-bold px-2.5 py-1 shadow">
                    UNDER REVIEW
                  </span>
                </div>
                <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">AgroTrace</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    560 Views · 8 Investor Requests
                  </p>
                  <div className="mt-3 sm:mt-4 flex items-center gap-2">
                    <Link
                      href="/listings/agrotrace"
                      className="flex-1 rounded-xl py-2.5 sm:py-2 text-center text-sm font-semibold text-[#5A2D8F] bg-[#EDE9F5] hover:bg-[#E5DEF0] transition min-h-[44px] sm:min-h-0 inline-flex items-center justify-center"
                    >
                      View
                    </Link>
                    <Link
                      href="/listings/agrotrace/edit"
                      className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                      aria-label="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>

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
                  Share your next big idea with investors and mentors across Africa.
                </p>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 min-w-0 order-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-4">
            {/* Platform Impact */}
            <div className="rounded-2xl bg-[#2563EB] text-white p-4 sm:p-5 shadow-lg min-w-0">
              <h3 className="font-bold text-sm sm:text-base mb-4">Platform Impact</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-white/80">Total Pitch Value</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5">$125.4k</p>
                </div>
                <div>
                  <p className="text-xs text-white/80">Investor Matches</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-0.5">12</p>
                </div>
              </div>
              <button
                type="button"
                className="mt-5 w-full rounded-xl bg-white/15 hover:bg-white/25 py-3 text-sm font-semibold border border-white/30 transition min-h-[48px] touch-manipulation"
              >
                Download Report
              </button>
            </div>

            {/* Next Steps */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3">Next Steps</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/mentorship" className="flex gap-3 p-2 -m-2 rounded-xl hover:bg-gray-50 transition min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Request Mentorship</p>
                      <p className="text-xs text-gray-500 mt-0.5 wrap-break-word">
                        Connect with experts in your field.
                      </p>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/signup/complete" className="flex gap-3 p-2 -m-2 rounded-xl hover:bg-gray-50 transition min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">Complete Profile</p>
                      <p className="text-xs text-gray-500 mt-0.5 wrap-break-word">
                        Boost visibility to top-tier VCs.
                      </p>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Latest Activity */}
            <div className="md:col-span-2 lg:col-span-1 rounded-2xl bg-sky-50 border border-sky-100 p-4 sm:p-5 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3">Latest Activity</h3>
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed wrap-break-word">
                Venture Capital <span className="font-semibold">&quot;Atlas&quot;</span> viewed your{" "}
                <span className="font-semibold">SolarGrid</span> pitch{" "}
                <span className="text-gray-500">2 hours ago from London, UK.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
