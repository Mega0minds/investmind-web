"use client";

import { ReactNode } from "react";
import { Header } from "@/components/nav/Header";

export function AuthLayout({
  children,
  hero,
  formOnRight = false,
}: {
  children: ReactNode;
  hero: ReactNode;
  formOnRight?: boolean;
}) {
  const formCls =
    "w-full md:w-[55%] lg:w-[50%] h-full flex flex-col justify-center overflow-hidden px-4 sm:px-6 md:px-12 lg:px-16 py-4 sm:py-6 md:py-8 bg-white shrink-0 " +
    (formOnRight ? "animate-auth-in-right" : "animate-auth-in-left");
  const heroCls =
    "hidden md:block shrink-0 md:w-[45%] lg:w-[50%] h-full bg-white " +
    (formOnRight ? "animate-auth-in-left" : "animate-auth-in-right");

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <div className="shrink-0 relative z-10">
        <Header />
      </div>
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {formOnRight ? (
          <>
            <div className={heroCls}>{hero}</div>
            <div className={formCls}>
              <div className="flex flex-col justify-center min-h-0 max-h-full">{children}</div>
            </div>
          </>
        ) : (
          <>
            <div className={formCls}>
              <div className="flex flex-col justify-center min-h-0 max-h-full">{children}</div>
            </div>
            <div className={heroCls}>{hero}</div>
          </>
        )}
      </div>
    </div>
  );
}
