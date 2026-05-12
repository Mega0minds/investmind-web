"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { THEME } from "@/lib/constants";
import { isMemberProfileOnboardingComplete } from "@/lib/auth/member-profile";
import { createClient } from "@/lib/supabase/client";
import { GoogleOAuthButton } from "./GoogleOAuthButton";

type LoginFormProps = {
  adminOnly?: boolean;
};

type AuthAlert = {
  body: string;
  /** warning = connection / temporary; error = credentials or access denied */
  variant: "warning" | "error";
};

function isConfigLikeMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes("missing supabase") ||
    m.includes("next_public_supabase") ||
    m.includes(".env") ||
    m.includes("supabase project url") ||
    m.includes("pooler") ||
    m.includes("database host") ||
    m.includes("copy .env") ||
    m.includes("supabase api") ||
    m.includes("goto supabase") ||
    m.includes("settings → api")
  );
}

function isNetworkLikeMessage(msg: string): boolean {
  return /failed to fetch|load failed|networkerror|network request failed/i.test(msg);
}

function friendlyUnknownMessage(raw: string): string {
  if (isConfigLikeMessage(raw) || raw.length > 160) {
    return "Something went wrong. Please try again in a moment.";
  }
  return raw;
}

function AuthFormAlert({ alert }: { alert: AuthAlert }) {
  const isWarning = alert.variant === "warning";
  return (
    <div
      role="alert"
      className={`flex gap-3 rounded-xl border px-4 py-3 ${
        isWarning
          ? "border-amber-200 bg-amber-50/95 text-amber-950"
          : "border-red-200 bg-red-50 text-red-900"
      }`}
    >
      <span className="shrink-0 mt-0.5" aria-hidden>
        {isWarning ? (
          <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        ) : (
          <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </span>
      <p className="text-sm leading-relaxed">{alert.body}</p>
    </div>
  );
}

export function LoginForm({ adminOnly = false }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authAlert, setAuthAlert] = useState<AuthAlert | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissedEmailSentModal, setDismissedEmailSentModal] = useState(false);
  const showEmailSentModal =
    !adminOnly && searchParams.get("email_sent") === "1" && !dismissedEmailSentModal;

  function closeEmailSentModal() {
    setDismissedEmailSentModal(true);
    router.replace(adminOnly ? "/admin/login" : "/login", { scroll: false });
  }

  useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;
    if (err === "oauth" || err === "oauth_config") {
      setAuthAlert({
        body:
          err === "oauth_config"
            ? "Google sign-in isn’t configured on this server yet. Add NEXT_PUBLIC_SITE_URL to your environment."
            : "Google sign-in didn’t finish. Try again, or sign in with email and password.",
        variant: err === "oauth_config" ? "warning" : "error",
      });
    }
    const path = adminOnly ? "/admin/login" : "/login";
    router.replace(path, { scroll: false });
  }, [searchParams, router, adminOnly]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthAlert(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (!email || !password) return;
    const rememberMe = (form.elements.namedItem("remember") as HTMLInputElement)?.checked ?? true;
    setLoading(true);
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient(rememberMe);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isConfigLikeMessage(msg)) {
        setAuthAlert({
          body: "Sign-in isn’t available on this copy of the app yet. Try again later, or contact support if you need help.",
          variant: "warning",
        });
      } else {
        setAuthAlert({
          body: friendlyUnknownMessage(msg),
          variant: "error",
        });
      }
      setLoading(false);
      return;
    }
    let signInData: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>["data"] | null = null;
    let signInError: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>["error"] | null = null;
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      signInData = result.data;
      signInError = result.error;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (isNetworkLikeMessage(msg)) {
        setAuthAlert({
          body: "We couldn’t reach our servers. Check your internet connection, then try again. If this keeps happening, wait a minute and retry.",
          variant: "warning",
        });
      } else if (isConfigLikeMessage(msg)) {
        setAuthAlert({
          body: "Sign-in isn’t available on this copy of the app yet. Try again later, or contact support if you need help.",
          variant: "warning",
        });
      } else {
        setAuthAlert({
          body: friendlyUnknownMessage(msg),
          variant: "error",
        });
      }
      setLoading(false);
      return;
    }
    setLoading(false);
    if (signInError) {
      if (isNetworkLikeMessage(signInError.message)) {
        setAuthAlert({
          body: "We couldn’t reach our servers. Check your internet connection, then try again. If this keeps happening, wait a minute and retry.",
          variant: "warning",
        });
        return;
      }
      if (signInError.message === "Invalid login credentials") {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            exists?: boolean;
            checked?: boolean;
          };
          if (data.checked === true && data.exists === false) {
            setAuthAlert({
              body: "This email isn’t registered yet. Create an account to get started.",
              variant: "error",
            });
            return;
          }
        }
        setAuthAlert({
          body: "That password doesn’t match this account. Try again or use Forgot password.",
          variant: "error",
        });
        return;
      }
      setAuthAlert({
        body: friendlyUnknownMessage(signInError.message),
        variant: "error",
      });
      return;
    }
    const userId = signInData.user?.id;
    const { data: profile } = userId
      ? await supabase
          .from("profiles")
          .select("first_name, last_name, role, age, admin_approval_status")
          .eq("id", userId)
          .maybeSingle()
      : { data: null };
    const nextRaw = searchParams.get("next");
    const nextPath = nextRaw && nextRaw.startsWith("/") ? nextRaw : null;
    const hasProfile = isMemberProfileOnboardingComplete(profile);
    if (adminOnly) {
      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        setAuthAlert({
          body: "This portal is for company admins only. Use the regular sign-in if you have a member account.",
          variant: "error",
        });
        return;
      }
      const approval = profile.admin_approval_status ?? "none";
      if (approval === "rejected") {
        await supabase.auth.signOut();
        setAuthAlert({
          body: "Your admin access wasn’t approved. Contact your organization if you think this is a mistake.",
          variant: "error",
        });
        return;
      }
      if (approval !== "approved") {
        router.push("/admin/pending-approval");
        router.refresh();
        return;
      }
      router.push(nextPath || "/admin");
      router.refresh();
      return;
    }
    if (!hasProfile) {
      router.push("/signup/complete");
    } else {
      router.push(nextPath || "/dashboard");
    }
    router.refresh();
  }

  const emailSentModal =
    showEmailSentModal && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
            aria-labelledby="email-sent-title"
            onClick={closeEmailSentModal}
          >
            <div
              className="w-full max-w-md p-6 sm:p-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/40 mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: `${THEME.primary}25` }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={THEME.primary} className="w-7 h-7">
                    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                  </svg>
                </div>
              </div>
              <h2 id="email-sent-title" className="text-lg sm:text-xl font-bold text-center text-[#1a1a1a] mb-2">
                Check your email
              </h2>
              <p className="text-sm text-[#6B7280] text-center mb-6">
                We&apos;ve sent a confirmation email. Open it and tap the link to verify your account
                — you&apos;ll go straight to <span className="font-medium text-[#4A4A4A]">finish your profile</span>
                . Use <span className="font-medium text-[#4A4A4A]">Sign in</span> below if you&apos;ve already
                verified.
              </p>
              <button
                type="button"
                onClick={closeEmailSentModal}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: THEME.primary }}
              >
                OK
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="mx-auto w-full max-w-[380px] relative">
      {emailSentModal}
      <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-0.5">
        {adminOnly ? "Admin sign in" : "Welcome back"}
      </h1>
      <p className="text-sm text-[#6B7280] mb-4 sm:mb-5">
        {adminOnly
          ? "Company administrators only. Use Google or your admin email and password."
          : "Use Google or sign in with your email and password."}
      </p>
      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-5">
        <GoogleOAuthButton
          nextPath={adminOnly ? "/admin" : "/dashboard"}
          disabled={loading}
          label="Continue with Google"
          onErrorAction={(message) => setAuthAlert({ body: message, variant: "error" })}
        />
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 top-1/2 border-t border-gray-200" aria-hidden />
          <span className="relative bg-white px-3 text-xs font-medium text-[#9CA3AF]">or</span>
        </div>
      </div>
      <form
        className="space-y-3 sm:space-y-4"
        onSubmit={handleSubmit}
        noValidate
      >
        {authAlert ? <AuthFormAlert alert={authAlert} /> : null}
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          id="login-email"
          className="py-2.5 sm:py-3"
          required
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          id="login-password"
          className="py-2.5 sm:py-3"
          required
        />
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="remember"
              className="rounded border-gray-300 w-4 h-4"
              style={{ accentColor: THEME.primary }}
            />
            <span className="text-sm text-[#4A4A4A]">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-sm text-[#6B7280] hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          style={{ backgroundColor: THEME.primary }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      {!adminOnly ? (
        <p className="mt-4 sm:mt-5 text-sm text-center text-[#6B7280]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#5A2D8F] hover:underline">
            Sign up
          </Link>
        </p>
      ) : (
        <p className="mt-4 sm:mt-5 text-sm text-center text-[#6B7280]">
          Need an admin account?{" "}
          <Link href="/admin/signup" className="font-semibold text-[#5A2D8F] hover:underline">
            Request access
          </Link>
        </p>
      )}
    </div>
  );
}
