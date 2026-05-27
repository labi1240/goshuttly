import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function hhmm(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export default async function ShiftsPage() {
  const operator = await prisma.operator.findFirst({
    where: { companyId: { not: null } },
  });
  if (!operator || !operator.companyId) return null;
  const companyId = operator.companyId;

  const shifts = await prisma.shift.findMany({
    where: { Vehicle: { companyId } },
    include: {
      Vehicle: true,
      Driver: true,
      Trip: {
        include: {
          TripLegs: {
            include: {
              LegTemplate: {
                include: {
                  FromStop: { select: { name: true } },
                  ToStop: { select: { name: true } },
                },
              },
            },
            orderBy: { departAt: "asc" },
          },
        },
      },
      TripLegs: {
        include: {
          BookingLegs: {
            select: { passengers: true, boardedStatus: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
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
                  const tripLegs = s.Trip.TripLegs;
                  const firstLeg = tripLegs[0];
                  const lastLeg = tripLegs[tripLegs.length - 1];
                  const booked = s.TripLegs.reduce(
                    (sum, tl) =>
                      sum +
                      tl.BookingLegs.reduce((s2, bl) => s2 + bl.passengers, 0),
                    0,
                  );
                  const boarded = s.TripLegs.reduce(
                    (sum, tl) =>
                      sum +
                      tl.BookingLegs.filter(
                        (bl) => bl.boardedStatus === "BOARDED",
                      ).reduce((s2, bl) => s2 + bl.passengers, 0),
                    0,
                  );
                  return (
                    <tr key={s.id}>
                      <td className="py-3 pr-3">
                        {formatDate(s.Trip.serviceDate)}
                      </td>
                      <td className="py-3 pr-3 tabular-nums">
                        {firstLeg ? hhmm(firstLeg.departAt) : "—"}
                      </td>
                      <td className="py-3 pr-3">
                        {firstLeg?.LegTemplate.FromStop.name ?? "—"} →{" "}
                        {lastLeg?.LegTemplate.ToStop.name ?? "—"}
                      </td>
                      <td className="py-3 pr-3">{s.Vehicle.plateNumber}</td>
                      <td className="py-3 pr-3">{s.Driver.displayName}</td>
                      <td className="py-3 pr-3 tabular-nums">
                        {booked}/{s.Vehicle.seatCapacity}
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
