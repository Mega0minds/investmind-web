import { NextRequest, NextResponse } from "next/server";

// approve/deny
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ message: `Approve/deny access request ${params.id}` });
}
