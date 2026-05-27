import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DriverShiftConsole } from "@/components/driver/driver-shift-console";
import { formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DriverShiftPage({
  params,
}: {
  params: Promise<{ driverId: string; shiftId: string }>;
}) {
  const { driverId, shiftId } = await params;

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
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
            include: {
              Booking: {
                select: {
                  id: true,
                  guestFirstName: true,
                  guestLastName: true,
                  guestEmail: true,
                  Passenger: {
                    include: { User: { select: { name: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!shift || shift.driverId !== driverId) notFound();

  const tripLegs = shift.Trip.TripLegs;
  const firstLeg = tripLegs[0];
  const lastLeg = tripLegs[tripLegs.length - 1];

  // Flatten unique passengers across this shift's BookingLegs. A single
  // multi-leg booking on this shift collapses to one console row so the
  // driver doesn't see the same passenger twice.
  const passengerRows = new Map<
    string,
    { id: string; passengerName: string; seatCount: number; boardedStatus: string }
  >();
  for (const tl of shift.TripLegs) {
    for (const bl of tl.BookingLegs) {
      const b = bl.Booking;
      const name =
        b.Passenger?.User?.name ??
        [b.guestFirstName, b.guestLastName].filter(Boolean).join(" ") ??
        b.guestEmail ??
        "Passenger";
      const existing = passengerRows.get(b.id);
      if (!existing) {
        passengerRows.set(b.id, {
          id: b.id,
          passengerName: name,
          seatCount: bl.passengers,
          boardedStatus: bl.boardedStatus,
        });
      } else if (bl.boardedStatus === "BOARDED") {
        // Boarded on any leg of this shift => mark boarded in the console
        existing.boardedStatus = "BOARDED";
      }
    }
  }

  return (
    <DriverShiftConsole
      shift={{
        id: shift.id,
        status: shift.status,
        departureTime: firstLeg ? formatTime(firstLeg.departAt) : "TBD",
        arrivalTime: lastLeg ? formatTime(lastLeg.arriveAt) : "TBD",
        origin: firstLeg?.LegTemplate.FromStop.name ?? "TBD",
        destination: lastLeg?.LegTemplate.ToStop.name ?? "TBD",
        vehiclePlate: shift.Vehicle.plateNumber,
        vehicleCapacity: shift.Vehicle.seatCapacity,
        driverName: shift.Driver.displayName,
      }}
      bookings={Array.from(passengerRows.values())}
    />
  );
}
