import { NextResponse } from "next/server";

// request access
export async function POST() {
  return NextResponse.json({ message: "Request access" });
}
