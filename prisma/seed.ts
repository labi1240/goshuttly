import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";

const prisma = new PrismaClient();

// Alberta is MDT (UTC-6) in May. Hard-coded for seed simplicity; production
// trip generation should derive offset from fromStop.timezone via Intl APIs.
const ALBERTA_OFFSET = "-06:00";

function toUtc(dateYmd: string, minutesFromMidnight: number): Date {
  const hh = String(Math.floor(minutesFromMidnight / 60)).padStart(2, "0");
  const mm = String(minutesFromMidnight % 60).padStart(2, "0");
  return new Date(`${dateYmd}T${hh}:${mm}:00${ALBERTA_OFFSET}`);
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

async function main() {
  console.log("Seeding database (v3 leg-based schema)...");

  // Wipe everything in FK-safe order. Single TRUNCATE CASCADE keeps it simple.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "BookingAccessToken", "NotificationLog", "BookingTimeline",
      "Refund", "Payment", "BookingLeg", "Booking",
      "LocationPing", "Shift", "TripLeg", "Trip",
      "LegTemplate", "ScheduleTemplate", "Route", "Stop",
      "ComplianceDocument", "VehicleVerification", "DriverVerification",
      "CompanyVerification", "Vehicle", "Payout", "ApiKey",
      "Address", "Driver", "Operator", "Passenger", "Admin",
      "DeviceToken", "Credentials", "AuthProvider", "User",
      "ShuttleCompany", "StripeWebhookEvent", "Review"
    RESTART IDENTITY CASCADE
  `);

  // ── Company ──────────────────────────────────────────────────────────────
  const company = await prisma.shuttleCompany.create({
    data: {
      displayName: "Banff Shuttle Co",
      description: "Daily shuttles between Lake Louise village and Moraine Lake.",
      legalName: "Banff Shuttle Co Ltd.",
      businessNumber: "123456789RT0001",
      gstHstNumber: "123456789RT0001",
      platformFeeBps: 500,
      refundFullHoursBefore: 24,
      refundPartialHoursBefore: 2,
      refundPartialPercent: 50,
      HeadOfficeAddress: {
        create: {
          address: "101 Samson Mall",
          city: "Lake Louise",
          province: "AB",
          postalCode: "T0L 1E0",
          country: "CA",
          lat: 51.4254,
          lng: -116.1773,
        },
      },
    },
  });

  // ── Users + roles ────────────────────────────────────────────────────────
  await prisma.user.create({
    data: {
      email: "sam@example.com",
      name: "Sam Operator",
      phoneNumber: "+14035550199",
      Operator: {
        create: {
          displayName: "Sam Operator",
          role: "OWNER",
          companyId: company.id,
        },
      },
    },
  });

  const driver1 = await prisma.user.create({
    data: {
      email: "bob.miller@example.com",
      name: "Bob Miller",
      phoneNumber: "+14035550101",
      Driver: {
        create: {
          displayName: "Bob Miller",
          driverPinHash: sha256("1234"),
          licenceNumber: "AB-1122334",
          licenceClass: "CLASS_4",
          licenceProvince: "AB",
          licenceExpiry: new Date("2028-12-31"),
          companyId: company.id,
        },
      },
    },
    include: { Driver: true },
  });

  const driver2 = await prisma.user.create({
    data: {
      email: "alice.smith@example.com",
      name: "Alice Smith",
      phoneNumber: "+14035550102",
      Driver: {
        create: {
          displayName: "Alice Smith",
          driverPinHash: sha256("5678"),
          licenceNumber: "AB-9988776",
          licenceClass: "CLASS_4",
          licenceProvince: "AB",
          licenceExpiry: new Date("2027-06-30"),
          companyId: company.id,
        },
      },
    },
    include: { Driver: true },
  });

  await prisma.user.create({
    data: {
      email: "jane.passenger@example.com",
      name: "Jane Passenger",
      phoneNumber: "+14035550999",
      Passenger: {
        create: {
          displayName: "Pat Passenger",
        },
      },
    },
  });

  // ── Vehicles ─────────────────────────────────────────────────────────────
  const vehicle1 = await prisma.vehicle.create({
    data: {
      code: "VAN-001",
      make: "Ford",
      modelName: "Transit 350",
      year: 2024,
      colour: "Blue",
      plateNumber: "AB-SHTL01",
      seatCapacity: 14,
      type: "SHUTTLE_VAN",
      companyId: company.id,
      insuranceExpiry: new Date("2027-01-31"),
      inspectionExpiry: new Date("2026-12-15"),
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      code: "VAN-002",
      make: "Mercedes-Benz",
      modelName: "Sprinter 2500",
      year: 2025,
      colour: "Silver",
      plateNumber: "AB-SHTL02",
      seatCapacity: 20,
      type: "MINI_BUS",
      companyId: company.id,
      insuranceExpiry: new Date("2027-04-30"),
      inspectionExpiry: new Date("2026-11-20"),
    },
  });

  // ── Stops ────────────────────────────────────────────────────────────────
  const samson = await prisma.stop.create({
    data: {
      code: "LL-SAMSON",
      name: "Samson Mall",
      address: "101 Village Rd",
      city: "Lake Louise",
      province: "AB",
      postalCode: "T0L 1E0",
      lat: 51.4254,
      lng: -116.1773,
      timezone: "America/Edmonton",
    },
  });

  const lakeLouise = await prisma.stop.create({
    data: {
      code: "LL-LAKESHORE",
      name: "Lake Louise Lakeshore",
      address: "111 Lake Louise Dr",
      city: "Lake Louise",
      province: "AB",
      postalCode: "T0L 1E0",
      lat: 51.4150,
      lng: -116.2179,
      timezone: "America/Edmonton",
    },
  });

  const moraine = await prisma.stop.create({
    data: {
      code: "MORAINE",
      name: "Moraine Lake",
      address: "Moraine Lake Rd",
      city: "Lake Louise",
      province: "AB",
      postalCode: "T0L 1E0",
      lat: 51.3217,
      lng: -116.1860,
      timezone: "America/Edmonton",
    },
  });

  // ── Routes ───────────────────────────────────────────────────────────────
  const standardRoute = await prisma.route.create({
    data: {
      displayName: "Lake Louise Daily Loop",
      description: "Samson Mall → Lake Louise Lakeshore → Moraine Lake.",
      isPremium: false,
      companyId: company.id,
    },
  });

  const sunriseRoute = await prisma.route.create({
    data: {
      displayName: "Sunrise Express to Moraine Lake",
      description: "Direct pre-dawn departure to catch sunrise at Moraine Lake.",
      isPremium: true,
      companyId: company.id,
    },
  });

  // ── Schedule templates + leg templates ───────────────────────────────────
  // Standard morning loop: 08:00 Samson → 08:15 Lakeshore → 08:45 Moraine
  const morningTpl = await prisma.scheduleTemplate.create({
    data: {
      label: "Morning Loop 08:00",
      sortOrder: 10,
      routeId: standardRoute.id,
      LegTemplates: {
        create: [
          {
            sequence: 0,
            departMin: 8 * 60,
            arriveMin: 8 * 60 + 15,
            priceCents: 1000, // $10 leg
            fromStopId: samson.id,
            toStopId: lakeLouise.id,
          },
          {
            sequence: 1,
            departMin: 8 * 60 + 20,
            arriveMin: 8 * 60 + 45,
            priceCents: 1500, // $15 leg
            fromStopId: lakeLouise.id,
            toStopId: moraine.id,
          },
        ],
      },
    },
    include: { LegTemplates: true },
  });

  // Midday loop: 11:00 Samson → 11:15 Lakeshore → 11:45 Moraine
  const middayTpl = await prisma.scheduleTemplate.create({
    data: {
      label: "Midday Loop 11:00",
      sortOrder: 20,
      routeId: standardRoute.id,
      LegTemplates: {
        create: [
          {
            sequence: 0,
            departMin: 11 * 60,
            arriveMin: 11 * 60 + 15,
            priceCents: 1000,
            fromStopId: samson.id,
            toStopId: lakeLouise.id,
          },
          {
            sequence: 1,
            departMin: 11 * 60 + 20,
            arriveMin: 11 * 60 + 45,
            priceCents: 1500,
            fromStopId: lakeLouise.id,
            toStopId: moraine.id,
          },
        ],
      },
    },
    include: { LegTemplates: true },
  });

  // Sunrise Express: 04:30 Samson → 05:15 Moraine (direct, premium)
  const sunriseTpl = await prisma.scheduleTemplate.create({
    data: {
      label: "Sunrise Express 04:30",
      sortOrder: 1,
      routeId: sunriseRoute.id,
      LegTemplates: {
        create: [
          {
            sequence: 0,
            departMin: 4 * 60 + 30,
            arriveMin: 5 * 60 + 15,
            priceCents: 3500, // $35 premium direct
            fromStopId: samson.id,
            toStopId: moraine.id,
          },
        ],
      },
    },
    include: { LegTemplates: true },
  });

  // ── Trips + trip legs + shifts for today + next 6 days ───────────────────
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const allTemplates = [morningTpl, middayTpl, sunriseTpl];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() + dayOffset);
    const dateYmd = ymd(date);

    for (const tpl of allTemplates) {
      const trip = await prisma.trip.create({
        data: {
          serviceDate: date,
          templateId: tpl.id,
          TripLegs: {
            create: tpl.LegTemplates.map((lt) => ({
              legTemplateId: lt.id,
              departAt: toUtc(dateYmd, lt.departMin),
              arriveAt: toUtc(dateYmd, lt.arriveMin),
              seatsTotal: tpl.id === sunriseTpl.id ? vehicle2.seatCapacity : vehicle1.seatCapacity,
            })),
          },
        },
        include: { TripLegs: true },
      });

      // Sunrise runs on the bigger Mercedes with Alice; standard loops on the
      // Ford with Bob. Real ops would round-robin; this is just visible test data.
      const isPremium = tpl.id === sunriseTpl.id;
      const shift = await prisma.shift.create({
        data: {
          tripId: trip.id,
          vehicleId: isPremium ? vehicle2.id : vehicle1.id,
          driverId: isPremium ? driver2.Driver!.uid : driver1.Driver!.uid,
        },
      });

      // Attach every leg of the trip to that shift (single-shift trip).
      await prisma.tripLeg.updateMany({
        where: { tripId: trip.id },
        data: { shiftId: shift.id },
      });
    }
  }

  // ── Stripe webhook idempotency dummy (keeps table non-empty for tests) ──
  await prisma.stripeWebhookEvent.create({
    data: {
      stripeEventId: `evt_seed_${randomUUID()}`,
      eventType: "checkout.session.completed",
      payload: { seed: true } as object,
      processed: true,
      processedAt: new Date(),
    },
  });

  console.log("Seed complete.");
  console.log(`  Company:   ${company.displayName} (${company.id})`);
  console.log(`  Stops:     ${samson.code}, ${lakeLouise.code}, ${moraine.code}`);
  console.log(`  Routes:    2 (1 standard, 1 premium)`);
  console.log(`  Templates: 3 (morning loop, midday loop, sunrise express)`);
  console.log(`  Trips:     ${3 * 7} (3 templates × 7 days)`);
  console.log(`  Drivers:   Bob (PIN 1234), Alice (PIN 5678)`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
