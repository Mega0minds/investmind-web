"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { THEME } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const AGE_MIN = 13;
const AGE_MAX = 120;

export function AdminSignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const firstName = (form.elements.namedItem("firstName") as HTMLInputElement).value.trim();
    const lastName = (form.elements.namedItem("lastName") as HTMLInputElement).value.trim();
    const ageRaw = (form.elements.namedItem("age") as HTMLInputElement).value.trim();
    const age = Number.parseInt(ageRaw, 10);

    if (!email || !password || !firstName || !lastName) {
      setError("Please fill in every field.");
      return;
    }
    if (!Number.isFinite(age) || age < AGE_MIN || age > AGE_MAX) {
      setError(`Age must be between ${AGE_MIN} and ${AGE_MAX}.`);
      return;
    }

    setLoading(true);
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes("Missing Supabase env") ? "Server configuration is incomplete." : msg);
      setLoading(false);
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
    const adminLoginUrl =
      siteUrl && /^https?:\/\//i.test(siteUrl)
        ? `${siteUrl}/admin/login`
        : typeof window !== "undefined"
          ? `${window.location.origin}/admin/login`
          : undefined;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: `${firstName} ${lastName}`.trim() },
        emailRedirectTo: adminLoginUrl,
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      setLoading(false);
      setError("Check your email to confirm your account, then sign in at Admin login.");
      return;
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        role: "admin",
        age,
        admin_approval_status: "pending",
        admin_authority_level: null,
        profile_visible: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    setLoading(false);
    if (profileError) {
      if (/admin_approval_status|admin_authority_level|profiles_role_check|violates check constraint/i.test(profileError.message)) {
        setError(
          "Admin signup requires the latest database schema. Run supabase/migrations/009_admin_profile_approval.sql (or supabase/run_once_profiles.sql) in the Supabase SQL editor."
        );
        return;
      }
      setError(profileError.message);
      return;
    }

    router.push("/admin/pending-approval");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[380px] relative">
      <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-0.5">Request admin access</h1>
      <p className="text-sm text-[#6B7280] mb-4 sm:mb-5">
        Create an account for company administration. You will not see the admin console until an approved admin
        activates your access and assigns your authority level.
      </p>
      <form className="space-y-3 sm:space-y-4" onSubmit={(e) => void handleSubmit(e)} noValidate>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <Input
          label="First name"
          name="firstName"
          autoComplete="given-name"
          id="admin-signup-first"
          className="py-2.5 sm:py-3"
          required
        />
        <Input
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          id="admin-signup-last"
          className="py-2.5 sm:py-3"
          required
        />
        <Input
          label="Age"
          name="age"
          type="number"
          min={AGE_MIN}
          max={AGE_MAX}
          id="admin-signup-age"
          className="py-2.5 sm:py-3"
          required
        />
        <Input
          label="Work email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
          id="admin-signup-email"
          className="py-2.5 sm:py-3"
          required
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="••••••••"
          id="admin-signup-password"
          className="py-2.5 sm:py-3"
          required
          minLength={8}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 sm:py-3.5 text-sm sm:text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-70"
          style={{ backgroundColor: THEME.primary }}
        >
          {loading ? "Submitting…" : "Submit request"}
        </button>
      </form>
      <p className="mt-4 sm:mt-5 text-sm text-center text-[#6B7280]">
        Already have an admin account?{" "}
        <Link href="/admin/login" className="font-semibold text-[#5A2D8F] hover:underline">
          Admin sign in
        </Link>
      </p>
    </div>
  );
}
