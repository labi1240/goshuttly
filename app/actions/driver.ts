"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/utils";

export async function resolveDriverShifts(pin: string) {
  if (!pin || pin.length < 4) {
    return { success: false as const, error: "PIN must be at least 4 digits." };
  }

  const driver = await prisma.driver.findUnique({
    where: { driverPin: pin },
  });

  if (!driver) {
    return { success: false as const, error: "PIN not recognized." };
  }

  return { success: true as const, driverId: driver.id };
}

export async function listDriverShiftsForToday(driverId: string) {
  const today = new Date();
  const shifts = await prisma.shift.findMany({
    where: {
      driverId,
      trip: {
        serviceDate: { gte: startOfDay(today), lte: endOfDay(today) },
      },
    },
    include: {
      vehicle: true,
      trip: {
        include: {
          ScheduleTemplate: {
            include: {
              Route: true,
            },
          },
          TripLeg: {
            include: {
              LegTemplate: {
                include: {
                  fromStop: true,
                  toStop: true,
                },
              },
            },
            orderBy: {
              departAt: "asc",
            },
          },
        },
      },
    },
  });

  // Sort by earliest leg's departure time in memory
  return shifts.sort((a, b) => {
    const aTime = a.trip.TripLeg[0]?.departAt?.getTime() ?? 0;
    const bTime = b.trip.TripLeg[0]?.departAt?.getTime() ?? 0;
    return aTime - bTime;
  });
}

