"use client";

import Link from "next/link";
import { useState } from "react";
import type { AdminNavKey } from "@/lib/admin-access";

type NavItem = { key: AdminNavKey; label: string; href: string };

export function AdminMobileSidebar({
  navItems,
  activeNav,
}: {
  navItems: NavItem[];
  activeNav?: AdminNavKey;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={sidebarOpen}
        aria-controls="admin-mobile-sidebar"
        onClick={() => setSidebarOpen(true)}
        className="rounded-lg border border-[#CFC5E3] p-2 text-[#51486B] transition hover:bg-[#F0EBFA] md:hidden"
        aria-label="Open admin menu"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <button
        type="button"
        aria-expanded={sidebarOpen}
        aria-controls="admin-mobile-sidebar"
        onClick={() => setSidebarOpen(false)}
        className="fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden"
        style={{ opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? "auto" : "none" }}
      />

      <aside
        id="admin-mobile-sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-[min(280px,85vw)] border-r border-[#CFC5E3] bg-[#E7E2F2] p-4 shadow-xl transition-transform duration-200 ease-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#40355C]">Admin Menu</p>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 text-[#51486B] transition hover:bg-[#F0EBFA]"
            aria-label="Close admin menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = activeNav === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#E4DAF7] font-semibold text-[#40355C]"
                    : "text-[#51486B] hover:bg-[#F0EBFA]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
