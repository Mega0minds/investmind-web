import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRole } from "@/lib/roles";

/** Mentors (investors) do not have the creative project upload area. */
export async function redirectInvestorFromListingsArea(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const role = (data as { role?: string | null } | null)?.role ?? null;
  if (normalizeRole(role) === "investor") {
    redirect("/dashboard");
  }
}
