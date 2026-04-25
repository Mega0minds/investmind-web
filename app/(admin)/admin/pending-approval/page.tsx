import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./SignOutButton";

export default async function AdminPendingApprovalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?next=/admin/pending-approval");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, admin_approval_status, admin_authority_level")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  if (profile.admin_approval_status === "approved") {
    redirect("/admin");
  }

  const status = profile.admin_approval_status ?? "pending";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Admin access</h1>
        <p className="mt-2 text-sm text-gray-600">
          {status === "rejected"
            ? "Your admin access request was not approved. Contact your organization if you believe this is a mistake."
            : "Your request is pending. An approved company admin must activate your account and set your authority level before you can use the admin console."}
        </p>
        {status !== "rejected" && profile.admin_authority_level == null ? (
          <p className="mt-3 text-xs text-gray-500">
            After approval, your authority level (1–10) is stored on your profile and can be used to gate sensitive
            actions inside the admin tools.
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link
            href="/admin/login"
            className="inline-flex justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            Admin sign in
          </Link>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
