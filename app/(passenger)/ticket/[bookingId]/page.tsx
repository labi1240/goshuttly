import { notFound } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      shift: {
        include: {
          vehicle: true,
          trip: { include: { route: { include: { operator: true } } } },
        },
      },
    },
  });

  if (!booking) notFound();

  const qrSvg = await QRCode.toString(booking.qrCodeToken, {
    type: "svg",
    margin: 1,
    width: 280,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  const total = booking.seatCount * booking.shift.trip.route.basePrice;

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="text-center mb-6">
        <Badge variant="success" className="px-3 py-1 text-sm">
          Booking confirmed
        </Badge>
        <h1 className="mt-4 text-2xl font-bold">You're on the manifest</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Show this QR to the driver at the pick-up bay.
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div
            className="mx-auto"
            style={{ width: 280 }}
            // High-contrast SVG ticket rendering for outdoor sunlight legibility
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="mt-6 pt-6 border-t border-dashed border-brand-border space-y-3">
            <Row
              label="Passenger"
              value={booking.passengerName}
            />
            <Row
              label="Operator"
              value={booking.shift.trip.route.operator.businessName}
            />
            <Row
              label="Route"
              value={`${booking.shift.trip.route.origin} → ${booking.shift.trip.route.destination}`}
            />
            <Row label="Date" value={formatDate(booking.shift.date)} />
            <Row
              label="Departure"
              value={booking.shift.trip.departureTime}
            />
            <Row label="Vehicle" value={booking.shift.vehicle.plateNumber} />
            <Row
              label="Seats"
              value={`${booking.seatCount} × ${formatMoney(booking.shift.trip.route.basePrice)}`}
            />
            <div className="pt-3 mt-3 border-t border-brand-border flex items-center justify-between">
              <span className="font-medium">Paid</span>
              <span className="text-lg font-bold">{formatMoney(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-2">
        <Button asChild variant="outline" size="lg">
          <Link href={`/track/${booking.shiftId}`}>Track shuttle live</Link>
        </Button>
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
