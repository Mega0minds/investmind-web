import { processLock } from "@supabase/auth-js";
import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseConfig } from "./public-env";

const nonBlockingLock: typeof processLock = async (_name, _acquireTimeout, fn) => fn();

/**
 * Creates the Supabase browser client.
 * @param rememberMe - If false, session cookie is used (log out when browser closes). If true or omitted, long-lived cookie (default).
 */
export function createClient(rememberMe: boolean = true) {
  const { url, anonKey } = getPublicSupabaseConfig();
  // Always use a singleton browser client so Header + auth forms do not spawn
  // multiple GoTrue clients (avoids lock / "steal" races in React dev).
  return createBrowserClient(url, anonKey, {
    isSingleton: true,
    auth: {
      // Avoid lock acquisition timeouts under heavy client-side mount bursts.
      // We keep singleton client usage and let auth ops run without waiting.
      lock: nonBlockingLock,
    },
    ...(rememberMe ? {} : { cookieOptions: { maxAge: undefined } }),
  });
}
