import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isMemberProfileOnboardingComplete } from "@/lib/auth/member-profile";
import { sanitizeInternalNextPath } from "@/lib/auth/oauth-callback";
import { supabasePersistedAuthCookieOptions } from "@/lib/supabase/auth-cookie";
import { getPublicSupabaseConfigOrNull } from "@/lib/supabase/public-env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = sanitizeInternalNextPath(url.searchParams.get("next"));
  const cfg = getPublicSupabaseConfigOrNull();
  if (!cfg) {
    return NextResponse.redirect(new URL("/login?error=oauth_config", url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cfg.url, cfg.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // ignore when not writable
        }
      },
    },
    cookieOptions: { ...supabasePersistedAuthCookieOptions },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
  }

  let destination = next;
  const isAdminDest = destination === "/admin" || destination.startsWith("/admin/");

  if (!isAdminDest) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, role, age")
      .eq("id", user.id)
      .maybeSingle();

    if (!isMemberProfileOnboardingComplete(profile)) {
      destination = "/signup/complete";
    } else if (destination === "/signup/complete") {
      destination = "/dashboard";
    }
  }

  return NextResponse.redirect(new URL(destination, url.origin));
}
