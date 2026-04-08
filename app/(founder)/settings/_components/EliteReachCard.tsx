import type { ReactNode } from "react";
import type { SettingsEliteRole } from "@/lib/profile-audience-stats";

export type EliteReachStats = {
  role: SettingsEliteRole;
  percent: number | null;
  thisMonth: number;
  lastMonth: number;
  statsReady: boolean;
};

function badgeLabel(role: SettingsEliteRole): string {
  if (role === "investor") return "INVESTOR ELITE STATUS";
  if (role === "founder") return "FOUNDER ELITE STATUS";
  return "ELITE STATUS";
}

function audiencePlural(role: SettingsEliteRole): string {
  if (role === "investor") return "founders";
  if (role === "founder") return "investors";
  return "people";
}

function subtext(role: SettingsEliteRole): string {
  if (role === "investor") {
    return "Stay active to stay visible to founders you care about.";
  }
  if (role === "founder") {
    return "Maintain your activity levels to keep your search ranking high.";
  }
  return "Keep your profile up to date to improve how others discover you.";
}

export function EliteReachCard({ role, percent, thisMonth, lastMonth, statsReady }: EliteReachStats) {
  const audience = audiencePlural(role);

  let headline: ReactNode;
  if (!statsReady) {
    headline = (
      <>
        Reach insights will appear here once profile view tracking is enabled for your workspace.
      </>
    );
  } else if (percent === null) {
    headline = (
      <>
        When {audience} view your profile, you&apos;ll see month-over-month reach{" "}
        <span className="text-white">right here</span>.
      </>
    );
  } else if (lastMonth === 0 && thisMonth > 0) {
    headline = (
      <>
        Strong start — your profile was seen by <span className="text-white">{thisMonth}</span>{" "}
        {audience} this month.
      </>
    );
  } else if (percent === 0) {
    headline = (
      <>
        Your reach among {audience} is <span className="text-white">steady</span> compared to last
        month.
      </>
    );
  } else if (percent > 0) {
    headline = (
      <>
        Your profile is seen by <span className="text-white">{percent}% more {audience}</span> this
        month.
      </>
    );
  } else {
    headline = (
      <>
        Your profile is seen by{" "}
        <span className="text-white">
          {Math.abs(percent)}% fewer {audience}
        </span>{" "}
        this month vs last month.
      </>
    );
  }

  return (
    <section className="lg:col-span-8 rounded-2xl bg-slate-900 text-white p-6 sm:p-8 shadow-lg">
      <span className="inline-block rounded-full bg-white/10 text-white/90 text-[10px] sm:text-xs font-bold tracking-wide px-3 py-1 mb-4">
        {badgeLabel(role)}
      </span>
      <p className="text-xl sm:text-2xl font-bold leading-snug">{headline}</p>
      <p className="text-sm text-slate-400 mt-4 max-w-xl">{subtext(role)}</p>
    </section>
  );
}
