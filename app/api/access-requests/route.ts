import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const mentorId =
    typeof body === "object" && body !== null && "mentorId" in body
      ? String((body as { mentorId: unknown }).mentorId).trim()
      : "";
  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message).trim()
      : "";

  if (!mentorId || mentorId === user.id) {
    return NextResponse.json({ error: "Invalid recipient profile." }, { status: 400 });
  }
  if (message.length < 5 || message.length > 300) {
    return NextResponse.json(
      { error: "Message must be between 5 and 300 characters." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("mentorship_requests")
    .select("id, status")
    .eq("requester_id", user.id)
    .eq("mentor_id", mentorId)
    .in("status", ["pending", "accepted"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You already have an active request for this investor." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("mentorship_requests").insert({
    requester_id: user.id,
    mentor_id: mentorId,
    message,
  });

  if (error) {
    if (/does not exist|relation/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            "Connection requests are not enabled yet. Run supabase/migrations/008_mentorship_requests.sql.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
