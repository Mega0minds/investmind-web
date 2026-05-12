/**
 * Build the absolute URL Supabase redirects to after Google (or other OAuth) sign-in.
 * Must be listed under Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
 *
 * In the browser we always use `window.location.origin` so localhost, preview deploys, and
 * production each get the correct callback without editing env. `NEXT_PUBLIC_SITE_URL` is only
 * used when there is no window (e.g. future server callers).
 */
export function buildOAuthCallbackUrl(nextPath: string): string {
  const next = sanitizeInternalNextPath(nextPath);
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  const fromWindow =
    typeof window !== "undefined" && typeof window.location?.origin === "string"
      ? window.location.origin
      : "";
  const origin =
    fromWindow ||
    (site && /^https?:\/\//i.test(site) ? site : "");
  if (!origin) return `/auth/callback?next=${encodeURIComponent(next)}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Only allow same-origin relative paths (open redirect hardening). */
export function sanitizeInternalNextPath(raw: string | null | undefined): string {
  const fallback = "/signup/complete";
  if (!raw || typeof raw !== "string") return fallback;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  return t;
}
