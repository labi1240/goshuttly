import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing STRIPE_WEBHOOK_SECRET env variable");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe Webhook verification failed:", message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;

    if (bookingId) {
      try {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: "PAID" },
        });
        console.log(`Payment confirmed and marked PAID for booking ${bookingId}`);
      } catch (dbErr) {
        console.error(`Failed to update booking status for ${bookingId}:`, dbErr);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
