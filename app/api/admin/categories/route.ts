import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Admin categories" });
}

export async function POST() {
  return NextResponse.json({ message: "Create category" });
}
