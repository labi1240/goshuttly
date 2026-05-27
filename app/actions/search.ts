"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/utils";

export type LegSearchResult = {
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

function hhmm(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export async function searchLegs(params: {
  origin: string;
  destination: string;
  date: Date;
}): Promise<LegSearchResult[]> {
  const legs = await prisma.tripLeg.findMany({
    where: {
      departAt: {
        gte: startOfDay(params.date),
        lte: endOfDay(params.date),
      },
      LegTemplate: {
        bookable: true,
        fromStop: {
          name: { contains: params.origin, mode: "insensitive" },
        },
        toStop: {
          name: { contains: params.destination, mode: "insensitive" },
        },
      },
      Trip: {
        shift: {
          status: { in: ["SCHEDULED", "EN_ROUTE"] },
        },
      },
    },
    include: {
      LegTemplate: {
        include: {
          fromStop: true,
          toStop: true,
        },
      },
      Trip: {
        include: {
          ScheduleTemplate: {
            include: {
              Route: { include: { operator: true } },
            },
          },
          shift: { include: { vehicle: true } },
        },
      },
    },
    orderBy: { departAt: "asc" },
  });

  return legs.map((leg) => {
    const route = leg.Trip.ScheduleTemplate.Route;
    const shift = leg.Trip.shift;
    const fromStop = leg.LegTemplate.fromStop;
    const toStop = leg.LegTemplate.toStop;
    const booked = leg.seatsBooked;

    return {
      id: leg.id,
      date: leg.Trip.serviceDate,
      status: shift?.status ?? "SCHEDULED",
      departureTime: hhmm(leg.departAt),
      arrivalTime: hhmm(leg.arriveAt),
      origin: fromStop.name,
      destination: toStop.name,
      basePrice: leg.LegTemplate.priceCents / 100,
      operatorName: route.operator?.businessName ?? route.displayName,
      vehicleLabel: shift?.vehicle.code ?? "TBD",
      capacity: leg.seatsTotal,
      bookedSeats: booked,
      seatsAvailable: Math.max(leg.seatsTotal - booked, 0),
    };
  });
}
