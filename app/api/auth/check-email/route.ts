import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    if (!email) {
      return NextResponse.json({ exists: false }, { status: 400 });
    }
    const supabase = createAdminClient();
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      per_page: 1000,
    });
    if (error) {
      console.error("check-email listUsers:", error.message);
      return NextResponse.json({ exists: false }, { status: 200 });
    }
    const exists = users.some((u) => u.email?.toLowerCase() === email.toLowerCase());
    return NextResponse.json({ exists });
  } catch {
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
