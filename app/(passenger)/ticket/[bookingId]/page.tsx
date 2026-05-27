import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDate } from "@/lib/utils";
import { PaymentPoller } from "@/components/passenger/payment-poller";

function hhmm(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

const CONFIRMED_STATUSES = new Set(["CONFIRMED", "BOARDED", "IN_TRANSIT", "COMPLETED"]);

export default async function TicketPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      Passenger: { include: { User: true } },
      BookingLegs: {
        include: {
          TripLeg: {
            include: {
              LegTemplate: { include: { FromStop: true, ToStop: true } },
              Trip: {
                include: {
                  Template: {
                    include: { Route: { include: { Company: true } } },
                  },
                },
              },
              Shift: { include: { Vehicle: true } },
            },
          },
        },
        orderBy: { TripLeg: { departAt: "asc" } },
      },
    },
  });

  if (!booking || booking.deletedAt) notFound();

  if (!CONFIRMED_STATUSES.has(booking.status)) {
    return (
      <div className="mx-auto max-w-xl px-6 py-10">
        <div className="text-center mb-6">
          <Badge variant="warning" className="px-3 py-1 text-sm">
            Payment Pending
          </Badge>
          <h1 className="mt-4 text-2xl font-bold">
            Awaiting Payment Confirmation
          </h1>
          <p className="mt-1 text-sm text-brand-muted">
            We&apos;re waiting for Stripe to confirm your transaction. Your
            ticket QR will appear here automatically once confirmed.
          </p>
        </div>

        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center space-y-6">
            <div className="h-16 w-16 rounded-full bg-brand-warning/10 flex items-center justify-center border border-brand-warning/20 text-brand-warning">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 animate-spin"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <span className="text-sm font-semibold block">
                Booking Reference
              </span>
              <span className="text-xs font-mono text-brand-muted">
                {booking.reference}
              </span>
            </div>
            <PaymentPoller />
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col gap-2">
          <Button asChild size="lg">
            <Link href={`/ticket/${booking.id}`}>Check Status</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Book another trip</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!booking.passcode) notFound();

  const qrSvg = await QRCode.toString(booking.passcode, {
    type: "svg",
    margin: 1,
    width: 280,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  const firstLeg = booking.BookingLegs[0];
  const lastLeg = booking.BookingLegs[booking.BookingLegs.length - 1];
  if (!firstLeg || !lastLeg) notFound();

  const route = firstLeg.TripLeg.Trip.Template.Route;
  const vehicle = firstLeg.TripLeg.Shift?.Vehicle;
  const firstShiftId = firstLeg.TripLeg.shiftId;

  const passengerName = booking.Passenger?.User?.name
    ? booking.Passenger.User.name
    : [booking.guestFirstName, booking.guestLastName].filter(Boolean).join(" ") ||
      booking.guestEmail ||
      "Passenger";

  const totalCad = booking.totalCents / 100;
  const subtotalCad = booking.subtotalCents / 100;
  const gstCad = booking.gstCents / 100;

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="text-center mb-6">
        <Badge variant="success" className="px-3 py-1 text-sm">
          Booking confirmed
        </Badge>
        <h1 className="mt-4 text-2xl font-bold">You&apos;re on the manifest</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Show this QR to the driver at the pick-up bay.
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div
            className="mx-auto"
            style={{ width: 280 }}
            // High-contrast SVG for outdoor sunlight legibility
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="mt-6 pt-6 border-t border-dashed border-brand-border space-y-3">
            <Row label="Reference" value={booking.reference} />
            <Row label="Passenger" value={passengerName} />
            <Row label="Operator" value={route.Company.displayName} />
            <Row
              label="Route"
              value={`${firstLeg.TripLeg.LegTemplate.FromStop.name} → ${lastLeg.TripLeg.LegTemplate.ToStop.name}`}
            />
            <Row
              label="Date"
              value={formatDate(firstLeg.TripLeg.Trip.serviceDate)}
            />
            <Row
              label="Departure"
              value={hhmm(firstLeg.TripLeg.departAt)}
            />
            {vehicle ? (
              <Row label="Vehicle" value={vehicle.plateNumber} />
            ) : null}
            <Row label="Seats" value={String(booking.seatsBooked)} />
            {booking.BookingLegs.length > 1 ? (
              <Row label="Legs" value={String(booking.BookingLegs.length)} />
            ) : null}
            <div className="pt-3 mt-3 border-t border-brand-border space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-muted">Subtotal</span>
                <span>{formatMoney(subtotalCad)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-brand-muted">GST (5%)</span>
                <span>{formatMoney(gstCad)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-brand-border">
                <span className="font-medium">Paid</span>
                <span className="text-lg font-bold">
                  {formatMoney(totalCad)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-2">
        {firstShiftId ? (
          <Button asChild variant="outline" size="lg">
            <Link href={`/track/${firstShiftId}`}>Track shuttle live</Link>
          </Button>
        ) : null}
        <Button asChild variant="ghost">
          <Link href="/">Book another trip</Link>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-brand-muted">{label}</span>
      <span className="font-medium text-brand-dark">{value}</span>
    </div>
  );
}
