"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeGetSession } from "@/lib/supabase/safe-auth";
import { THEME } from "@/lib/constants";
import { normalizeRole, type CanonicalRole } from "@/lib/roles";
import { avatarInitials } from "@/lib/user-display";

const SIDEBAR_ID = "dashboard-sidebar";

/** Dark dashboard chrome (sidebar + top bar) */
const DASH_NAV_BG = "#241f32";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/explore-ideas", label: "Explore Ideas", icon: "eye" },
  { href: "/listings", label: "My Projects", icon: "folder" },
  { href: "/community", label: "Community", icon: "community" },
  { href: "/settings", label: "Settings", icon: "gear" },
] as const;

const iconMap: Record<string, ReactNode> = {
  grid: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  eye: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  folder: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  cap: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  community: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  bell: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  gear: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

function AccountDropdown({
  open,
  align,
  onCloseMenus,
  onLogout,
}: {
  open: boolean;
  align: "header" | "sidebar";
  onCloseMenus: () => void;
  onLogout: () => void;
}) {
  if (!open) return null;
  return (
    <div
      role="menu"
      className={`absolute z-50 min-w-[220px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg ${
        align === "header" ? "right-0 top-full mt-2" : "bottom-full left-0 mb-2"
      }`}
    >
      <Link
        href="/settings"
        role="menuitem"
        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        onClick={() => onCloseMenus()}
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Settings
      </Link>
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
        onClick={onLogout}
      >
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Log out
      </button>
    </div>
  );
}

/**
 * Founder-only layout: top bar + sidebar + main. Matches InvestMind dashboard design.
 */
export function DashboardShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userDisplay, setUserDisplay] = useState<string>("Founder");
  /** Used to hide founder-only nav (e.g. My Projects) for mentors. */
  const [normalizedRole, setNormalizedRole] = useState<CanonicalRole | "unknown" | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerAccountOpen, setHeaderAccountOpen] = useState(false);
  const [sidebarAccountOpen, setSidebarAccountOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const sidebarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    safeGetSession<{ user?: { id: string } }>(supabase).then((session) => {
      if (session?.user) {
        supabase
          .from("profiles")
          .select("first_name, last_name, role")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            setNormalizedRole(normalizeRole((data as { role?: string | null } | null)?.role ?? null));
            if (data?.first_name)
              setUserDisplay(
                data.last_name
                  ? `${data.first_name} ${data.last_name.slice(0, 5)}${data.last_name.length > 5 ? "..." : ""}`
                  : data.first_name
              );
            else setUserDisplay("Founder");
          });
      }
    });
  }, []);

  useEffect(() => {
    if (!headerAccountOpen && !sidebarAccountOpen) return;
    function handlePointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (headerMenuRef.current?.contains(t) || sidebarMenuRef.current?.contains(t)) return;
      setHeaderAccountOpen(false);
      setSidebarAccountOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [headerAccountOpen, sidebarAccountOpen]);

  function closeAccountMenus() {
    setHeaderAccountOpen(false);
    setSidebarAccountOpen(false);
    setSidebarOpen(false);
  }

  async function handleLogout() {
    closeAccountMenus();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#f8fafc] overflow-hidden overflow-x-hidden">
      {/* Mobile overlay */}
      <button
        type="button"
        aria-expanded={sidebarOpen}
        aria-controls={SIDEBAR_ID}
        onClick={() => setSidebarOpen(false)}
        className="fixed inset-0 z-20 bg-black/50 md:hidden transition-opacity"
        style={{ opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? "auto" : "none" }}
      />

      {/* Left sidebar */}
      <aside
        id={SIDEBAR_ID}
        className={`fixed inset-y-0 left-0 z-30 w-[min(280px,85vw)] md:w-60 lg:w-64 shrink-0 border-b md:border-b-0 md:border-r border-[#3d3550] flex flex-col md:min-h-screen transform transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ backgroundColor: DASH_NAV_BG }}
      >
        <div className="p-3 sm:p-4 border-b border-[#3d3550] flex items-center justify-between">
          <Logo variant="dashboard" className="mb-0" />
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-lg text-[#d4cee8] hover:bg-white/10 transition"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto overscroll-contain">
          {NAV_ITEMS.filter(
            (item) => !(normalizedRole === "investor" && item.href === "/listings")
          ).map(({ href, label, icon }) => {
            const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#5A2D8F] text-white shadow-sm"
                    : "text-[#d4cee8] hover:bg-white/10 hover:text-white"
                }`}
              >
                {iconMap[icon]}
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[#3d3550] relative" ref={sidebarMenuRef}>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl p-2 -m-2 text-left hover:bg-white/10 transition cursor-pointer"
            aria-expanded={sidebarAccountOpen}
            aria-haspopup="menu"
            onClick={() => {
              setSidebarAccountOpen((o) => !o);
              setHeaderAccountOpen(false);
            }}
          >
            <div className="w-10 h-10 rounded-full bg-[#5A2D8F]/50 border border-white/15 flex items-center justify-center text-sm font-semibold text-white shrink-0">
              {avatarInitials(userDisplay)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#f0ecff] truncate">{userDisplay}</p>
              <p className="text-xs text-[#9a91b8]">Founder Portal</p>
            </div>
            <svg className="w-4 h-4 text-[#b8aed4] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <AccountDropdown
            open={sidebarAccountOpen}
            align="sidebar"
            onCloseMenus={closeAccountMenus}
            onLogout={handleLogout}
          />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden md:ml-60 lg:ml-64">
        {/* Top header bar (non-sticky; main scrolls) */}
        <header
          className="shrink-0 z-10 flex items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 border-b border-[#3d3550] shadow-sm min-h-[52px]"
          style={{ backgroundColor: DASH_NAV_BG }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-[#d4cee8] hover:bg-white/10 shrink-0 transition"
            aria-label="Open menu"
            aria-expanded={sidebarOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1 flex items-center justify-center min-w-0 max-w-[200px] xs:max-w-none sm:max-w-md mx-auto">
            <label className="relative w-full min-w-0">
              <span className="sr-only">Search</span>
              <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#9a91b8] pointer-events-none">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search..."
                title="Search for mentors, creatives or ideas"
                className="w-full min-w-0 rounded-lg sm:rounded-xl border border-[#4a4160] bg-[#1a1626] py-2 sm:py-2.5 pl-8 sm:pl-10 pr-3 text-xs sm:text-sm text-[#f0ecff] placeholder:text-[#7a7194] focus:border-[#5A2D8F] focus:ring-1 focus:ring-[#5A2D8F]/60 outline-none transition"
              />
            </label>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Link
              href="/community"
              className="p-2 rounded-lg text-[#d4cee8] hover:bg-white/10 hover:text-white transition"
              aria-label="Community"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <div className="relative ml-1" ref={headerMenuRef}>
              <button
                type="button"
                className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a78bfa] focus-visible:ring-offset-2 focus-visible:ring-offset-[#241f32]"
                aria-expanded={headerAccountOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                onClick={() => {
                  setHeaderAccountOpen((o) => !o);
                  setSidebarAccountOpen(false);
                }}
              >
                <div className="w-9 h-9 rounded-full bg-[#5A2D8F]/50 border border-white/15 flex items-center justify-center text-sm font-semibold text-white">
                  {avatarInitials(userDisplay)}
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#241f32] pointer-events-none" aria-hidden />
              </button>
              <AccountDropdown
                open={headerAccountOpen}
                align="header"
                onCloseMenus={closeAccountMenus}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 min-w-0 max-w-full overscroll-contain">
          {title && (
            <h1 className="text-2xl font-bold mb-6 sr-only" style={{ color: THEME.text }}>
              {title}
            </h1>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
