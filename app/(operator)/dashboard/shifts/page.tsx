import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
  const operator = await prisma.operator.findFirst();
  if (!operator) return null;

  const shifts = await prisma.shift.findMany({
    where: { vehicle: { operatorId: operator.id } },
    include: {
      vehicle: true,
      driver: true,
      trip: { include: { route: true } },
      bookings: { select: { seatCount: true, boardedStatus: true } },
    },
    orderBy: { date: "asc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shifts</h1>
        <p className="text-sm text-brand-muted">
          Next 50 scheduled shifts across your fleet.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manifest</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-brand-muted border-b border-brand-border">
                <tr>
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 pr-3 font-medium">Time</th>
                  <th className="py-2 pr-3 font-medium">Route</th>
                  <th className="py-2 pr-3 font-medium">Vehicle</th>
                  <th className="py-2 pr-3 font-medium">Driver</th>
                  <th className="py-2 pr-3 font-medium">Seats</th>
                  <th className="py-2 pr-3 font-medium">Boarded</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {shifts.map((s) => {
                  const booked = s.bookings.reduce(
                    (sum, b) => sum + b.seatCount,
                    0,
                  );
                  const boarded = s.bookings
                    .filter((b) => b.boardedStatus === "BOARDED")
                    .reduce((sum, b) => sum + b.seatCount, 0);
                  return (
                    <tr key={s.id}>
                      <td className="py-3 pr-3">{formatDate(s.date)}</td>
                      <td className="py-3 pr-3 tabular-nums">
                        {s.trip.departureTime}
                      </td>
                      <td className="py-3 pr-3">
                        {s.trip.route.origin} → {s.trip.route.destination}
                      </td>
                      <td className="py-3 pr-3">{s.vehicle.plateNumber}</td>
                      <td className="py-3 pr-3">{s.driver.name}</td>
                      <td className="py-3 pr-3 tabular-nums">
                        {booked}/{s.vehicle.capacity}
                      </td>
                      <td className="py-3 pr-3 tabular-nums">{boarded}</td>
                      <td className="py-3 pr-3">
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
