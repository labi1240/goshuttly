"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/utils";

export type ShiftSearchResult = {
  id: string;
  date: Date;
  status: string;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  basePrice: number;
  operatorName: string;
  vehicleLabel: string;
  capacity: number;
  bookedSeats: number;
  seatsAvailable: number;
};

export async function searchShifts(params: {
  origin: string;
  destination: string;
  date: Date;
}): Promise<ShiftSearchResult[]> {
  const shifts = await prisma.shift.findMany({
    where: {
      date: {
        gte: startOfDay(params.date),
        lte: endOfDay(params.date),
      },
      status: { in: ["SCHEDULED", "EN_ROUTE"] },
      trip: {
        route: {
          origin: { contains: params.origin, mode: "insensitive" },
          destination: { contains: params.destination, mode: "insensitive" },
        },
      },
    },
    include: {
      vehicle: true,
      trip: { include: { route: { include: { operator: true } } } },
      bookings: { select: { seatCount: true } },
    },
    orderBy: { date: "asc" },
  });

  return shifts.map((s) => {
    const booked = s.bookings.reduce((sum, b) => sum + b.seatCount, 0);
    return {
      id: s.id,
      date: s.date,
      status: s.status,
      departureTime: s.trip.departureTime,
      arrivalTime: s.trip.arrivalTime,
      origin: s.trip.route.origin,
      destination: s.trip.route.destination,
      basePrice: s.trip.route.basePrice,
      operatorName: s.trip.route.operator.businessName,
      vehicleLabel: `${s.vehicle.makeModel} · ${s.vehicle.plateNumber}`,
      capacity: s.vehicle.capacity,
      bookedSeats: booked,
      seatsAvailable: s.vehicle.capacity - booked,
    };
  });
}
