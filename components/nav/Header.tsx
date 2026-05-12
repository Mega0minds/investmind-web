"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { safeGetSession } from "@/lib/supabase/safe-auth";
import { THEME } from "@/lib/constants";

/** Text on dark nav chrome (`THEME.founderNavBg`) */
const NAV_ON_DARK = "#F8F6FC";

/** Auth / onboarding surfaces: never show "Dashboard" in the header (session may already exist). */
function isPublicAuthFlowPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/login") return true;
  if (pathname.startsWith("/signup")) return true;
  if (pathname === "/forgot-password" || pathname === "/reset-password" || pathname === "/verify-email") {
    return true;
  }
  if (pathname === "/admin/login" || pathname === "/admin/signup") return true;
  return false;
}

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const isAboutPage = pathname === "/about";
  const primaryNavHref = isAboutPage ? "/" : "/about";
  const primaryNavLabel = isAboutPage ? "Home" : "About Us";
  const showDashboardCta = Boolean(isLoggedIn) && !isPublicAuthFlowPath(pathname);

  useEffect(() => {
    const supabase = createClient();
    // getSession() is faster (reads from storage); sufficient for nav display
    safeGetSession<{ user?: { id: string } }>(supabase).then((session) => {
      setIsLoggedIn(Boolean(session?.user));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription?.unsubscribe?.();
  }, []);

  return (
    <header className="px-2 pt-2 sm:px-4 sm:pt-4 w-full max-w-[100vw] box-border" style={{ background: "transparent", position: "relative" }}>
      {/* Floating bar */}
      <div
        className="mx-auto flex max-w-6xl w-full min-w-0 items-center justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-[1.25rem] px-3 py-2.5 sm:px-6 md:px-8 sm:py-4 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
        style={{ backgroundColor: THEME.founderNavBg }}
      >
        {/* Logo */}
        <Link href="/" className="shrink-0" aria-label="InvestMind home">
          <Image
            src="/assets/ilogo.png"
            alt="InvestMind"
            width={367}
            height={261}
            className="h-12 sm:h-14 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 shrink-0">
          <Link
            href={primaryNavHref}
            className="text-sm font-medium transition hover:opacity-80 whitespace-nowrap"
            style={{ color: NAV_ON_DARK }}
          >
            {primaryNavLabel}
          </Link>
          <Link
            href="/#faq"
            className="text-sm font-medium transition hover:opacity-80 whitespace-nowrap"
            style={{ color: NAV_ON_DARK }}
          >
            FAQ
          </Link>
        </nav>

        {/* Desktop: Dashboard when logged in (except on auth flows), else Login + Get Started */}
        {showDashboardCta ? (
          <Link
            href="/dashboard"
            className="hidden md:inline-flex rounded-lg px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90 shrink-0"
            style={{ backgroundColor: THEME.primary }}
          >
            Dashboard
          </Link>
        ) : (
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="inline-flex rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-80"
              style={{ color: NAV_ON_DARK }}
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex rounded-lg px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: THEME.primary }}
            >
              Get Started
            </Link>
          </div>
        )}

        {/* Hamburger button - visible only on mobile */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg transition hover:bg-white/10"
          style={{ color: NAV_ON_DARK }}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <span
            className="block w-5 h-0.5 rounded-full bg-current origin-center transition-all duration-200"
            style={{
              transform: menuOpen ? "translateY(4.5px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block w-5 h-0.5 rounded-full bg-current my-1 transition-opacity duration-200"
            style={{ opacity: menuOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-0.5 rounded-full bg-current origin-center transition-all duration-200"
            style={{
              transform: menuOpen ? "translateY(-4.5px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div
          className="md:hidden absolute left-3 right-3 top-full mt-1 rounded-xl overflow-hidden z-20 shadow-lg border border-solid"
          style={{ backgroundColor: THEME.founderNavBg, borderColor: THEME.founderNavBorder }}
        >
          <nav className="flex flex-col py-2">
            <Link
              href={primaryNavHref}
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium transition hover:bg-white/10"
              style={{ color: NAV_ON_DARK }}
            >
              {primaryNavLabel}
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium transition hover:bg-white/10"
              style={{ color: NAV_ON_DARK }}
            >
              FAQ
            </Link>
            {showDashboardCta ? (
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="mx-4 my-2 rounded-lg px-4 py-3 text-sm font-semibold text-white text-center transition hover:opacity-90"
                style={{ backgroundColor: THEME.primary }}
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
                  style={{ color: NAV_ON_DARK }}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="mx-4 my-2 rounded-lg px-4 py-3 text-sm font-semibold text-white text-center transition hover:opacity-90"
                  style={{ backgroundColor: THEME.primary }}
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
