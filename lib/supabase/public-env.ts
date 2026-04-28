/**
 * Validates NEXT_PUBLIC_SUPABASE_URL so mistakes (wrong host, pooler URL, missing .supabase.co)
 * fail fast with a clear message instead of ERR_NAME_NOT_RESOLVED / auth lock storms in the browser.
 */

export function normalizePublicSupabaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Copy the exact Project URL from Supabase → Settings → API (https://YOUR_PROJECT_REF.supabase.co)."
    );
  }
  if (parsed.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must start with https://");
  }
  const host = parsed.hostname.toLowerCase();
  if (!host.endsWith(".supabase.co")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be your Supabase Project URL ending in .supabase.co (Dashboard → Settings → API). Do not use a database pooler or REST host here."
    );
  }
  if (host.startsWith("db.") || host.includes("pooler")) {
    throw new Error(
      "Use the Supabase API Project URL (https://<ref>.supabase.co), not the database host or pooler."
    );
  }
  return trimmed;
}

export function getPublicSupabaseConfig(): { url: string; anonKey: string } {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!rawUrl?.trim() || !anonKey?.trim()) {
    throw new Error(
      "Missing Supabase env: copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart the dev server or redeploy."
    );
  }
  return {
    url: normalizePublicSupabaseUrl(rawUrl),
    anonKey: anonKey.trim(),
  };
}

/** For middleware: skip session work if env is missing or invalid (avoid edge failures). */
export function getPublicSupabaseConfigOrNull(): { url: string; anonKey: string } | null {
  try {
    return getPublicSupabaseConfig();
  } catch {
    return null;
  }
}
