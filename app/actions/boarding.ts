"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const boardSchema = z.object({
  passcode: z.string().min(10).max(200),
  shiftId: z.string().uuid(),
});

export type BoardingResult =
  | {
      success: true;
      passengerName: string;
      seatCount: number;
      legSequence: number;
      alreadyBoarded: boolean;
    }
  | { success: false; error: string };

// Per-leg boarding: a passenger's booking can span multiple legs of one
// trip, and the driver scans them at each boarding stop. We resolve the
// passcode to a Booking, intersect its BookingLegs with the legs of the
// scanning shift, and board the earliest un-boarded leg.
export async function boardPassenger(
  input: z.infer<typeof boardSchema>,
): Promise<BoardingResult> {
  const parsed = boardSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid ticket payload" };

  const booking = await prisma.booking.findFirst({
    where: {
      passcode: parsed.data.passcode,
      deletedAt: null,
    },
    include: {
      BookingLegs: {
        include: { TripLeg: true },
        orderBy: { TripLeg: { departAt: "asc" } },
      },
    },
  });

  if (!booking) return { success: false, error: "Ticket not recognized" };

  if (booking.status !== "CONFIRMED" && booking.status !== "BOARDED" && booking.status !== "IN_TRANSIT") {
    return { success: false, error: `Ticket not redeemable (status: ${booking.status})` };
  }

  const shift = await prisma.shift.findUnique({
    where: { id: parsed.data.shiftId },
    select: {
      driverId: true,
      TripLegs: { select: { id: true } },
    },
  });
  if (!shift) return { success: false, error: "Shift not found" };

  const shiftLegIds = new Set(shift.TripLegs.map((tl) => tl.id));
  const legsForThisShift = booking.BookingLegs.filter((bl) =>
    shiftLegIds.has(bl.tripLegId),
  );

  if (legsForThisShift.length === 0) {
    return { success: false, error: "Ticket is for a different trip" };
  }

  const passengerName =
    [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(" ") ||
    booking.guestEmail ||
    "Passenger";

  const alreadyBoarded = legsForThisShift.find(
    (bl) => bl.boardedStatus === "BOARDED",
  );
  const nextLeg = legsForThisShift.find(
    (bl) => bl.boardedStatus === "NOT_BOARDED",
  );

  if (!nextLeg) {
    // All legs on this shift already boarded. Surface that to the driver.
    const last = alreadyBoarded ?? legsForThisShift[0];
    return {
      success: true,
      passengerName,
      seatCount: last.passengers,
      legSequence: 0,
      alreadyBoarded: true,
    };
  }

  await prisma.$transaction([
    prisma.bookingLeg.update({
      where: { id: nextLeg.id },
      data: {
        boardedStatus: "BOARDED",
        boardedAt: new Date(),
        boardedByDriverId: shift.driverId,
      },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: booking.status === "CONFIRMED" ? "BOARDED" : booking.status,
        BookingTimeline: {
          create: {
            status: "BOARDED",
            note: `Boarded leg ${nextLeg.tripLegId} on shift ${parsed.data.shiftId}`,
            driverId: shift.driverId,
          },
        },
      },
    }),
  ]);

  return {
    success: true,
    passengerName,
    seatCount: nextLeg.passengers,
    legSequence: 0,
    alreadyBoarded: false,
  };
}
