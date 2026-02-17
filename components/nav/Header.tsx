"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_TEXT = "#4A4A4A";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="px-2 pt-2 sm:px-4 sm:pt-4 w-full max-w-[100vw] box-border" style={{ background: "transparent", position: "relative" }}>
      {/* Floating bar */}
      <div
        className="mx-auto flex max-w-6xl w-full min-w-0 items-center justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-[1.25rem] px-3 py-2.5 sm:px-6 md:px-8 sm:py-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Logo */}
        <Link
          href="/"
          className="text-lg sm:text-xl font-semibold italic tracking-tight shrink-0"
          style={{
            color: NAV_TEXT,
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          InvestMind
        </Link>

        {/* Desktop nav - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 shrink-0">
          <Link
            href="/#about"
            className="text-sm font-medium transition hover:opacity-80 whitespace-nowrap"
            style={{ color: NAV_TEXT }}
          >
            About Us
          </Link>
          <Link
            href="/#faq"
            className="text-sm font-medium transition hover:opacity-80 whitespace-nowrap"
            style={{ color: NAV_TEXT }}
          >
            FAQ
          </Link>
        </nav>

        {/* Desktop Get Started - hidden on mobile */}
        <Link
          href="/signup"
          className="hidden md:inline-flex rounded-lg px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90 shrink-0"
          style={{ backgroundColor: "#5A2D8F" }}
        >
          Get Started
        </Link>

        {/* Hamburger button - visible only on mobile */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg transition hover:bg-gray-100"
          style={{ color: NAV_TEXT }}
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
          className="md:hidden absolute left-3 right-3 top-full mt-1 rounded-xl overflow-hidden z-20 shadow-lg"
          style={{ backgroundColor: "#ffffff" }}
        >
          <nav className="flex flex-col py-2">
            <Link
              href="/#about"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium transition hover:bg-gray-50"
              style={{ color: NAV_TEXT }}
            >
              About Us
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium transition hover:bg-gray-50"
              style={{ color: NAV_TEXT }}
            >
              FAQ
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="mx-4 my-2 rounded-lg px-4 py-3 text-sm font-semibold text-white text-center transition hover:opacity-90"
              style={{ backgroundColor: "#5A2D8F" }}
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
