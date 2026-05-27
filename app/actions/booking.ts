"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const HOLD_DURATION_MS = 15 * 60 * 1000;
const GST_RATE_BPS = 500;

const bookingSchema = z
  .object({
    tripLegIds: z.array(z.string().uuid()).min(1).max(20),
    seats: z.number().int().min(1).max(12),
    passengerId: z.string().uuid().optional(),
    guestFirstName: z.string().min(1).max(60).optional(),
    guestLastName: z.string().min(1).max(60).optional(),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().min(7).max(32).optional(),
  })
  .refine(
    (d) =>
      d.passengerId !== undefined ||
      (d.guestEmail && d.guestFirstName && d.guestLastName && d.guestPhone),
    { message: "Either passengerId or full guest contact info is required." },
  );

export type BookingInput = z.infer<typeof bookingSchema>;

export type BookingResult =
  | { success: true; bookingId: string; reference: string; checkoutSessionUrl: string }
  | { success: false; error: string };

function generateBookingReference(): string {
  const raw = randomBytes(6).toString("base64url").toUpperCase();
  const compact = raw.replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return `SHTL-${compact}`;
}

function generatePasscode(): string {
  return randomBytes(16).toString("base64url");
}

// Multi-leg booking. Lock all TripLeg rows in deterministic ID order
// (the schema comment on TripLeg requires this to avoid deadlocks on
// overlapping leg ranges) and verify availability before incrementing.
// External Stripe calls happen AFTER the transaction commits; the hold
// is released by the release-stale-holds cron if Stripe never confirms.
export async function secureSeatBooking(
  input: BookingInput,
): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const data = parsed.data;
  const sortedLegIds = [...data.tripLegIds].sort();
  const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS);

  let bookingId: string;
  let totalCents: number;
  let reference: string;
  let companyId: string | null = null;
  let customerEmail: string | undefined;

  try {
    ({ bookingId, totalCents, reference, companyId, customerEmail } =
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          SELECT id FROM "TripLeg"
          WHERE id IN (${Prisma.join(sortedLegIds)})
          ORDER BY id ASC
          FOR UPDATE
        `;

        const legs = await tx.tripLeg.findMany({
          where: { id: { in: sortedLegIds } },
          include: {
            LegTemplate: true,
            Trip: {
              include: {
                Template: { include: { Route: true } },
              },
            },
          },
        });

        if (legs.length !== sortedLegIds.length) {
          throw new Error("One or more legs no longer exist.");
        }

        const tripIds = new Set(legs.map((l) => l.tripId));
        if (tripIds.size > 1) {
          throw new Error("All legs must belong to the same trip.");
        }

        for (const leg of legs) {
          if (leg.seatsBooked + data.seats > leg.seatsTotal) {
            throw new Error(
              `Not enough seats on leg ${leg.LegTemplate.sequence}.`,
            );
          }
        }

        const subtotalCents = legs.reduce(
          (sum, l) => sum + l.LegTemplate.priceCents * data.seats,
          0,
        );
        const gstCents = Math.round((subtotalCents * GST_RATE_BPS) / 10000);
        const computedTotalCents = subtotalCents + gstCents;

        for (const leg of legs) {
          await tx.tripLeg.update({
            where: { id: leg.id },
            data: { seatsBooked: { increment: data.seats } },
          });
        }

        const passenger = data.passengerId
          ? await tx.passenger.findUnique({ where: { uid: data.passengerId } })
          : null;
        if (data.passengerId && !passenger) {
          throw new Error("Passenger not found.");
        }

        const bookingReference = generateBookingReference();
        const passcode = generatePasscode();

        const booking = await tx.booking.create({
          data: {
            reference: bookingReference,
            passengerId: data.passengerId ?? null,
            guestFirstName: data.guestFirstName ?? null,
            guestLastName: data.guestLastName ?? null,
            guestEmail: data.guestEmail ?? null,
            guestPhone: data.guestPhone ?? null,
            seatsBooked: data.seats,
            subtotalCents,
            gstCents,
            totalCents: computedTotalCents,
            currency: "CAD",
            tier: "STANDARD",
            status: "PENDING_PAYMENT",
            holdExpiresAt,
            passcode,
            BookingLegs: {
              create: legs.map((l) => ({
                tripLegId: l.id,
                passengers: data.seats,
                unitPriceCents: l.LegTemplate.priceCents,
              })),
            },
            BookingTimeline: {
              create: { status: "PENDING_PAYMENT", note: "Booking created" },
            },
          },
        });

        const route = legs[0].Trip.Template.Route;
        const resolvedCompanyId = route.companyId;

        await tx.payment.create({
          data: {
            bookingId: booking.id,
            amountTotalCents: computedTotalCents,
            currency: "CAD",
            provider: "STRIPE",
            status: "REQUIRES_PAYMENT",
            idempotencyKey: randomBytes(24).toString("base64url"),
            companyId: resolvedCompanyId,
          },
        });

        return {
          bookingId: booking.id,
          totalCents: computedTotalCents,
          reference: bookingReference,
          companyId: resolvedCompanyId,
          customerEmail: data.guestEmail,
        };
      }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Booking failed.";
    return { success: false, error: message };
  }

  void companyId;

  try {
    const headersList = await headers();
    const host = headersList.get("host") ?? "localhost:3000";
    const protocol = host.startsWith("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `Shuttle booking ${reference}`,
              description: `${sortedLegIds.length} leg${sortedLegIds.length === 1 ? "" : "s"}, ${parsed.data.seats} passenger${parsed.data.seats === 1 ? "" : "s"}`,
            },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: customerEmail,
      metadata: { bookingId },
      success_url: `${baseUrl}/ticket/${bookingId}`,
      cancel_url: `${baseUrl}/search?cancelled=true`,
    });

    if (!session.url) {
      return { success: false, error: "Stripe Checkout URL not generated." };
    }

    await prisma.payment.update({
      where: { bookingId },
      data: { stripeCheckoutSessionId: session.id },
    });

    revalidatePath("/search");
    return {
      success: true,
      bookingId,
      reference,
      checkoutSessionUrl: session.url,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return { success: false, error: message };
  }
}
