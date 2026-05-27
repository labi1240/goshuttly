import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Releases seat holds for PENDING bookings whose checkout TTL has elapsed.
// Triggered by Vercel Cron (see vercel.json / vercel.ts).
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const expired = await prisma.booking.findMany({
    where: { paymentStatus: "PENDING", holdExpiresAt: { lt: new Date() } },
    select: { id: true, shiftId: true, seatCount: true },
  });

  let released = 0;
  for (const b of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        // Guard against the webhook confirming the booking concurrently.
        const result = await tx.booking.updateMany({
          where: { id: b.id, paymentStatus: "PENDING" },
          data: { paymentStatus: "FAILED", holdExpiresAt: null },
        });
        if (result.count === 0) return;

        await tx.shift.update({
          where: { id: b.shiftId },
          data: { seatsBooked: { decrement: b.seatCount } },
        });
        released += 1;
      });
    } catch (err) {
      console.error(`Failed to release hold for booking ${b.id}:`, err);
    }
  }

  return NextResponse.json({ scanned: expired.length, released });
}
