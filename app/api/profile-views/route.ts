import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Record that the signed-in user viewed another member's profile (for audience stats).
 * Body: { profileUserId: string } — must differ from the current user.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileUserId =
    typeof body === "object" && body !== null && "profileUserId" in body
      ? String((body as { profileUserId: unknown }).profileUserId).trim()
      : "";

  if (!profileUserId || profileUserId === user.id) {
    return NextResponse.json({ error: "Invalid profileUserId" }, { status: 400 });
  }

  const { error } = await supabase.from("profile_views").insert({
    profile_id: profileUserId,
    viewer_id: user.id,
  });

  if (error) {
    if (/does not exist|relation/i.test(error.message)) {
      return NextResponse.json(
        { error: "Profile views are not enabled. Run supabase/migrations/004_profile_views.sql." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
