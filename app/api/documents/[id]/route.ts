import { NextRequest, NextResponse } from "next/server";

// permissions + download link
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ message: `Get document ${params.id}` });
}
