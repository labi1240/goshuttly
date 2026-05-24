"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";

const telemetrySchema = z.object({
  shiftId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export async function pushTelemetry(input: z.infer<typeof telemetrySchema>) {
  const parsed = telemetrySchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Invalid telemetry" };

  await prisma.shift.update({
    where: { id: parsed.data.shiftId },
    data: {
      lat: parsed.data.lat,
      lng: parsed.data.lng,
    },
  });

  return { success: true as const };
}

export async function setShiftStatus(
  shiftId: string,
  status: "SCHEDULED" | "EN_ROUTE" | "COMPLETED" | "CANCELLED",
) {
  await prisma.shift.update({
    where: { id: shiftId },
    data: { status },
  });
  return { success: true as const };
}
