"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const boardSchema = z.object({
  qrToken: z.string().min(10).max(200),
  shiftId: z.string().uuid(),
});

export type BoardingResult =
  | {
      success: true;
      passengerName: string;
      seatCount: number;
      alreadyBoarded: boolean;
    }
  | { success: false; error: string };

export async function boardPassenger(
  input: z.infer<typeof boardSchema>,
): Promise<BoardingResult> {
  const parsed = boardSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid ticket payload" };

  const booking = await prisma.booking.findUnique({
    where: { qrCodeToken: parsed.data.qrToken },
  });

  if (!booking) return { success: false, error: "Ticket not recognized" };
  if (booking.shiftId !== parsed.data.shiftId) {
    return { success: false, error: "Ticket is for a different trip" };
  }
  if (booking.paymentStatus !== "PAID") {
    return { success: false, error: "Ticket not paid" };
  }

  if (booking.boardedStatus === "BOARDED") {
    return {
      success: true,
      passengerName: booking.passengerName,
      seatCount: booking.seatCount,
      alreadyBoarded: true,
    };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { boardedStatus: "BOARDED" },
  });

  return {
    success: true,
    passengerName: booking.passengerName,
    seatCount: booking.seatCount,
    alreadyBoarded: false,
  };
}
