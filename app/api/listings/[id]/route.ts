import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ListingPatchBody = {
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

async function authUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await authUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("creator_id", user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  return NextResponse.json({ listing: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await authUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: ListingPatchBody;
  try {
    body = (await request.json()) as ListingPatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = {
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

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", id)
    .eq("creator_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  return NextResponse.json({ listing: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await authUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: listing, error: fetchError } = await supabase
    .from("projects")
    .select("cover_image_file_name, screenshot_file_names")
    .eq("id", id)
    .eq("creator_id", user.id)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 400 });
  if (!listing) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const mediaPaths = [
    listing.cover_image_file_name,
    ...(Array.isArray(listing.screenshot_file_names) ? listing.screenshot_file_names : []),
  ].filter((x): x is string => typeof x === "string" && x.trim().length > 0);

  if (mediaPaths.length) {
    const { error: storageError } = await supabase.storage.from("project-media").remove(mediaPaths);
    if (storageError) {
      return NextResponse.json(
        { error: `Failed to delete project media from storage: ${storageError.message}` },
        { status: 400 }
      );
    }
  }

  const { error } = await supabase.from("projects").delete().eq("id", id).eq("creator_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
