import Link from "next/link";
import type { ReactNode } from "react";
import { THEME } from "@/lib/constants";

const CATEGORY_CHIPS = [
  { label: "All Ideas", href: "#" },
  { label: "Fintech", href: "#" },
  { label: "Agrotech", href: "#" },
  { label: "Healthtech", href: "#" },
  { label: "Edutech", href: "#" },
  { label: "Renewable Energy", href: "#" },
] as const;

const FEATURED = [
  {
    title: "EcoFuel Africa",
    desc: "Providing clean energy solutions powered by sustainable fuel systems.",
    tags: ["#SUSTAINABILITY", "#GREENTECH"],
    imageStyle: "from-teal-500/20 to-emerald-600/20",
    badge: "High Interest",
    views: "12.3k",
    likes: "342",
  },
  {
    title: "HealthConnect",
    desc: "AI-driven healthcare access for remote communities across Africa.",
    tags: ["#HEALTHTECH", "#AI"],
    imageStyle: "from-purple-500/20 to-indigo-600/20",
    badge: "Trending",
    views: "2.8k",
    likes: "890",
  },
  {
    title: "NairaPay",
    desc: "Trusted digital payments for SMEs with zero-fee transactions for starters.",
    tags: ["#FINTECH", "#SME"],
    imageStyle: "from-emerald-500/15 to-emerald-600/20",
    badge: "High Interest",
    views: "950",
    likes: "120",
  },
  {
    title: "EduBridge",
    desc: "Learning platforms that connect tutors to learners with adaptive content.",
    tags: ["#EDUTECH", "#EDUCATION"],
    imageStyle: "from-amber-500/15 to-orange-600/20",
    badge: "Trending",
    views: "1.5k",
    likes: "410",
  },
] as const;

const TRENDING = [
  { name: "FYNTECH", sub: "CryptoRemit Africa", followers: "20 new investors this week" },
  { name: "AGROTECH", sub: "SoilSense IoT", followers: "Featured by UN Innovation" },
  { name: "FINTECH", sub: "PayMint", followers: "Rising fast this month" },
] as const;

const NEW_ON_INVESTMIND = [
  {
    name: "Aseya Oje",
    title: "AquaClean Ghana",
    desc: "Decentralized water filtration units designed for rural communities.",
  },
  {
    name: "Sara Ali",
    title: "SafeRoute Logistics",
    desc: "Last-mile delivery for pharma and healthcare providers.",
  },
] as const;

function IconBox({ children }: { children: ReactNode }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-white/80 border border-gray-200 flex items-center justify-center shadow-sm">
      {children}
    </div>
  );
}

export function ExploreIdeasContent() {
  return (
    <div className="min-w-0 w-full max-w-full overflow-x-hidden">
      <div
        className="flex items-stretch gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 snap-x snap-mandatory touch-pan-x"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {CATEGORY_CHIPS.map((c, idx) => (
          <Link
            key={c.label}
            href={c.href}
            className={
              idx === 0
                ? "snap-start shrink-0 rounded-full text-white px-3 py-2.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold whitespace-nowrap shadow-sm min-h-[44px] inline-flex items-center justify-center touch-manipulation"
                : "snap-start shrink-0 rounded-full border border-gray-200 bg-white text-gray-700 px-3 py-2.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium whitespace-nowrap hover:bg-gray-50 transition shadow-sm min-h-[44px] inline-flex items-center justify-center touch-manipulation"
            }
            style={idx === 0 ? { backgroundColor: THEME.primary } : undefined}
          >
            {c.label}
          </Link>
        ))}
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
            {FEATURED.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-0 flex flex-col"
              >
                <div
                  className={`h-24 sm:h-28 md:h-32 bg-linear-to-br ${item.imageStyle} flex items-start justify-end p-3 sm:p-4 shrink-0`}
                >
                  <div className="rounded-full bg-white/90 border border-white/40 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-gray-700 shadow-sm flex items-center gap-1.5 sm:gap-2 max-w-[85%]">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{item.badge}</span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 flex-1 flex flex-col min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base wrap-break-word">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 wrap-break-word">{item.desc}</p>

                  <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 sm:mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-1 min-w-0">
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 shrink-0">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {item.views}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13h8l-1-10-6 1-1 9z" />
                        </svg>
                        {item.likes}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:shrink-0">
                      <Link
                        href="#"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 sm:py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition text-center min-h-[44px] sm:min-h-0 inline-flex items-center justify-center touch-manipulation w-full sm:w-auto"
                      >
                        Details
                      </Link>
                      <Link
                        href="/signup"
                        className="rounded-lg px-3 py-2.5 sm:py-2 text-xs font-semibold text-white transition text-center min-h-[44px] sm:min-h-0 inline-flex items-center justify-center touch-manipulation w-full sm:w-auto hover:opacity-90"
                        style={{ backgroundColor: THEME.primary }}
                      >
                        Connect
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 min-w-0 order-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-4">
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">Trending Now</h3>
              <Link href="#" className="text-xs sm:text-sm font-semibold hover:underline shrink-0" style={{ color: THEME.primary }}>
                View All Trending
              </Link>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {TRENDING.map((t) => (
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
                    <div className="text-xs sm:text-sm font-semibold text-gray-900 wrap-break-word">{t.sub}</div>
                    <div className="text-[11px] sm:text-xs text-gray-500 mt-0.5 wrap-break-word leading-snug">{t.followers}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-3">New on InvestMind</h3>

            <div className="space-y-3 sm:space-y-4">
              {NEW_ON_INVESTMIND.map((n) => (
                <div key={n.title} className="border border-gray-200/70 rounded-xl p-3 sm:p-4 bg-gray-50 min-w-0">
                  <div className="text-[11px] sm:text-xs text-gray-500">{n.name}</div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5 wrap-break-word">{n.title}</div>
                  <div className="text-[11px] sm:text-xs text-gray-600 mt-1 line-clamp-2 wrap-break-word">{n.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 sm:mt-4">
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center rounded-xl px-4 py-3 sm:py-2.5 text-sm font-semibold text-white transition min-h-[48px] touch-manipulation hover:opacity-90"
                style={{ backgroundColor: THEME.primary }}
              >
                Discover New Founders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
