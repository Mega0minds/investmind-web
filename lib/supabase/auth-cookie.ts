/**
 * Max-Age (seconds) for Supabase auth storage cookies when "remember me" / persistent login is used.
 * Stay signed in for 31 days across browser restarts (cookie lifetime).
 *
 * Also set in Supabase Dashboard → Authentication → Sessions: refresh token / session lifetime
 * should be at least 31 days, otherwise GoTrue will stop issuing refreshes before the cookie expires.
 */
export const SUPABASE_AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 31; // 31 days

export const supabasePersistedAuthCookieOptions = {
  maxAge: SUPABASE_AUTH_COOKIE_MAX_AGE_SECONDS,
} as const;
