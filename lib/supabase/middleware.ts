import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseConfigOrNull } from "./public-env";

const PUBLIC_ADMIN_ROUTES = new Set(["/admin/login", "/admin/signup"]);

function isAdminArea(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isPublicAdminRoute(pathname: string) {
  return PUBLIC_ADMIN_ROUTES.has(pathname);
}

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });
  const cfg = getPublicSupabaseConfigOrNull();
  if (!cfg) return response;
  const { url, anonKey } = cfg;
  const { pathname } = request.nextUrl;

  const hasSupabaseSessionCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));

  if (isAdminArea(pathname) && !hasSupabaseSessionCookie) {
    const isPendingPage = pathname === "/admin/pending-approval";
    if (isPublicAdminRoute(pathname)) return response;
    if (isPendingPage) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", "/admin/pending-approval");
      return NextResponse.redirect(loginUrl);
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!isAdminArea(pathname)) return response;

    const isPendingPage = pathname === "/admin/pending-approval";
    const isPublicAdmin = isPublicAdminRoute(pathname);
    const isProtectedAdmin = !isPublicAdmin && !isPendingPage;

    if (!user) {
      if (isPublicAdmin) return response;
      if (isPendingPage) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("next", "/admin/pending-approval");
        return NextResponse.redirect(loginUrl);
      }
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, admin_approval_status")
      .eq("id", user.id)
      .maybeSingle();

    const isAdminUser = profile?.role === "admin";
    const approval = profile?.admin_approval_status ?? "none";
    const isApprovedAdmin = isAdminUser && approval === "approved";

    if (pathname === "/admin/login") {
      if (!isAdminUser) {
        if (user) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return response;
      }
      if (isApprovedAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.redirect(new URL("/admin/pending-approval", request.url));
    }

    if (pathname === "/admin/signup") {
      if (isApprovedAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (isAdminUser) {
        return NextResponse.redirect(new URL("/admin/pending-approval", request.url));
      }
      if (user) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return response;
    }

    if (isPendingPage) {
      if (!isAdminUser) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      if (isApprovedAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return response;
    }

    if (isProtectedAdmin) {
      if (!isAdminUser) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(loginUrl);
      }
      if (!isApprovedAdmin) {
        return NextResponse.redirect(new URL("/admin/pending-approval", request.url));
      }
      return response;
    }

    return response;
  } catch {
    if (isAdminArea(pathname)) {
      const isPendingPage = pathname === "/admin/pending-approval";
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", isPendingPage ? "/admin/pending-approval" : `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }
}
