import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shiftId: string }> },
) {
  const { shiftId } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    select: { lat: true, lng: true, status: true, updatedAt: true },
  });

  if (!shift) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    lat: shift.lat,
    lng: shift.lng,
    status: shift.status,
    updatedAt: shift.updatedAt.toISOString(),
  });
}
