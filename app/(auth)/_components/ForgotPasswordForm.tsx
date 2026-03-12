"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { THEME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const CODE_LENGTH = 8;

export function ForgotPasswordForm() {
  const [step, setStep] = useState<"email" | "code" | "password" | "done">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleSendEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const emailVal = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    if (!emailVal) return;
    setLoading(true);
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailVal, {
      redirectTo,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setEmail(emailVal);
    setStep("code");
    setCode(Array(CODE_LENGTH).fill(""));
    setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
  }

  function handleCodeChange(index: number, value: string) {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    if (value && !/^\d$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    setError(null);
    if (value && index < CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }
    if (next.every((d) => d.length === 1)) {
      handleVerifyCode(next.join(""));
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyCode(token: string) {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    setStep("password");
    setError(null);
  }

  async function handleSetPassword(e: React.FormEvent<HTMLFormElement>) {
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
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="mx-auto w-full max-w-[380px]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-0.5">
          Password updated
        </h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Your password has been changed. You can now sign in with your new password.
        </p>
        <Link
          href="/login"
          className="inline-block w-full rounded-xl py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white text-center transition hover:opacity-90"
          style={{ backgroundColor: THEME.primary }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (step === "password") {
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
          onSubmit={handleSetPassword}
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
            id="new-password"
            className="py-2.5 sm:py-3"
            required
            minLength={6}
          />
          <PasswordInput
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            id="confirm-new-password"
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

  if (step === "code") {
    return (
      <div className="mx-auto w-full max-w-[380px]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-0.5">
          Enter the code
        </h1>
        <p className="text-sm text-[#6B7280] mb-6">
          We sent an 8-digit code to <span className="font-medium text-[#1a1a1a]">{email}</span>. Enter it below.
        </p>
        <div className="flex justify-center gap-2 sm:gap-3 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { codeInputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleCodeKeyDown(index, e)}
              className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border transition focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30"
              style={{ borderColor: THEME.border, color: "#1a1a1a" }}
              aria-label={`Digit ${index + 1}`}
            />
          ))}
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}
        {loading && (
          <p className="text-sm text-[#6B7280] text-center mb-4">Verifying…</p>
        )}
        <p className="text-sm text-center text-[#6B7280]">
          <button
            type="button"
            onClick={() => setStep("email")}
            className="font-semibold text-[#5A2D8F] hover:underline"
          >
            Use a different email
          </button>
        </p>
        <p className="mt-4 sm:mt-5 text-sm text-center text-[#6B7280]">
          <Link href="/login" className="font-semibold text-[#5A2D8F] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[380px]">
      <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-0.5">
        Forgot password?
      </h1>
      <p className="text-sm text-[#6B7280] mb-4 sm:mb-5">
        Enter your email and we&apos;ll send you an 8-digit code to reset your password.
      </p>
      <form
        className="space-y-3 sm:space-y-4"
        onSubmit={handleSendEmail}
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
          id="forgot-email"
          className="py-2.5 sm:py-3"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          style={{ backgroundColor: THEME.primary }}
        >
          {loading ? "Sending…" : "Send code"}
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
