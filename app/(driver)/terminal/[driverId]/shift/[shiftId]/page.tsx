import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DriverShiftConsole } from "@/components/driver/driver-shift-console";

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
      vehicle: true,
      driver: true,
      trip: { include: { route: true } },
      bookings: true,
    },
  });

  if (!shift || shift.driverId !== driverId) notFound();

  return (
    <DriverShiftConsole
      shift={{
        id: shift.id,
        status: shift.status,
        departureTime: shift.trip.departureTime,
        arrivalTime: shift.trip.arrivalTime,
        origin: shift.trip.route.origin,
        destination: shift.trip.route.destination,
        vehiclePlate: shift.vehicle.plateNumber,
        vehicleCapacity: shift.vehicle.capacity,
        driverName: shift.driver.name,
      }}
      bookings={shift.bookings.map((b) => ({
        id: b.id,
        passengerName: b.passengerName,
        seatCount: b.seatCount,
        boardedStatus: b.boardedStatus,
      }))}
    />
  );
}
