import { NextRequest, NextResponse } from "next/server";

// if using Clerk webhooks
export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Clerk webhook" });
}
