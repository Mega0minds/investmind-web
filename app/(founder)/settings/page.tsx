"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardShell } from "../_components/DashboardShell";
import { THEME } from "@/lib/constants";

function Toggle({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 touch-manipulation ${
        on ? "" : "bg-gray-200"
      }`}
      style={on ? { backgroundColor: THEME.primary } : undefined}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [profileVisible, setProfileVisible] = useState(true);
  const [notifInvestor, setNotifInvestor] = useState(true);
  const [notifMentorship, setNotifMentorship] = useState(true);
  const [notifCommunity, setNotifCommunity] = useState(false);
  const [notifDigest, setNotifDigest] = useState(true);

  return (
    <DashboardShell title="Settings">
      <div className="min-w-0 w-full max-w-6xl mx-auto pb-8">
        {/* Page header + Save */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-sm sm:text-base text-gray-500 mt-1">
              Manage your professional identity and preferences.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-xl px-5 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 min-h-[44px] touch-manipulation w-full sm:w-auto"
            style={{ backgroundColor: THEME.primary }}
          >
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Profile Information */}
          <section className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Profile Information</h3>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="relative shrink-0 mx-auto sm:mx-0 w-36 h-36 sm:w-40 sm:h-40">
                <div
                  className="w-full h-full rounded-2xl bg-cover bg-center border border-gray-100"
                  style={{
                    backgroundImage:
                      "url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&q=80)",
                  }}
                />
                <button
                  type="button"
                  className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 touch-manipulation"
                  aria-label="Change profile photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 min-w-0 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                    Full name
                  </label>
                  <input
                    type="text"
                    defaultValue="Alex Rivers"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-offset-0 min-h-[44px] focus:ring-[#5A2D8F]/40"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                    Location
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </span>
                    <input
                      type="text"
                      defaultValue="Nairobi, Kenya"
                      className="w-full rounded-xl border border-gray-200 pl-11 pr-4 py-2.5 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/40 min-h-[44px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-wide text-gray-400 uppercase mb-1.5">
                    Bio
                  </label>
                  <textarea
                    rows={3}
                    defaultValue="Founder of SolarGrid Connect. Passionate about sustainable energy solutions in Africa."
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#5A2D8F]/40 resize-y min-h-[88px]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Right column: Security + Visibility */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: THEME.primary }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">Account Security</h3>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative mb-4">
                <input
                  type="email"
                  readOnly
                  defaultValue="alex@solargrid.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/80 pr-11 pl-4 py-2.5 text-sm text-gray-800 min-h-[44px]"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
                  aria-label="Verified"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </div>
              <button
                type="button"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 min-h-[44px] touch-manipulation"
              >
                Change Password
              </button>
            </section>

            <section className="rounded-2xl border border-purple-100/80 p-5 sm:p-6 bg-linear-to-br from-purple-50 to-violet-50/90">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900">Profile Visibility</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Control who sees your profile</p>
                </div>
                <Toggle on={profileVisible} onChange={setProfileVisible} ariaLabel="Profile visibility" />
              </div>
            </section>
          </div>

          {/* Notification Preferences — full width */}
          <section className="lg:col-span-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5 sm:mb-6">
              <div className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: THEME.primary }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Notification Preferences</h3>
              </div>
              <p className="text-xs text-gray-400 sm:text-right">Last updated 2 days ago</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {[
                {
                  title: "New Investor Requests",
                  desc: "Get notified when an investor asks for more on your pitch.",
                  on: notifInvestor,
                  set: setNotifInvestor,
                },
                {
                  title: "Mentorship Updates",
                  desc: "Session invites, acceptances, and mentor messages.",
                  on: notifMentorship,
                  set: setNotifMentorship,
                },
                {
                  title: "Community Mentions",
                  desc: "When someone tags you or replies to your posts.",
                  on: notifCommunity,
                  set: setNotifCommunity,
                },
                {
                  title: "Email Digests",
                  desc: "Weekly summary of activity on your projects.",
                  on: notifDigest,
                  set: setNotifDigest,
                },
              ].map((row) => (
                <div
                  key={row.title}
                  className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 sm:p-5"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{row.title}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">{row.desc}</p>
                  </div>
                  <Toggle on={row.on} onChange={row.set} ariaLabel={row.title} />
                </div>
              ))}
            </div>
          </section>

          {/* Founder Status */}
          <section className="lg:col-span-8 rounded-2xl bg-slate-900 text-white p-6 sm:p-8 shadow-lg">
            <span className="inline-block rounded-full bg-white/10 text-white/90 text-[10px] sm:text-xs font-bold tracking-wide px-3 py-1 mb-4">
              FOUNDER ELITE STATUS
            </span>
            <p className="text-xl sm:text-2xl font-bold leading-snug">
              Your profile is seen by <span className="text-white">45% more investors</span> this month.
            </p>
            <p className="text-sm text-slate-400 mt-4 max-w-xl">
              Maintain your activity levels to keep your search ranking high.
            </p>
          </section>

          {/* Verify Identity */}
          <section className="lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 flex flex-col">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white mb-4 shrink-0"
              style={{ backgroundColor: THEME.primary }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Verify Identity</h3>
            <p className="text-sm text-gray-500 mt-2 flex-1">
              Add a government-issued ID to unlock verified badge.
            </p>
            <Link
              href="#"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:underline touch-manipulation"
              style={{ color: THEME.primary }}
            >
              Get Started
              <span aria-hidden>→</span>
            </Link>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
