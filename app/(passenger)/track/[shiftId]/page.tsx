import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LiveTracker } from "@/components/passenger/live-tracker";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const { shiftId } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      Vehicle: { select: { plateNumber: true, make: true, modelName: true } },
      Trip: {
        include: {
          Template: {
            include: {
              Route: { include: { Company: { select: { displayName: true } } } },
            },
          },
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
    },
  });

  if (!shift) notFound();

  const firstLeg = shift.Trip.TripLegs[0];
  const lastLeg = shift.Trip.TripLegs[shift.Trip.TripLegs.length - 1];
  const origin = firstLeg?.LegTemplate.FromStop.name ?? "—";
  const destination = lastLeg?.LegTemplate.ToStop.name ?? "—";
  const vehicleLabel = `${shift.Vehicle.make} ${shift.Vehicle.modelName}`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            {origin} → {destination}
          </h1>
          <p className="text-sm text-brand-muted">
            {shift.Trip.Template.Route.Company.displayName} · {vehicleLabel} ·{" "}
            {formatDate(shift.Trip.serviceDate)}
          </p>
        </div>
        <Badge
          variant={
            shift.status === "EN_ROUTE"
              ? "success"
              : shift.status === "COMPLETED"
                ? "muted"
                : "default"
          }
        >
          {shift.status}
        </Badge>
      </div>

      <div className="mt-6">
        <LiveTracker
          shiftId={shift.id}
          initialLat={shift.lat}
          initialLng={shift.lng}
          status={shift.status}
        />
      </div>

      <p className="mt-4 text-xs text-brand-muted text-center">
        Telemetry updates every 5 seconds while the shuttle is en route. Map
        shows anonymized vehicle position only.
      </p>
    </div>
  );
}
