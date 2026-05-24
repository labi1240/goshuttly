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
  return prisma.shift.findMany({
    where: {
      driverId,
      date: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    include: {
      vehicle: true,
      trip: { include: { route: true } },
      bookings: { select: { seatCount: true, boardedStatus: true } },
    },
    orderBy: { date: "asc" },
  });
}
