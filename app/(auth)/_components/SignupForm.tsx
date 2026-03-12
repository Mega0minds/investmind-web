"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { THEME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
    if (!email || !password) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    const termsChecked = (form.elements.namedItem("terms") as HTMLInputElement)?.checked;
    if (!termsChecked) {
      setError("You must agree to the Terms and Conditions to sign up.");
      return;
    }
    // All frontend checks passed – only then call API
    setLoading(true);
    const supabase = createClient();
    const signInUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : undefined;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: signInUrl },
    });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }
    // Profile is created when they complete profile (one less round trip on signup)
    setLoading(false);
    router.push("/login?email_sent=1");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[380px]">
      <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-0.5">
        Create your account
      </h1>
      <p className="text-sm text-[#6B7280] mb-4 sm:mb-5">
        Enter your email and password. You&apos;ll add your details next.
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
          minLength={6}
        />
        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          id="signup-confirm-password"
          className="py-2.5 sm:py-3"
          required
          minLength={6}
        />
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            name="terms"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="rounded border-gray-300 w-4 h-4 mt-0.5 shrink-0"
            style={{ accentColor: THEME.primary }}
          />
          <span className="text-sm text-[#4A4A4A]">
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-[#5A2D8F] hover:underline" target="_blank" rel="noopener noreferrer">
              Terms and Conditions
            </Link>
          </span>
        </label>
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
