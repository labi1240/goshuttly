"use server";

import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/utils";

// SHA-256 of the PIN with an optional pepper. The schema's @unique
// constraint on Driver.driverPinHash enforces no duplicates across
// drivers, so callers cannot guess a PIN that another driver claimed.
// TODO: add a per-driver salt once driver onboarding is built out;
// PIN-only auth on a 4-6 digit space is inherently low-entropy.
function hashPin(pin: string): string {
  const pepper = process.env.DRIVER_PIN_PEPPER ?? "";
  return createHash("sha256").update(pin + pepper).digest("hex");
}

export async function resolveDriverShifts(pin: string) {
  if (!pin || pin.length < 4) {
    return { success: false as const, error: "PIN must be at least 4 digits." };
  }

  const driver = await prisma.driver.findUnique({
    where: { driverPinHash: hashPin(pin) },
  });

  if (!driver) {
    return { success: false as const, error: "PIN not recognized." };
  }

  return { success: true as const, driverId: driver.uid };
}

export async function listDriverShiftsForToday(driverId: string) {
  const today = new Date();
  const shifts = await prisma.shift.findMany({
    where: {
      driverId,
      Trip: {
        serviceDate: { gte: startOfDay(today), lte: endOfDay(today) },
      },
    },
    include: {
      Vehicle: true,
      Trip: {
        include: {
          Template: {
            include: { Route: true },
          },
          TripLegs: {
            include: {
              LegTemplate: {
                include: {
                  FromStop: true,
                  ToStop: true,
                },
              },
            },
            orderBy: { departAt: "asc" },
          },
        },
      },
    },
  });

  return shifts.sort((a, b) => {
    const aTime = a.Trip.TripLegs[0]?.departAt?.getTime() ?? 0;
    const bTime = b.Trip.TripLegs[0]?.departAt?.getTime() ?? 0;
    return aTime - bTime;
  });
}
