"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Country } from "country-state-city";
import { Input } from "@/components/ui/Input";
import { TypeaheadField } from "@/components/ui/TypeaheadField";
import { THEME } from "@/lib/constants";
import { ROLES } from "@/lib/constants";
import {
  findAfricanCountryByName,
  findStateByName,
  getAfricanCountries,
  getStatesForCountry,
} from "@/lib/africa-locations";
import { createClient } from "@/lib/supabase/client";
import { safeGetSession, safeGetUser } from "@/lib/supabase/safe-auth";

const ROLE_OPTIONS = [
  { value: ROLES.FOUNDER, label: "Founder / Innovator" },
  { value: ROLES.INVESTOR, label: "Investor / Mentor" },
] as const;

const AGE_MIN = 13;
const AGE_MAX = 120;
const AGE_OPTIONS = Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i);

type PendingLocation = {
  country: string;
  state: string;
  locationLine: string;
};

type CompleteProfileFormProps = {
  step: 1 | 2;
  /** Named with `Action` suffix for Next.js client-boundary prop checks (not a Server Action). */
  onStepChangeAction: (step: 1 | 2) => void;
};

function validateProfileFields(
  firstName: string,
  lastName: string,
  role: string,
  ageRaw: string
): string | null {
  if (!firstName.trim()) {
    return "Please enter your first name.";
  }
  if (!lastName.trim()) {
    return "Please enter your last name.";
  }
  if (!role) {
    return "Please select your role.";
  }
  if (!ageRaw) {
    return "Please select your age.";
  }
  const age = parseInt(ageRaw, 10);
  if (isNaN(age) || age < AGE_MIN || age > AGE_MAX) {
    return `Please select an age between ${AGE_MIN} and ${AGE_MAX}.`;
  }
  return null;
}

export function CompleteProfileForm({ step, onStepChangeAction }: CompleteProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"" | "founder" | "investor">("");
  const [age, setAge] = useState("");

  const [countryInput, setCountryInput] = useState("");
  const [countryIso, setCountryIso] = useState<string | null>(null);
  const [stateInput, setStateInput] = useState("");

  const countryOptions = useMemo(
    () => getAfricanCountries().map((c) => ({ value: c.isoCode, label: c.name })),
    []
  );

  const stateList = useMemo(
    () => (countryIso ? getStatesForCountry(countryIso) : []),
    [countryIso]
  );

  const stateOptions = useMemo(
    () => stateList.map((s) => ({ value: s.isoCode, label: s.name })),
    [stateList]
  );

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const session = await safeGetSession<{ user?: { id: string } }>(supabase);
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

  function resolveCountryIsoFromInput() {
    const picked = findAfricanCountryByName(countryInput);
    const nextIso = picked?.isoCode ?? null;
    setCountryIso((current) => {
      if (current !== nextIso) {
        setStateInput("");
      }
      return nextIso;
    });
  }

  /**
   * If country/state are empty → no location saved.
   * If the user started filling them → must be complete or we return an error message.
   */
  function resolveLocationForSubmit():
    | { ok: true; location: PendingLocation | null }
    | { ok: false; message: string } {
    const anyLocationInput =
      Boolean(countryInput.trim()) || Boolean(countryIso) || Boolean(stateInput.trim());
    if (!anyLocationInput) {
      return { ok: true, location: null };
    }

    const effectiveCountryIso =
      countryIso ?? findAfricanCountryByName(countryInput)?.isoCode ?? null;

    if (!effectiveCountryIso) {
      return { ok: false, message: "Pick your country from the list (type to search)." };
    }

    const countryMeta = Country.getCountryByCode(effectiveCountryIso);
    const countryName = countryMeta?.name ?? countryInput.trim();

    const states = getStatesForCountry(effectiveCountryIso);
    let regionName = stateInput.trim();
    if (states.length > 0) {
      const st = findStateByName(states, regionName);
      if (!st) {
        return { ok: false, message: "Pick your state or region from the list." };
      }
      regionName = st.name;
    } else if (!regionName) {
      return { ok: false, message: "Enter your state or region." };
    }

    return {
      ok: true,
      location: {
        country: countryName,
        state: regionName,
        locationLine: `${regionName}, ${countryName}`,
      },
    };
  }

  function handleNextFromProfile() {
    setError(null);
    const msg = validateProfileFields(firstName, lastName, role, age);
    if (msg) {
      setError(msg);
      return;
    }
    onStepChangeAction(2);
  }

  function handleSkipFromProfile() {
    setError(null);
    onStepChangeAction(2);
  }

  function handleBackToProfile() {
    setError(null);
    onStepChangeAction(1);
  }

  async function handleFinishOnboarding(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const profileErr = validateProfileFields(firstName, lastName, role, age);
    if (profileErr) {
      setError(profileErr);
      return;
    }

    const ageNum = parseInt(age, 10);
    const locResult = resolveLocationForSubmit();
    if (!locResult.ok) {
      setError(locResult.message);
      return;
    }
    const locationPayload = locResult.location;

    setLoading(true);
    const supabase = createClient();
    const user = await safeGetUser<{ id: string; email?: string }>(supabase);
    if (!user) {
      setError("Session expired. Please sign in again.");
      setLoading(false);
      router.replace("/login");
      return;
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const basePayload = {
      id: user.id,
      email: user.email ?? undefined,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: fullName,
      role,
      age: ageNum,
      profile_visible: true,
      updated_at: new Date().toISOString(),
    };

    const locExtras = locationPayload
      ? {
          country: locationPayload.country,
          state: locationPayload.state,
          location: locationPayload.locationLine,
        }
      : {};

    const { error: profileError } = await supabase.from("profiles").upsert(
      { ...basePayload, ...locExtras },
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

  const secondaryBtnClass =
    "w-full sm:w-auto min-h-[44px] rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 touch-manipulation";
  const primaryBtnClass =
    "w-full sm:w-auto min-h-[44px] rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70 touch-manipulation";

  if (checking) {
    return (
      <div className="mx-auto w-full max-w-[380px] text-center text-[#6B7280] py-8">
        Loading…
      </div>
    );
  }

  // Step 1: original profile screen (first)
  if (step === 1) {
    return (
      <div className="mx-auto w-full max-w-[380px] flex flex-col py-2 sm:py-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-0.5 shrink-0">
          Almost there
        </h1>
        <p className="text-sm text-[#6B7280] mb-4 sm:mb-5 shrink-0">
          Tell us a bit about yourself.
        </p>

        <div className="flex flex-col gap-4 sm:gap-5">
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
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
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
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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
              value={role}
              onChange={(e) => setRole(e.target.value as "" | "founder" | "investor")}
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
              value={age}
              onChange={(e) => setAge(e.target.value)}
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

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button type="button" className={secondaryBtnClass} onClick={handleSkipFromProfile}>
              Skip
            </button>
            <button
              type="button"
              className={primaryBtnClass}
              style={{ backgroundColor: THEME.primary }}
              onClick={handleNextFromProfile}
            >
              Next
            </button>
          </div>

          <p className="text-sm text-center text-[#6B7280]">
            <Link href="/login" className="font-semibold text-[#5A2D8F] hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 2: location (after profile; layout flips via AuthLayout)
  return (
    <div className="mx-auto w-full max-w-[380px] flex flex-col py-2 sm:py-4">
      <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-0.5 shrink-0">
        Where are you based?
      </h1>
      <p className="text-sm text-[#6B7280] mb-4 sm:mb-5 shrink-0">
        Choose your country and state, or skip and finish.
      </p>

      <form
        className="flex flex-col min-h-0 flex-1 gap-4 sm:gap-5"
        onSubmit={handleFinishOnboarding}
        noValidate
      >
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 shrink-0">
            {error}
          </p>
        )}

        <TypeaheadField
          id="complete-country"
          label="Country"
          placeholder="Search African countries…"
          options={countryOptions}
          value={countryInput}
          onChange={(v) => {
            setCountryInput(v);
            setCountryIso(null);
            setStateInput("");
          }}
          onPickOption={(opt) => {
            setStateInput("");
            setCountryIso(opt.value);
          }}
          onQueryBlur={resolveCountryIsoFromInput}
          allowFreeText={false}
          maxVisible={14}
        />

        <TypeaheadField
          id="complete-state"
          label="State / region"
          placeholder={
            countryIso
              ? stateList.length
                ? "Search state or region…"
                : "Your state or region…"
              : "Choose a country first…"
          }
          options={stateOptions}
          value={stateInput}
          onChange={setStateInput}
          disabled={!countryIso}
          allowFreeText={stateList.length === 0}
          maxVisible={14}
        />

        <p className="text-xs text-[#9CA3AF] -mt-1">
          Optional — you can add this in Settings later.
        </p>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
          <button type="button" className={secondaryBtnClass} onClick={handleBackToProfile}>
            Skip
          </button>
          <button
            type="submit"
            disabled={loading}
            className={primaryBtnClass}
            style={{ backgroundColor: THEME.primary }}
          >
            {loading ? "Saving…" : "Next"}
          </button>
        </div>

        <p className="text-sm text-center text-[#6B7280]">
          <Link href="/login" className="font-semibold text-[#5A2D8F] hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
