"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { THEME } from "@/lib/constants";
import { ROLES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const ROLE_OPTIONS = [
  { value: ROLES.FOUNDER, label: "Founder / Innovator" },
  { value: ROLES.INVESTOR, label: "Investor" },
] as const;

const AGE_MIN = 13;
const AGE_MAX = 120;
const AGE_OPTIONS = Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i);

export function CompleteProfileForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      // getSession() first (fast, no server) then profile fetch
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setChecking(false);
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, role, age")
        .eq("id", session.user.id)
        .maybeSingle();
      const hasProfile = profile?.first_name && profile?.last_name && profile?.role && profile?.age != null;
      setChecking(false);
      if (hasProfile) {
        router.replace("/dashboard");
      }
    })();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value.trim();
    const role = (form.elements.namedItem("role") as HTMLSelectElement).value as "founder" | "investor";
    const ageRaw = (form.elements.namedItem("age") as HTMLSelectElement).value;
    const age = ageRaw ? parseInt(ageRaw, 10) : null;

    // Frontend validation only – no API/DB calls until all pass
    if (!firstName) {
      setError("Please enter your first name.");
      return;
    }
    if (!lastName) {
      setError("Please enter your last name.");
      return;
    }
    if (!role) {
      setError("Please select your role.");
      return;
    }
    if (!ageRaw || age === null) {
      setError("Please select your age.");
      return;
    }
    if (isNaN(age) || age < AGE_MIN || age > AGE_MAX) {
      setError(`Please select an age between ${AGE_MIN} and ${AGE_MAX}.`);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please sign in again.");
      setLoading(false);
      router.replace("/login");
      return;
    }
    const fullName = `${firstName} ${lastName}`.trim();
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? undefined,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        role,
        age,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    setLoading(false);
    if (profileError) {
      setError(profileError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="mx-auto w-full max-w-[380px] text-center text-[#6B7280] py-8">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[380px] flex flex-col py-2 sm:py-4">
      <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-0.5 shrink-0">
        Almost there
      </h1>
      <p className="text-sm text-[#6B7280] mb-4 sm:mb-5 shrink-0">
        Tell us a bit about yourself.
      </p>

      <form
        className="flex flex-col min-h-0 flex-1 gap-4 sm:gap-5"
        onSubmit={handleSubmit}
        noValidate
      >
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 shrink-0">
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 shrink-0">
          <Input
            label="First name"
            type="text"
            name="firstName"
            autoComplete="given-name"
            placeholder="First name"
            id="complete-first-name"
            className="py-2.5 sm:py-3"
            required
          />
          <Input
            label="Last name"
            type="text"
            name="lastName"
            autoComplete="family-name"
            placeholder="Last name"
            id="complete-last-name"
            className="py-2.5 sm:py-3"
            required
          />
        </div>
        <div className="space-y-2 shrink-0">
          <label
            htmlFor="complete-role"
            className="block text-sm font-medium"
            style={{ color: THEME.text }}
          >
            Role
          </label>
          <select
            id="complete-role"
            name="role"
            required
            className="w-full rounded-xl border px-4 py-3 text-base transition focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30 bg-white"
            style={{
              borderColor: THEME.border,
              color: "#1a1a1a",
            }}
          >
            <option value="">Select role</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 shrink-0">
          <label
            htmlFor="complete-age"
            className="block text-sm font-medium"
            style={{ color: THEME.text }}
          >
            Age
          </label>
          <select
            id="complete-age"
            name="age"
            required
            className="w-full rounded-xl border px-4 py-3 text-base transition focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/30 bg-white appearance-none cursor-pointer"
            style={{
              borderColor: THEME.border,
              color: "#1a1a1a",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A4A4A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "1.25rem",
              paddingRight: "2.5rem",
            }}
          >
            <option value="">Select age</option>
            {AGE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} years
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2 shrink-0 flex flex-col gap-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
            style={{ backgroundColor: THEME.primary }}
          >
            {loading ? "Saving…" : "Continue to dashboard"}
          </button>
          <p className="text-sm text-center text-[#6B7280]">
            <Link href="/login" className="font-semibold text-[#5A2D8F] hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
