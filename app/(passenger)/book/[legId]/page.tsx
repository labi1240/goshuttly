import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/passenger/booking-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatDate } from "@/lib/utils";

function hhmm(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ legId: string }>;
}) {
  const { legId } = await params;

  const leg = await prisma.tripLeg.findUnique({
    where: { id: legId },
    include: {
      LegTemplate: { include: { FromStop: true, ToStop: true } },
      Trip: {
        include: {
          Template: { include: { Route: { include: { Company: true } } } },
        },
      },
      Shift: { include: { Vehicle: true } },
    },
  });

  if (!leg) notFound();

  const available = Math.max(leg.seatsTotal - leg.seatsBooked, 0);
  const pricePerSeat = leg.LegTemplate.priceCents / 100;
  const route = leg.Trip.Template.Route;
  const vehicleLabel = leg.Shift?.Vehicle
    ? `${leg.Shift.Vehicle.make} ${leg.Shift.Vehicle.modelName}`
    : "TBD";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brand-dark">
        Confirm your booking
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        {route.Company.displayName} · {formatDate(leg.Trip.serviceDate)}
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trip details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="From" value={leg.LegTemplate.FromStop.name} />
            <Row label="To" value={leg.LegTemplate.ToStop.name} />
            <Row label="Departure" value={hhmm(leg.departAt)} />
            <Row label="Arrival" value={hhmm(leg.arriveAt)} />
            <Row label="Vehicle" value={vehicleLabel} />
            <Row
              label="Seats available"
              value={`${available} of ${leg.seatsTotal}`}
            />
            <div className="pt-3 mt-3 border-t border-brand-border flex items-center justify-between">
              <span className="font-medium">Price per seat</span>
              <span className="font-bold">{formatMoney(pricePerSeat)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passenger</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingForm
              tripLegId={leg.id}
              pricePerSeat={pricePerSeat}
              maxSeats={Math.min(available, 8)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-brand-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
