"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bookingSchema = z.object({
  shiftId: z.string().uuid(),
  passengerName: z.string().min(2).max(120),
  passengerEmail: z.string().email(),
  passengerPhone: z.string().min(7).max(32),
  seatsRequested: z.number().int().min(1).max(12),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export type BookingResult =
  | { success: true; bookingId: string; qrToken: string }
  | { success: false; error: string };

export async function secureSeatBooking(
  input: BookingInput,
): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const shift = await tx.shift.findUnique({
        where: { id: data.shiftId },
        include: {
          vehicle: true,
          bookings: { select: { seatCount: true } },
        },
      });

      if (!shift) throw new Error("Shift not found");
      if (shift.status === "CANCELLED") throw new Error("Shift cancelled");

      const booked = shift.bookings.reduce((sum, b) => sum + b.seatCount, 0);
      const available = shift.vehicle.capacity - booked;

      if (available < data.seatsRequested) {
        throw new Error("Transaction declined: vehicle capacity reached.");
      }

      const qrToken = randomBytes(24).toString("base64url");

      const booking = await tx.booking.create({
        data: {
          shiftId: data.shiftId,
          passengerName: data.passengerName,
          passengerEmail: data.passengerEmail,
          passengerPhone: data.passengerPhone,
          seatCount: data.seatsRequested,
          qrCodeToken: qrToken,
          paymentStatus: "PAID",
        },
      });

      return { bookingId: booking.id, qrToken };
    });

    revalidatePath(`/shifts/${data.shiftId}`);
    return { success: true, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Booking failed";
    return { success: false, error: message };
  }
}
