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
        FromStop: {
          name: { contains: params.origin, mode: "insensitive" },
        },
        ToStop: {
          name: { contains: params.destination, mode: "insensitive" },
        },
      },
      Trip: {
        status: { in: ["SCHEDULED", "BOARDING"] },
      },
    },
    include: {
      LegTemplate: {
        include: {
          FromStop: true,
          ToStop: true,
        },
      },
      Trip: {
        include: {
          Template: {
            include: {
              Route: { include: { Company: true } },
            },
          },
          Shifts: {
            include: { Vehicle: true },
            take: 1,
          },
        },
      },
      Shift: { include: { Vehicle: true } },
    },
    orderBy: { departAt: "asc" },
  });

  return legs.map((leg) => {
    const route = leg.Trip.Template.Route;
    // Prefer the Shift directly assigned to this leg; otherwise fall back
    // to the first Shift on the parent Trip (covers single-shift trips
    // before per-leg assignment is recorded).
    const shift = leg.Shift ?? leg.Trip.Shifts[0] ?? null;
    const fromStop = leg.LegTemplate.FromStop;
    const toStop = leg.LegTemplate.ToStop;
    const booked = leg.seatsBooked;

    return {
      id: leg.id,
      date: leg.Trip.serviceDate,
      status: leg.Trip.status,
      departureTime: hhmm(leg.departAt),
      arrivalTime: hhmm(leg.arriveAt),
      origin: fromStop.name,
      destination: toStop.name,
      basePrice: leg.LegTemplate.priceCents / 100,
      operatorName: route.Company.displayName,
      vehicleLabel: shift?.Vehicle.code ?? "TBD",
      capacity: leg.seatsTotal,
      bookedSeats: booked,
      seatsAvailable: Math.max(leg.seatsTotal - booked, 0),
    };
  });
}
