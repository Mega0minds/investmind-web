import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: actorProfile } = await supabase
    .from("profiles")
    .select("role, admin_approval_status")
    .eq("id", user.id)
    .maybeSingle();

  if (actorProfile?.role !== "admin" || actorProfile?.admin_approval_status !== "approved") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const makeVisible =
    typeof body === "object" && body !== null && "makeVisible" in body
      ? Boolean((body as { makeVisible?: unknown }).makeVisible)
      : null;

  if (makeVisible === null) {
    return NextResponse.json({ error: "Missing makeVisible" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ profile_visible: makeVisible, updated_at: new Date().toISOString() })
    .eq("id", id)
    .neq("role", "admin");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

