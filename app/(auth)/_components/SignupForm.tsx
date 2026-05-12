"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { THEME } from "@/lib/constants";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS_HINT,
  validateNewPassword,
} from "@/lib/password-policy";
import { createClient } from "@/lib/supabase/client";
import { buildEmailSignupConfirmationRedirectUrl } from "@/lib/auth/oauth-callback";
import { GoogleOAuthButton } from "./GoogleOAuthButton";

const DUPLICATE_EMAIL_MESSAGE =
  "An account with this email already exists. Sign in instead.";

function signUpErrorLooksLikeDuplicate(message: string) {
  const m = message.toLowerCase();
  return (
    /already\s*registered|user\s*already|email\s*already|already\s*exists|duplicate|sign\s*in\s*instead/i.test(
      m
    ) || m.includes("already been registered")
  );
}

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    const err = searchParams.get("error");
    if (!err) return;
    if (err === "oauth" || err === "oauth_config") {
      setError(
        err === "oauth_config"
          ? "Google sign-in isn’t configured on this server yet. Add NEXT_PUBLIC_SITE_URL to your environment."
          : "Google sign-in didn’t finish. Try again, or sign up with email."
      );
    }
    router.replace("/signup", { scroll: false });
  }, [searchParams, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
    if (!email || !password) return;
    const passwordError = validateNewPassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setError("You must agree to the Terms and Conditions to sign up.");
      return;
    }
    // All frontend checks passed – only then call API
    setLoading(true);
    try {
      try {
        const checkRes = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (checkRes.ok) {
          const payload = (await checkRes.json().catch(() => ({}))) as {
            exists?: boolean;
            checked?: boolean;
          };
          if (payload.exists === true) {
            setError(DUPLICATE_EMAIL_MESSAGE);
            return;
          }
        }
      } catch {
        // If the check fails, still attempt signUp; duplicate is caught below.
      }

      const supabase = createClient();
      const postConfirmUrl = buildEmailSignupConfirmationRedirectUrl();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: postConfirmUrl ? { emailRedirectTo: postConfirmUrl } : undefined,
      });

      if (signUpError) {
        setError(
          signUpErrorLooksLikeDuplicate(signUpError.message)
            ? DUPLICATE_EMAIL_MESSAGE
            : signUpError.message
        );
        return;
      }

      // GoTrue often returns a user with no identities when the email is already registered
      // (to limit email enumeration). Treat that as "already signed up".
      const identities = signUpData.user?.identities;
      const duplicateByIdentities =
        signUpData.user != null && Array.isArray(identities) && identities.length === 0;
      if (duplicateByIdentities) {
        setError(DUPLICATE_EMAIL_MESSAGE);
        return;
      }

      router.push("/login?email_sent=1");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[380px]">
      <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-0.5">
        Create your account
      </h1>
      <p className="text-sm text-[#6B7280] mb-4 sm:mb-5">
        Continue with Google, or enter your email and password. You&apos;ll add your details next.
      </p>

      <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-5">
        <GoogleOAuthButton
          nextPath="/dashboard"
          disabled={loading || !agreeTerms}
          label="Sign up with Google"
          onErrorAction={(message) => setError(message)}
        />
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="rounded border-gray-300 w-4 h-4 mt-0.5 shrink-0"
            style={{ accentColor: THEME.primary }}
            id="signup-terms"
            aria-describedby={agreeTerms ? undefined : "signup-terms-hint"}
          />
          <span className="text-sm text-[#4A4A4A]">
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-[#5A2D8F] hover:underline" target="_blank" rel="noopener noreferrer">
              Terms and Conditions
            </Link>
          </span>
        </label>
        {!agreeTerms && (
          <p id="signup-terms-hint" className="text-xs text-center text-[#9CA3AF] -mt-1">
            Check this to enable Google sign-up and <span className="whitespace-nowrap">email Next</span>.
          </p>
        )}
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
          id="signup-email"
          className="py-2.5 sm:py-3"
          required
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          id="signup-password"
          className="py-2.5 sm:py-3"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
        />
        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          id="signup-confirm-password"
          className="py-2.5 sm:py-3"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
        />
        <p className="text-xs text-[#9CA3AF] -mt-2">{PASSWORD_REQUIREMENTS_HINT}</p>
        <button
          type="submit"
          disabled={loading || !agreeTerms}
          className="w-full rounded-xl py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          style={{ backgroundColor: THEME.primary }}
        >
          {loading ? "Creating account…" : "Next"}
        </button>
      </form>

      <p className="mt-4 sm:mt-5 text-sm text-center text-[#6B7280]">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#5A2D8F] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
