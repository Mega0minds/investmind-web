import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_ID = "project-media";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Browsers often send empty type or octet-stream for camera / WhatsApp exports. */
function normalizeImageMimeType(file: File): string | null {
  let t = (file.type || "").trim().toLowerCase();
  if (t === "image/jpg" || t === "image/pjpeg") t = "image/jpeg";
  if (ALLOWED_MIME.has(t)) return t;

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";

  return null;
}

async function ensureProjectMediaBucket() {
  const admin = createAdminClient();
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) throw new Error(listError.message);
  const exists = Array.isArray(buckets) && buckets.some((b) => b.id === BUCKET_ID);
  if (!exists) {
    const { error: createError } = await admin.storage.createBucket(BUCKET_ID, {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (createError && !/already exists/i.test(createError.message)) {
      throw new Error(createError.message);
    }
  }
  return admin;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (kind !== "cover" && kind !== "screenshots") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const contentType = normalizeImageMimeType(file);
  if (!contentType) {
    return NextResponse.json(
      { error: "Unsupported file type (use JPG, PNG, or WebP)" },
      { status: 400 }
    );
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  try {
    const admin = await ensureProjectMediaBucket();
    const path = `${user.id}/${kind}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const { error: uploadError } = await admin.storage.from(BUCKET_ID).upload(path, file, {
      upsert: false,
      contentType,
    });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }
    return NextResponse.json({ path });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
