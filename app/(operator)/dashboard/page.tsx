import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate, startOfDay, endOfDay } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const operator = await prisma.operator.findFirst({
    include: { vehicles: true, drivers: true, routes: true },
  });

  if (!operator) {
    return (
      <div className="rounded-lg border border-brand-border bg-white p-8 text-center">
        <h2 className="text-lg font-semibold">No operator data yet</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Run <code className="font-mono">bun db:seed</code> to populate the demo
          operator and shifts.
        </p>
      </div>
    );
  }

  const today = new Date();
  const [shiftsToday, bookingsToday, activeShifts] = await Promise.all([
    prisma.shift.findMany({
      where: {
        date: { gte: startOfDay(today), lte: endOfDay(today) },
        vehicle: { operatorId: operator.id },
      },
      include: {
        vehicle: true,
        trip: { include: { route: true } },
        bookings: { select: { seatCount: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        createdAt: { gte: startOfDay(today), lte: endOfDay(today) },
        shift: { vehicle: { operatorId: operator.id } },
      },
      include: { shift: { include: { trip: { include: { route: true } } } } },
    }),
    prisma.shift.count({
      where: { status: "EN_ROUTE", vehicle: { operatorId: operator.id } },
    }),
  ]);

  const grossToday = bookingsToday.reduce(
    (sum, b) => sum + b.seatCount * b.shift.trip.route.basePrice,
    0,
  );
  const operatorPayout = grossToday * 0.85;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{operator.businessName}</h1>
        <p className="text-sm text-brand-muted">
          {formatDate(today)} · {operator.vehicles.length} vehicles ·{" "}
          {operator.drivers.length} drivers · {operator.routes.length} routes
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Active shifts" value={String(activeShifts)} />
        <Stat label="Shifts today" value={String(shiftsToday.length)} />
        <Stat label="Bookings today" value={String(bookingsToday.length)} />
        <Stat
          label="Net payout (85%)"
          value={formatMoney(operatorPayout)}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's shifts</CardTitle>
          <Link
            href="/dashboard/shifts"
            className="text-sm text-brand-blue hover:text-brand-blue-dark"
          >
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {shiftsToday.length === 0 ? (
            <p className="text-sm text-brand-muted">
              No shifts scheduled for today.
            </p>
          ) : (
            <div className="divide-y divide-brand-border">
              {shiftsToday.map((s) => {
                const booked = s.bookings.reduce(
                  (sum, b) => sum + b.seatCount,
                  0,
                );
                return (
                  <div
                    key={s.id}
                    className="py-3 flex items-center gap-4"
                  >
                    <div className="w-20 tabular-nums font-semibold">
                      {s.trip.departureTime}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {s.trip.route.origin} → {s.trip.route.destination}
                      </div>
                      <div className="text-xs text-brand-muted">
                        {s.vehicle.makeModel} · {s.vehicle.plateNumber}
                      </div>
                    </div>
                    <div className="text-sm text-brand-muted tabular-nums">
                      {booked}/{s.vehicle.capacity} seats
                    </div>
                    <Badge
                      variant={
                        s.status === "EN_ROUTE"
                          ? "success"
                          : s.status === "COMPLETED"
                            ? "muted"
                            : "default"
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-5">
      <div className="text-xs uppercase tracking-wider text-brand-muted">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
