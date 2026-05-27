import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing STRIPE_WEBHOOK_SECRET env variable");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe Webhook verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 },
    );
  }

  // Idempotency guard. Stripe retries on 5xx, so we MUST not double-apply
  // status transitions, seat increments, or refunds. The unique constraint
  // on StripeWebhookEvent.stripeEventId enforces this at the DB layer.
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        payload: event as unknown as object,
      },
    });
  } catch (err) {
    // P2002 unique violation = we've already seen this event.
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "P2002"
    ) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("Failed to log webhook event:", err);
    return NextResponse.json(
      { error: "Failed to log event" },
      { status: 500 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(event.data.object);
        break;
      default:
        break;
    }

    await prisma.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true, processedAt: new Date() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Failed to process webhook ${event.id}:`, message);
    await prisma.stripeWebhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processingError: message },
    });
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CONFIRMED",
        holdExpiresAt: null,
        BookingTimeline: {
          create: { status: "CONFIRMED", note: "Stripe checkout completed" },
        },
      },
    }),
    prisma.payment.update({
      where: { bookingId },
      data: {
        status: "SUCCEEDED",
        stripePaymentIntentId: paymentIntentId,
        stripeCustomerId:
          typeof session.customer === "string" ? session.customer : null,
      },
    }),
  ]);
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  // Stripe says the user abandoned checkout. Mark the booking EXPIRED and
  // release the seats. The cron also does this on holdExpiresAt timeout,
  // but the webhook lets us release seats immediately on user cancel.
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) return;

  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: { BookingLegs: true },
    });
    if (!booking) return;
    if (booking.status !== "PENDING_PAYMENT") return;

    for (const bl of booking.BookingLegs) {
      await tx.tripLeg.update({
        where: { id: bl.tripLegId },
        data: { seatsBooked: { decrement: bl.passengers } },
      });
    }

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "EXPIRED",
        BookingTimeline: {
          create: { status: "EXPIRED", note: "Stripe checkout expired" },
        },
      },
    });

    await tx.payment.update({
      where: { bookingId },
      data: { status: "FAILED" },
    });
  });
}
