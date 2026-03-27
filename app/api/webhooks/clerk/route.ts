import { NextResponse } from "next/server";

/** Reserved for future webhooks (e.g. external auth). Auth is currently Supabase-only. */
export async function POST() {
  return NextResponse.json({ message: "Webhook endpoint" }, { status: 200 });
}
