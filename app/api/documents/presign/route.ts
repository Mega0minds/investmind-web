import { NextResponse } from "next/server";

// presigned upload URLs (S3/R2)
export async function POST() {
  return NextResponse.json({ message: "Generate presigned URL" });
}
