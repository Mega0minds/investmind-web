/**
 * Canonical public site URL for metadata, robots, and auth redirects.
 * Set NEXT_PUBLIC_SITE_URL in production (https, no trailing slash).
 */
export function getSiteUrlForMetadata(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    return u;
  } catch {
    return undefined;
  }
}
