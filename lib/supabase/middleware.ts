import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseConfigOrNull } from "./public-env";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const cfg = getPublicSupabaseConfigOrNull();
  if (!cfg) return response;
  const { url, anonKey } = cfg;

  // Skip remote auth checks for anonymous visitors to avoid slow retries.
  const hasSupabaseSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
  if (!hasSupabaseSessionCookie) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Avoid crashing or log floods when Supabase is temporarily unreachable.
    return response;
  }
  return response;
}
