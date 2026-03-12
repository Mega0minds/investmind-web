"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { THEME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

/**
 * Shown when user lands here from the reset link in email.
 * Supabase recovers the session from the URL hash; we just show the set-password form.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(true);
      if (!session) {
        router.replace("/forgot-password");
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const newPassword = (form.elements.namedItem("newPassword") as HTMLInputElement).value;
    const confirmPassword = (form.elements.namedItem("confirmPassword") as HTMLInputElement).value;
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/login");
    router.refresh();
  }

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-[380px] text-center text-[#6B7280] py-8">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[380px]">
      <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-0.5">
        Set new password
      </h1>
      <p className="text-sm text-[#6B7280] mb-4 sm:mb-5">
        Enter your new password below.
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
        <PasswordInput
          label="New password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          id="reset-new-password"
          className="py-2.5 sm:py-3"
          required
          minLength={6}
        />
        <PasswordInput
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="••••••••"
          id="reset-confirm-password"
          className="py-2.5 sm:py-3"
          required
          minLength={6}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          style={{ backgroundColor: THEME.primary }}
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="mt-4 sm:mt-5 text-sm text-center text-[#6B7280]">
        <Link href="/login" className="font-semibold text-[#5A2D8F] hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
