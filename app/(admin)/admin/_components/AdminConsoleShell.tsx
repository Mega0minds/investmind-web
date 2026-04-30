import Link from "next/link";
import { redirect } from "next/navigation";
import { THEME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { AdminNavKey } from "@/lib/admin-access";
import { AdminMobileSidebar } from "./AdminMobileSidebar";

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
  async function logout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fb]">
      <div className="min-h-screen md:pl-[230px]">
        <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:block md:w-[230px] md:overflow-y-auto border-r border-gray-200 bg-white p-4 md:p-5">
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
                    active ? "bg-purple-50 font-semibold text-purple-800" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <form action={logout} className="mt-6">
            <button
              type="submit"
              className="block w-full rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              Log out
            </button>
          </form>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
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

