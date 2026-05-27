import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Releases seat holds for PENDING_PAYMENT bookings whose holdExpiresAt has
// elapsed. Triggered by Vercel Cron (see vercel.json). Multi-leg bookings
// release seats on every BookingLeg they hold.
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const expired = await prisma.booking.findMany({
    where: {
      status: "PENDING_PAYMENT",
      holdExpiresAt: { lt: new Date() },
    },
    select: { id: true },
  });

  let released = 0;
  for (const b of expired) {
    try {
      await prisma.$transaction(async (tx) => {
        const result = await tx.booking.updateMany({
          where: { id: b.id, status: "PENDING_PAYMENT" },
          data: { status: "EXPIRED", holdExpiresAt: null },
        });
        if (result.count === 0) return;

        const legs = await tx.bookingLeg.findMany({
          where: { bookingId: b.id },
          select: { tripLegId: true, passengers: true },
        });
        for (const bl of legs) {
          await tx.tripLeg.update({
            where: { id: bl.tripLegId },
            data: { seatsBooked: { decrement: bl.passengers } },
          });
        }

        await tx.payment.updateMany({
          where: { bookingId: b.id, status: "REQUIRES_PAYMENT" },
          data: { status: "FAILED" },
        });

        await tx.bookingTimeline.create({
          data: {
            bookingId: b.id,
            status: "EXPIRED",
            note: "Hold expired; seats released by cron",
          },
        });

        released += 1;
      });
    } catch (err) {
      console.error(`Failed to release hold for booking ${b.id}:`, err);
    }
  }

  return NextResponse.json({ scanned: expired.length, released });
}
