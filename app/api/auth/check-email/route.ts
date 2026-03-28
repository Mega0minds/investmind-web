import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

const USERS_PER_PAGE = 1000;
/** Safety cap so one request cannot paginate forever. */
const MAX_PAGES = 250;

async function emailExistsInAuth(emailLower: string): Promise<{ ok: true; exists: boolean } | { ok: false }> {
  const supabase = createAdminClient();
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });
    if (error) {
      console.error("check-email listUsers:", error.message);
      return { ok: false };
    }
    if (!data.users.length) {
      return { ok: true, exists: false };
    }
    if (data.users.some((u) => u.email?.toLowerCase() === emailLower)) {
      return { ok: true, exists: true };
    }
    if (data.users.length < USERS_PER_PAGE) {
      return { ok: true, exists: false };
    }
  }
  return { ok: true, exists: false };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!email) {
      return NextResponse.json({ exists: false, checked: false }, { status: 400 });
    }
    const result = await emailExistsInAuth(email.toLowerCase());
    if (!result.ok) {
      return NextResponse.json({ exists: false, checked: false }, { status: 200 });
    }
    return NextResponse.json({ exists: result.exists, checked: true });
  } catch {
    return NextResponse.json({ exists: false, checked: false }, { status: 500 });
  }
}
