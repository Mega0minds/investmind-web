import { NextRequest, NextResponse } from "next/server";

// POST create, GET list
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: "List listings" });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Create listing" });
}
