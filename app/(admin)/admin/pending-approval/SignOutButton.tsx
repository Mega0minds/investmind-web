"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient(true);
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void handleSignOut()}
      className="w-full sm:w-auto inline-flex justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      style={{ backgroundColor: "#5A2D8F" }}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
