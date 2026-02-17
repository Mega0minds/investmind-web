import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  return NextResponse.json({ message: `Get thread ${params.threadId}` });
}
