import { NextRequest, NextResponse } from "next/server";

// approve/deny
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ message: `Approve/deny access request ${id}` });
}
