"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const bookingSchema = z.object({
  shiftId: z.string().uuid(),
  passengerName: z.string().min(2).max(120),
  passengerEmail: z.string().email(),
  passengerPhone: z.string().min(7).max(32),
  seatsRequested: z.number().int().min(1).max(12),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export type BookingResult =
  | { success: true; checkoutSessionUrl: string }
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
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const result = await prisma.$transaction(async (tx) => {
      const shift = await tx.shift.findUnique({
        where: { id: data.shiftId },
        include: {
          vehicle: true,
          trip: { include: { route: true } },
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

      // 1. Create booking in PENDING state
      const booking = await tx.booking.create({
        data: {
          shiftId: data.shiftId,
          passengerName: data.passengerName,
          passengerEmail: data.passengerEmail,
          passengerPhone: data.passengerPhone,
          seatCount: data.seatsRequested,
          qrCodeToken: qrToken,
          paymentStatus: "PENDING",
        },
      });

      // 2. Resolve/Create 5% GST Tax Rate in Stripe
      let gstTaxRateId: string | undefined = undefined;
      try {
        const taxRates = await stripe.taxRates.list({ limit: 100 });
        const existingGst = taxRates.data.find(
          (tr) => tr.percentage === 5 && tr.active && tr.display_name === "GST"
        );
        if (existingGst) {
          gstTaxRateId = existingGst.id;
        } else {
          const createdGst = await stripe.taxRates.create({
            display_name: "GST",
            description: "5% GST",
            percentage: 5,
            inclusive: false,
          });
          gstTaxRateId = createdGst.id;
        }
      } catch (err) {
        console.error("Failed to setup/find GST tax rate:", err);
      }

      // 3. Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "cad",
              product_data: {
                name: `Shuttle Ticket: ${shift.trip.route.origin} to ${shift.trip.route.destination}`,
                description: `Departure: ${shift.trip.departureTime}`,
              },
              unit_amount: Math.round(shift.trip.route.basePrice * 100),
            },
            quantity: data.seatsRequested,
            tax_rates: gstTaxRateId ? [gstTaxRateId] : undefined,
          },
        ],
        mode: "payment",
        customer_email: data.passengerEmail,
        metadata: {
          bookingId: booking.id,
        },
        success_url: `${baseUrl}/ticket/${booking.id}`,
        cancel_url: `${baseUrl}/book/${data.shiftId}?cancelled=true`,
      });

      if (!session.url) {
        throw new Error("Stripe Checkout URL not generated");
      }

      return { checkoutSessionUrl: session.url };
    });

    revalidatePath(`/shifts/${data.shiftId}`);
    return { success: true, ...result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Booking failed";
    return { success: false, error: message };
  }
}

