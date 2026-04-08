import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_ID = "project-media";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin client unavailable" },
      { status: 500 }
    );
  }

  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 });
  }

  const exists = Array.isArray(buckets) && buckets.some((b) => b.id === BUCKET_ID);
  if (!exists) {
    const { error: createError } = await admin.storage.createBucket(BUCKET_ID, {
      public: true,
      fileSizeLimit: 5242880,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (createError && !/already exists/i.test(createError.message)) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
