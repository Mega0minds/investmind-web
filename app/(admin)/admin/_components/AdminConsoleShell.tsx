import Link from "next/link";
import { THEME } from "@/lib/constants";
import type { AdminNavKey } from "@/lib/admin-access";
import { AdminMobileSidebar } from "./AdminMobileSidebar";
import { AdminSignOutButton } from "./AdminSignOutButton";

const NAV_ITEMS: Array<{ key: AdminNavKey; label: string; href: string }> = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "verification", label: "Verification", href: "/admin/verification" },
  { key: "connections", label: "Connections", href: "/admin/connections" },
  { key: "project_connections", label: "Project Connections", href: "/admin/project-connections" },
];

export function AdminConsoleShell({
  activeNav,
  allowedNavKeys,
  title,
  subtitle,
  badge = "Approved Admin",
  children,
}: {
  activeNav?: AdminNavKey;
  /** If omitted, all nav items are shown (backward compatible). */
  allowedNavKeys?: AdminNavKey[];
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  const allowed = allowedNavKeys?.length ? new Set(allowedNavKeys) : null;
  const navItems = allowed ? NAV_ITEMS.filter((item) => allowed.has(item.key)) : NAV_ITEMS;

  return (
    <main className="min-h-screen bg-[#E9E3DD]">
      <div className="min-h-screen md:pl-[230px]">
        <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:block md:w-[230px] md:overflow-y-auto border-r border-[#CFC5E3] bg-[#E7E2F2] p-4 md:p-5">
          <div className="rounded-2xl p-3 text-white" style={{ backgroundColor: THEME.primary }}>
            <p className="text-xs uppercase tracking-wider text-white/80">Company Console</p>
            <p className="mt-1 text-lg font-bold">InvestMind Admin</p>
          </div>
          <nav className="mt-5 space-y-2">
            {navItems.map((item) => {
              const active = activeNav === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
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
          <div className="mt-6">
            <AdminSignOutButton />
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-[#CFC5E3] bg-[#E7E2F2] px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AdminMobileSidebar navItems={navItems} activeNav={activeNav} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
                </div>
              </div>
              <div className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: THEME.primary }}>
                {badge}
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6 md:py-8">{children}</div>
        </section>
      </div>
    </main>
  );
}

