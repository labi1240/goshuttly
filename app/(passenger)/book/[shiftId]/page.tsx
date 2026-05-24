import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "@/components/passenger/booking-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatDate } from "@/lib/utils";

export default async function BookPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const { shiftId } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      vehicle: true,
      trip: { include: { route: { include: { operator: true } } } },
      bookings: { select: { seatCount: true } },
    },
  });

  if (!shift) notFound();

  const booked = shift.bookings.reduce((sum, b) => sum + b.seatCount, 0);
  const available = shift.vehicle.capacity - booked;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-brand-dark">
        Confirm your booking
      </h1>
      <p className="mt-1 text-sm text-brand-muted">
        {shift.trip.route.operator.businessName} ·{" "}
        {formatDate(shift.date)}
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Trip details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="From" value={shift.trip.route.origin} />
            <Row label="To" value={shift.trip.route.destination} />
            <Row label="Departure" value={shift.trip.departureTime} />
            <Row label="Arrival" value={shift.trip.arrivalTime} />
            <Row label="Vehicle" value={shift.vehicle.makeModel} />
            <Row
              label="Seats available"
              value={`${available} of ${shift.vehicle.capacity}`}
            />
            <div className="pt-3 mt-3 border-t border-brand-border flex items-center justify-between">
              <span className="font-medium">Price per seat</span>
              <span className="font-bold">
                {formatMoney(shift.trip.route.basePrice)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Passenger</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingForm
              shiftId={shift.id}
              pricePerSeat={shift.trip.route.basePrice}
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
