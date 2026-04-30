"use client";

import { ReactNode } from "react";
import { Header } from "@/components/nav/Header";

export function AuthLayout({
  children,
  hero,
  formOnRight = false,
  /** When this changes (e.g. onboarding step), the hero/form columns replay the slide-in animation. */
  panelKey,
}: {
  children: ReactNode;
  hero: ReactNode;
  formOnRight?: boolean;
  panelKey?: string | number;
}) {
  const formCls =
    "w-full md:w-[55%] lg:w-[50%] flex flex-col justify-center px-4 sm:px-6 md:px-12 lg:px-16 py-4 sm:py-6 md:py-8 bg-white shrink-0 " +
    (formOnRight ? "animate-auth-in-right" : "animate-auth-in-left");
  const heroCls =
    "hidden md:block shrink-0 md:w-[45%] lg:w-[50%] bg-white " +
    (formOnRight ? "animate-auth-in-left" : "animate-auth-in-right");

  // Stable key on the form column so swapping sides (onboarding steps) does not remount the form
  // and wipe client state. Step-based key only on the hero replays its slide-in animation.
  const heroMountKey = panelKey != null ? `auth-hero-${panelKey}` : "auth-hero";

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-white">
      <div className="shrink-0 relative z-10">
        <Header />
      </div>
      <div className="flex-1 flex flex-col md:flex-row">
        {formOnRight ? (
          <>
            <div key={heroMountKey} className={heroCls}>
              {hero}
            </div>
            <div key="auth-form" className={formCls}>
              <div className="flex flex-col justify-center">{children}</div>
            </div>
          </>
        ) : (
          <>
            <div key="auth-form" className={formCls}>
              <div className="flex flex-col justify-center">{children}</div>
            </div>
            <div key={heroMountKey} className={heroCls}>
              {hero}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
