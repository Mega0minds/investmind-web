import { NextResponse } from "next/server";

// POST create, GET list
export async function GET() {
  return NextResponse.json({ message: "List listings" });
}

export async function POST() {
  return NextResponse.json({ message: "Create listing" });
}
