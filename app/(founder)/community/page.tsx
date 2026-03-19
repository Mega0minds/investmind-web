import Link from "next/link";
import { DashboardShell } from "../_components/DashboardShell";
import { THEME } from "@/lib/constants";

const TRENDING = [
  {
    tag: "#Web3RealEstate",
    title: "Is tokenizing commercial property viable in 2024?",
    meta: "158 members discussing • 12 new posts",
  },
  {
    tag: "#AgriTech",
    title: "Scaling soil IoT in West Africa",
    meta: "89 members discussing • 5 new posts",
  },
  {
    tag: "#ClimateFinance",
    title: "Blended finance for solar mini-grids",
    meta: "64 members discussing • 8 new posts",
  },
] as const;

const NEW_MEMBERS = [
  { name: "Elena Rodriguez", role: "Fintech Consultant" },
  { name: "David Kim", role: "Product Designer" },
  { name: "Sophia Thorne", role: "Climate VC" },
] as const;

const MENTORS = [
  { name: "Liam S.", role: "SaaS GTM" },
  { name: "Anya S.", role: "Fundraising" },
] as const;

export default function CommunityPage() {
  return (
    <DashboardShell title="Community">
      <div className="min-w-0 w-full max-w-full overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Main feed */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-5 order-1 min-w-0">
            {/* Composer */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
              <div className="flex gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 shrink-0" aria-hidden />
                <div className="flex-1 min-w-0">
                  <label htmlFor="community-post" className="sr-only">
                    Share an update
                  </label>
                  <textarea
                    id="community-post"
                    rows={3}
                    placeholder="Share an Update or Ask a Question to the community..."
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none min-h-[88px]"
                  />
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <button type="button" className="inline-flex items-center gap-1.5 hover:text-gray-900 touch-manipulation">
                        <span className="text-base">📷</span> Photo
                      </button>
                      <button type="button" className="inline-flex items-center gap-1.5 hover:text-gray-900 touch-manipulation">
                        <span className="text-base">▶</span> Video
                      </button>
                      <button type="button" className="inline-flex items-center gap-1.5 hover:text-gray-900 touch-manipulation">
                        <span className="text-base">📊</span> Poll
                      </button>
                    </div>
                    <button
                      type="button"
                      className="rounded-xl px-5 py-2.5 sm:py-2 text-sm font-semibold text-white min-h-[44px] w-full sm:w-auto touch-manipulation"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestone */}
            <div
              className="rounded-2xl p-5 sm:p-6 text-white shadow-lg overflow-hidden relative min-w-0"
              style={{
                background: `linear-gradient(135deg, ${THEME.primary} 0%, #7c3aed 50%, #6366f1 100%)`,
              }}
            >
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/10 hidden sm:flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
              </div>
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] sm:text-xs font-bold tracking-wide mb-3">
                MILESTONE ACHIEVEMENT
              </span>
              <h3 className="text-lg sm:text-xl font-bold pr-0 sm:pr-32 wrap-break-word">
                Sarah Chen just closed her first Seed Round!
              </h3>
              <p className="mt-2 text-sm text-white/90 max-w-xl wrap-break-word leading-relaxed">
                The EcoStream project is revolutionizing water filtration for rural clinics. Congratulations to the whole team.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-white px-4 py-2.5 sm:py-2 text-sm font-semibold text-[#2563EB] min-h-[44px] touch-manipulation"
                >
                  Congratulate Sarah
                </button>
                <button
                  type="button"
                  className="rounded-xl border-2 border-white/80 px-4 py-2.5 sm:py-2 text-sm font-semibold text-white min-h-[44px] touch-manipulation"
                >
                  View Project
                </button>
              </div>
            </div>

            {/* Feed post — Marcus */}
            <article className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-0">
              <div className="p-4 flex items-start justify-between gap-2">
                <div className="flex gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-200 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">Marcus Avis</p>
                    <p className="text-xs text-gray-500">Project Upload • 2 hours ago</p>
                  </div>
                </div>
                <button type="button" className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg shrink-0" aria-label="More">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
              </div>
              <p className="px-4 text-sm text-gray-700 wrap-break-word">
                Just uploaded the latest pitch deck for <strong>Nebula AI</strong> — feedback welcome from the community.
              </p>
              <div
                className="mt-3 h-48 sm:h-56 md:h-64 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url(https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&q=80)",
                }}
              />
              <div className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">📄</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">Nebula_Pitch_v2.pdf</p>
                    <p className="text-xs text-gray-500">4.2 MB</p>
                  </div>
                </div>
                <Link href="#" className="text-sm font-semibold text-[#2563EB] shrink-0">
                  Download
                </Link>
              </div>
              <div className="flex items-center gap-6 px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">❤️ 24</span>
                <span className="inline-flex items-center gap-1.5">💬 12</span>
                <span className="inline-flex items-center gap-1.5">↗ Share</span>
              </div>
            </article>

            {/* Mentorship strip */}
            <div className="rounded-xl border-2 border-emerald-200 bg-white px-4 py-3 flex items-center gap-3 min-w-0">
              <div className="flex -space-x-2 shrink-0">
                <div className="w-9 h-9 rounded-full bg-emerald-300 border-2 border-white" />
                <div className="w-9 h-9 rounded-full bg-teal-300 border-2 border-white" />
              </div>
              <p className="text-xs sm:text-sm text-gray-700 flex-1 wrap-break-word">
                <span className="font-semibold">Jordan K.</span> and <span className="font-semibold">Lisa K.</span> have
                established a mentorship connection.
              </p>
              <span className="text-emerald-500 text-lg shrink-0" aria-hidden>
                ◆
              </span>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4 order-2 min-w-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 min-w-0 md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📈</span>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">Trending Discussions</h3>
              </div>
              <ul className="space-y-4">
                {TRENDING.map((t) => (
                  <li key={t.tag} className="min-w-0">
                    <p className="text-xs font-semibold text-[#2563EB]">{t.tag}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 wrap-break-word">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{t.meta}</p>
                  </li>
                ))}
              </ul>
              <Link href="#" className="mt-4 inline-block text-sm font-semibold text-[#2563EB] hover:underline">
                Explore all topics
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">New Members</h3>
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Active Now
                </span>
              </div>
              <ul className="space-y-3">
                {NEW_MEMBERS.map((m) => (
                  <li key={m.name} className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                        <p className="text-xs text-gray-500 truncate">{m.role}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg shrink-0"
                      aria-label={`Follow ${m.name}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 min-h-[44px] touch-manipulation"
              >
                See everyone
              </button>
            </div>

            <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 sm:p-5 min-w-0 md:col-span-2 lg:col-span-1">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-4 wrap-break-word">
                Mentors matching your profile
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {MENTORS.map((m) => (
                  <div key={m.name} className="bg-white rounded-xl border border-gray-200 p-3 text-center min-w-0">
                    <div className="w-12 h-12 rounded-full bg-violet-200 mx-auto" />
                    <p className="text-sm font-semibold text-gray-900 mt-2 truncate">{m.name}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{m.role}</p>
                    <button
                      type="button"
                      className="mt-2 w-full rounded-lg py-2 text-xs font-semibold text-white min-h-[40px] touch-manipulation"
                      style={{ backgroundColor: THEME.primary }}
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
