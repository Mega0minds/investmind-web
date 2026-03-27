import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "List updates" });
}

export async function POST() {
  return NextResponse.json({ message: "Create update" });
}
