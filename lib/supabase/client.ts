import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates the Supabase browser client.
 * @param rememberMe - If false, session cookie is used (log out when browser closes). If true or omitted, long-lived cookie (default).
 */
export function createClient(rememberMe: boolean = true) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and one of NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
    );
  }
  if (!rememberMe) {
    return createBrowserClient(url, key, {
      cookieOptions: { maxAge: undefined },
      isSingleton: false,
    });
  }
  return createBrowserClient(url, key);
}
