import { NextRequest, NextResponse } from "next/server";

// permissions + download link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ message: `Get document ${id}` });
}
