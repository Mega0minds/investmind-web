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

  const projectId =
    typeof body === "object" && body !== null && "projectId" in body
      ? String((body as { projectId: unknown }).projectId).trim()
      : "";
  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message).trim()
      : "";

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId." }, { status: 400 });
  }
  if (message.length < 5 || message.length > 300) {
    return NextResponse.json(
      { error: "Message must be between 5 and 300 characters." },
      { status: 400 }
    );
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, creator_id, status")
    .eq("id", projectId)
    .eq("status", "published")
    .maybeSingle();
  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found or unavailable." }, { status: 404 });
  }
  if (project.creator_id === user.id) {
    return NextResponse.json({ error: "You cannot connect to your own project." }, { status: 400 });
  }

  const { error } = await supabase.from("project_connection_requests").insert({
    requester_id: user.id,
    project_id: project.id,
    creator_id: project.creator_id,
    message,
    status: "connecting",
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "You already have an active request for this project." },
        { status: 409 }
      );
    }
    if (/does not exist|relation|schema cache|could not find the table/i.test(error.message)) {
      return NextResponse.json(
        {
          error:
            "Project connection requests are not enabled yet. Run supabase/migrations/012_project_connection_requests.sql.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
