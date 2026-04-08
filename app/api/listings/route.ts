import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ListingBody = {
  id?: string;
  status?: "draft" | "published";
  step?: number;
  projectName?: string;
  tagline?: string;
  shortDescription?: string;
  sector?: string;
  subcategory?: string;
  stage?: string;
  coverImageFileName?: string;
  screenshotFileNames?: string[];
  productVideoUrl?: string;
  discoveryTags?: string[];
  market?: string;
  pitchSummary?: string;
  teamSize?: string;
};

function clampStep(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return 1;
  return Math.max(1, Math.min(5, n));
}

function normalizeTextArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const draftOnly = url.searchParams.get("draft") === "1";

  const query = supabase
    .from("projects")
    .select("*")
    .eq("creator_id", user.id)
    .order("updated_at", { ascending: false });

  const { data, error } = draftOnly ? await query.eq("status", "draft").limit(1) : await query;
  if (error) {
    if (/does not exist|relation/i.test(error.message)) {
      return NextResponse.json(
        { error: "Projects backend is not enabled. Run supabase/migrations/005_projects.sql." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (draftOnly) return NextResponse.json({ draft: data?.[0] ?? null });
  return NextResponse.json({ listings: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: ListingBody;
  try {
    body = (await request.json()) as ListingBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = {
    creator_id: user.id,
    status: body.status === "published" ? "published" : "draft",
    step: clampStep(body.step),
    project_name: body.projectName?.trim() || null,
    tagline: body.tagline?.trim() || null,
    short_description: body.shortDescription?.trim() || null,
    sector: body.sector?.trim() || null,
    subcategory: body.subcategory?.trim() || null,
    stage: body.stage?.trim() || null,
    cover_image_file_name: body.coverImageFileName?.trim() || null,
    screenshot_file_names: normalizeTextArray(body.screenshotFileNames),
    product_video_url: body.productVideoUrl?.trim() || null,
    discovery_tags: normalizeTextArray(body.discoveryTags),
    market: body.market?.trim() || null,
    pitch_summary: body.pitchSummary?.trim() || null,
    team_size: body.teamSize?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (body.id?.trim()) {
    const { data, error } = await supabase
      .from("projects")
      .update(payload)
      .eq("id", body.id.trim())
      .eq("creator_id", user.id)
      .select("*")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    return NextResponse.json({ listing: data });
  }

  const { data, error } = await supabase.from("projects").insert(payload).select("*").single();
  if (error) {
    if (/does not exist|relation/i.test(error.message)) {
      return NextResponse.json(
        { error: "Projects backend is not enabled. Run supabase/migrations/005_projects.sql." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ listing: data }, { status: 201 });
}
