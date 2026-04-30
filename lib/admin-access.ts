import { createAdminClient } from "@/lib/supabase/admin";

/** Sidebar feature keys for company admins (extend when you add admin routes). */
export const ADMIN_NAV_KEYS = ["dashboard", "verification", "connections", "project_connections"] as const;
export type AdminNavKey = (typeof ADMIN_NAV_KEYS)[number];

const NAV_KEY_SET = new Set<string>(ADMIN_NAV_KEYS);

/** Primary super admin — never editable from Verification UI. Override via SUPER_ADMIN_EMAIL. */
export function getSuperAdminEmail(): string {
  const fromEnv = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  return fromEnv || "emperorshubnetwork@gmail.com";
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const a = (email ?? "").trim().toLowerCase();
  if (!a) return false;
  return a === getSuperAdminEmail();
}

export function parseAdminSidebarAccess(raw: unknown): AdminNavKey[] | null {
  if (!Array.isArray(raw)) return null;
  const out: AdminNavKey[] = [];
  for (const item of raw) {
    if (typeof item === "string" && NAV_KEY_SET.has(item)) {
      out.push(item as AdminNavKey);
    }
  }
  return out.length ? [...new Set(out)] : [];
}

/** Which sidebar entries this approved admin may use. Super admin always gets full set. */
export async function getAdminShellNavKeys(actorId: string): Promise<AdminNavKey[]> {
  const admin = createAdminClient();
  const row = await admin.from("profiles").select("email, admin_sidebar_access").eq("id", actorId).maybeSingle();

  let email: string | null = null;
  let accessRaw: unknown = null;

  if (row.error?.message?.includes("admin_sidebar_access") && row.error.message.includes("does not exist")) {
    const fallback = await admin.from("profiles").select("email").eq("id", actorId).maybeSingle();
    email = fallback.data?.email ?? null;
  } else if (row.data) {
    email = row.data.email ?? null;
    accessRaw = (row.data as { admin_sidebar_access?: unknown }).admin_sidebar_access;
  } else {
    const fallback = await admin.from("profiles").select("email").eq("id", actorId).maybeSingle();
    email = fallback.data?.email ?? null;
  }

  if (!email) return ["dashboard"];

  if (isSuperAdminEmail(email)) {
    return [...ADMIN_NAV_KEYS];
  }

  const parsed = parseAdminSidebarAccess(accessRaw);
  if (parsed && parsed.length) {
    return parsed;
  }

  // Column missing or empty: treat as full access for older rows (non-super).
  return [...ADMIN_NAV_KEYS];
}

export function navKeysFromForm(formData: FormData): AdminNavKey[] {
  const keys: AdminNavKey[] = [];
  if (formData.get("nav_dashboard") === "1") keys.push("dashboard");
  if (formData.get("nav_verification") === "1") keys.push("verification");
  if (formData.get("nav_connections") === "1") keys.push("connections");
  if (formData.get("nav_project_connections") === "1") keys.push("project_connections");
  return keys.length ? keys : ["dashboard"];
}

/** If the admin may not use `required`, return where to send them; otherwise null. */
export function redirectIfLacksNavAccess(
  allowedKeys: AdminNavKey[],
  required: AdminNavKey
): "/admin" | "/admin/verification" | "/admin/connections" | "/admin/project-connections" | "/admin/login" | null {
  if (allowedKeys.includes(required)) return null;
  const alt =
    allowedKeys.includes("verification")
      ? "/admin/verification"
      : allowedKeys.includes("connections")
        ? "/admin/connections"
        : allowedKeys.includes("project_connections")
          ? "/admin/project-connections"
          : null;
  if (required === "dashboard") {
    return alt ?? "/admin/login";
  }
  if (required === "verification" && allowedKeys.includes("connections")) return "/admin/connections";
  if (required === "verification" && allowedKeys.includes("project_connections")) return "/admin/project-connections";
  if (required === "connections" && allowedKeys.includes("project_connections")) return "/admin/project-connections";
  if (required === "connections" && allowedKeys.includes("verification")) return "/admin/verification";
  if (required === "project_connections" && allowedKeys.includes("connections")) return "/admin/connections";
  if (required === "project_connections" && allowedKeys.includes("verification")) return "/admin/verification";
  return allowedKeys.includes("dashboard") ? "/admin" : "/admin/login";
}
