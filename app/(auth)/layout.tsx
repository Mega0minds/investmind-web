import { ReactNode } from "react";

/** Force auth routes to be dynamic so prerender does not run (avoids Supabase/client env issues). */
export const dynamic = "force-dynamic";

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
