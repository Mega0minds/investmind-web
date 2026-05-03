"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { FOUNDER_INTEREST_SECTOR_OPTIONS } from "@/lib/mentor-matching";

type AdminUserEditFormProps = {
  userId: string;
  action: (formData: FormData) => void | Promise<void>;
  initial: {
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    location: string;
    bio: string;
    interestSectors: string[];
    mentorExpertise: string[];
    socialTwitter: string;
    socialLinkedin: string;
    socialInstagram: string;
    socialWebsite: string;
  };
};

const inputClassName =
  "w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-purple-300";

export function AdminUserEditForm({ userId, action, initial }: AdminUserEditFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(initial);

  const isDirty = useMemo(
    () =>
      form.firstName !== initial.firstName ||
      form.lastName !== initial.lastName ||
      form.fullName !== initial.fullName ||
      form.role !== initial.role ||
      form.location !== initial.location ||
      form.bio !== initial.bio ||
      !sameStringArray(form.interestSectors, initial.interestSectors) ||
      !sameStringArray(form.mentorExpertise, initial.mentorExpertise) ||
      form.socialTwitter !== initial.socialTwitter ||
      form.socialLinkedin !== initial.socialLinkedin ||
      form.socialInstagram !== initial.socialInstagram ||
      form.socialWebsite !== initial.socialWebsite,
    [form, initial]
  );

  function toggleSector(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((s) => s !== value) : [...list, value];
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-4 grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        if (!isDirty || isPending) {
          event.preventDefault();
          return;
        }
        startTransition(() => {
          // Let native form submission continue inside transition for pending state.
        });
      }}
    >
      <input type="hidden" name="id" value={userId} />
      <input type="hidden" name="interestSectors" value={form.interestSectors.join(", ")} />
      <input type="hidden" name="mentorExpertise" value={form.mentorExpertise.join(", ")} />
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">First name</label>
        <input
          name="firstName"
          value={form.firstName}
          onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
          className={inputClassName}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Last name</label>
        <input
          name="lastName"
          value={form.lastName}
          onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
          className={inputClassName}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Full name</label>
        <input
          name="fullName"
          value={form.fullName}
          onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
          className={inputClassName}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Role</label>
        <select
          name="role"
          value={form.role}
          onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
          className={inputClassName}
        >
          <option value="">Unassigned</option>
          <option value="founder">founder</option>
          <option value="innovator">innovator</option>
          <option value="investor">Investor</option>
          <option value="mentor">Investor (mentor)</option>
          <option value="admin">admin</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Location</label>
        <input
          name="location"
          value={form.location}
          onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
          className={inputClassName}
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Bio</label>
        <textarea
          name="bio"
          value={form.bio}
          onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
          rows={4}
          className={inputClassName}
        />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Interest sectors (comma separated)
        </label>
        <div className="flex flex-wrap gap-2">
          {FOUNDER_INTEREST_SECTOR_OPTIONS.map((sector) => {
            const active = form.interestSectors.includes(sector);
            return (
              <button
                key={`interest-${sector}`}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    interestSectors: toggleSector(prev.interestSectors, sector),
                  }))
                }
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-[#5A2D8F] bg-[#EEF2FF] text-[#5A2D8F]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {sector}
              </button>
            );
          })}
        </div>
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Investor expertise (comma separated)
        </label>
        <div className="flex flex-wrap gap-2">
          {FOUNDER_INTEREST_SECTOR_OPTIONS.map((sector) => {
            const active = form.mentorExpertise.includes(sector);
            return (
              <button
                key={`expertise-${sector}`}
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    mentorExpertise: toggleSector(prev.mentorExpertise, sector),
                  }))
                }
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-[#5A2D8F] bg-[#EEF2FF] text-[#5A2D8F]"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {sector}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">X/Twitter</label>
        <input
          name="socialTwitter"
          value={form.socialTwitter}
          onChange={(e) => setForm((prev) => ({ ...prev, socialTwitter: e.target.value }))}
          className={inputClassName}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">LinkedIn</label>
        <input
          name="socialLinkedin"
          value={form.socialLinkedin}
          onChange={(e) => setForm((prev) => ({ ...prev, socialLinkedin: e.target.value }))}
          className={inputClassName}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Instagram</label>
        <input
          name="socialInstagram"
          value={form.socialInstagram}
          onChange={(e) => setForm((prev) => ({ ...prev, socialInstagram: e.target.value }))}
          className={inputClassName}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Website</label>
        <input
          name="socialWebsite"
          value={form.socialWebsite}
          onChange={(e) => setForm((prev) => ({ ...prev, socialWebsite: e.target.value }))}
          className={inputClassName}
        />
      </div>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={!isDirty || isPending}
          className="rounded-xl bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save user changes"}
        </button>
      </div>
    </form>
  );
}

function sameStringArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

