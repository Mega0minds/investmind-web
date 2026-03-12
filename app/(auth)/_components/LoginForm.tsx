"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { THEME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmailSentModal, setShowEmailSentModal] = useState(false);

  useEffect(() => {
    if (searchParams.get("email_sent") === "1") {
      setShowEmailSentModal(true);
    }
  }, [searchParams]);

  function closeEmailSentModal() {
    setShowEmailSentModal(false);
    router.replace("/login", { scroll: false });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (!email || !password) return;
    const rememberMe = (form.elements.namedItem("remember") as HTMLInputElement)?.checked ?? true;
    setLoading(true);
    const supabase = createClient(rememberMe);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      if (signInError.message === "Invalid login credentials") {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.exists === false) {
            setError("This email isn't registered. Sign up to create an account.");
            return;
          }
        }
        setError("Incorrect password. Try again or use Forgot password.");
        return;
      }
      setError(signInError.message);
      return;
    }
    const userId = signInData.user?.id;
    const { data: profile } = userId
      ? await supabase.from("profiles").select("first_name, last_name, role, age").eq("id", userId).maybeSingle()
      : { data: null };
    const hasProfile =
      profile?.first_name && profile?.last_name && profile?.role && profile?.age != null;
    if (!hasProfile) {
      router.push("/signup/complete");
    } else {
      router.push("/dashboard");
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
                A confirmation email has been sent. Please check your inbox and click the link to verify your account, then sign in below.
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
        Welcome back
      </h1>
      <p className="text-sm text-[#6B7280] mb-4 sm:mb-5">
        Sign in with your email and password.
      </p>
      <form
        className="space-y-3 sm:space-y-4"
        onSubmit={handleSubmit}
        noValidate
      >
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
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
      <p className="mt-4 sm:mt-5 text-sm text-center text-[#6B7280]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-[#5A2D8F] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
