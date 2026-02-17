import { NextRequest, NextResponse } from "next/server";

// request access
export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Request access" });
}
