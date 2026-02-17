import { NextRequest, NextResponse } from "next/server";

// GET one, PATCH, DELETE
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ message: `Get listing ${params.id}` });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ message: `Update listing ${params.id}` });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({ message: `Delete listing ${params.id}` });
}
