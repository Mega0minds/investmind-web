import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "List messages" });
}

export async function POST() {
  return NextResponse.json({ message: "Create message" });
}
