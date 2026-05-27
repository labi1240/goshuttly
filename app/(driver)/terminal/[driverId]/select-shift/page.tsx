import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listDriverShiftsForToday } from "@/app/actions/driver";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SelectShiftPage({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  const { driverId } = await params;

  const driver = await prisma.driver.findUnique({ where: { uid: driverId } });
  if (!driver) notFound();

  const shifts = await listDriverShiftsForToday(driverId);

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-sm text-white/60">Welcome,</p>
        <h1 className="text-2xl font-bold">{driver.displayName}</h1>
        <p className="text-sm text-white/60 mt-1">{formatDate(new Date())}</p>
      </div>

      <h2 className="text-sm uppercase tracking-wider text-white/60 mb-3">
        Your shifts today
      </h2>

      {shifts.length === 0 ? (
        <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center text-white/70">
          No shifts scheduled for you today.
        </div>
      ) : (
        <div className="space-y-3">
          {shifts.map((s) => {
            const tripLegs = s.Trip.TripLegs;
            const firstLeg = tripLegs[0];
            const lastLeg = tripLegs[tripLegs.length - 1];

            const departureTime = firstLeg
              ? formatTime(firstLeg.departAt)
              : "TBD";
            const origin = firstLeg?.LegTemplate.FromStop.name ?? "TBD";
            const destination = lastLeg?.LegTemplate.ToStop.name ?? "TBD";

            const booked = tripLegs.length
              ? Math.max(...tripLegs.map((l) => l.seatsBooked))
              : 0;

            return (
              <Link
                key={s.id}
                href={`/terminal/${driverId}/shift/${s.id}`}
                className="block rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold tabular-nums">
                    {departureTime}
                  </div>
                  <span
                    className={
                      "text-xs font-semibold rounded-full px-2 py-1 " +
                      (s.status === "EN_ROUTE"
                        ? "bg-brand-success/20 text-emerald-300"
                        : s.status === "COMPLETED"
                          ? "bg-white/10 text-white/60"
                          : "bg-brand-blue/20 text-sky-300")
                    }
                  >
                    {s.status}
                  </span>
                </div>
                <div className="mt-2 text-sm">
                  {origin} → {destination}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-white/60">
                  <span>Vehicle {s.Vehicle.code}</span>
                  <span className="tabular-nums">
                    {booked}/{s.Vehicle.seatCapacity} seats
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/terminal"
          className="text-sm text-white/50 hover:text-white"
        >
          ← Sign out
        </Link>
      </div>
    </div>
  );
}
