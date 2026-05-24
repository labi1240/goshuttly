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
      vehicle: { select: { plateNumber: true, makeModel: true } },
      trip: {
        include: {
          route: {
            include: { operator: { select: { businessName: true } } },
          },
        },
      },
    },
  });

  if (!shift) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            {shift.trip.route.origin} → {shift.trip.route.destination}
          </h1>
          <p className="text-sm text-brand-muted">
            {shift.trip.route.operator.businessName} · {shift.vehicle.makeModel} ·{" "}
            {formatDate(shift.date)}
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
