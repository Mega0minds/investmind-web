"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { THEME } from "@/lib/constants";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENTS_HINT,
  validateNewPassword,
} from "@/lib/password-policy";
import { createClient } from "@/lib/supabase/client";

const CODE_LENGTH = 8;

type Props = {
  email: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordModal({ email, open, onOpenChange }: Props) {
  const [step, setStep] = useState<"send" | "code" | "password" | "done">("send");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const resetFlow = useCallback(() => {
    setStep("send");
    setError(null);
    setLoading(false);
    setCode(Array(CODE_LENGTH).fill(""));
  }, []);

  useEffect(() => {
    if (!open) return;
    const resetTimer = window.setTimeout(() => resetFlow(), 0);
    return () => window.clearTimeout(resetTimer);
  }, [open, resetFlow]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  async function handleSendCode() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
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
      void handleVerifyCode(next.join(""));
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
    const passwordError = validateNewPassword(newPassword);
    if (passwordError) {
      setError(passwordError);
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

  function handleClose() {
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-modal-title"
        className="relative w-full max-w-md max-h-[min(90vh,640px)] overflow-y-auto rounded-2xl bg-white shadow-xl border border-gray-200"
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-5">
          <h2 id="change-password-modal-title" className="text-lg font-bold text-gray-900">
            {step === "send" && "Change password"}
            {step === "code" && "Enter verification code"}
            {step === "password" && "New password"}
            {step === "done" && "Password updated"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 touch-manipulation"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {step === "send" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                We&apos;ll send an 8-digit code to{" "}
                <span className="font-medium text-gray-900">{email}</span> to confirm it&apos;s you, then you can
                choose a new password.
              </p>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSendCode()}
                  disabled={loading}
                  className="w-full sm:w-auto rounded-xl py-2.5 px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70 min-h-[44px]"
                  style={{ backgroundColor: THEME.primary }}
                >
                  {loading ? "Sending…" : "Send code"}
                </button>
              </div>
            </div>
          )}

          {step === "code" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the code we sent to <span className="font-medium text-gray-900">{email}</span>.
              </p>
              <div className="flex justify-center gap-2 sm:gap-3 flex-wrap">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      codeInputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    className="w-11 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-xl border border-gray-200 transition focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30 text-gray-900"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              {loading && <p className="text-sm text-gray-500 text-center">Verifying…</p>}
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep("send");
                    setError(null);
                    setCode(Array(CODE_LENGTH).fill(""));
                  }}
                  className="text-sm font-semibold text-gray-600 hover:underline text-center"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setCode(Array(CODE_LENGTH).fill(""));
                    void handleSendCode();
                  }}
                  disabled={loading}
                  className="text-sm font-semibold text-[#5A2D8F] hover:underline text-center disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </div>
          )}

          {step === "password" && (
            <form className="space-y-3 sm:space-y-4" onSubmit={handleSetPassword} noValidate>
              <p className="text-sm text-gray-600">Choose a strong password for your account.</p>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <PasswordInput
                label="New password"
                name="newPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                id="settings-new-password"
                className="py-2.5 sm:py-3"
                required
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
              />
              <PasswordInput
                label="Confirm new password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                id="settings-confirm-new-password"
                className="py-2.5 sm:py-3"
                required
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
              />
              <p className="text-xs text-gray-400 -mt-2">{PASSWORD_REQUIREMENTS_HINT}</p>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-70 min-h-[44px]"
                style={{ backgroundColor: THEME.primary }}
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Your password has been updated. Use it the next time you sign in on a new device or after signing
                out.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 min-h-[44px]"
                style={{ backgroundColor: THEME.primary }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
