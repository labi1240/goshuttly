import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.booking.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.route.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.operator.deleteMany();

  // 1. Create Operator
  const operator = await prisma.operator.create({
    data: {
      businessName: "GoShuttly Operators",
      email: "ops@goshuttly.com",
      phone: "+1 (403) 555-0199",
    },
  });

  // 2. Create Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      operatorId: operator.id,
      plateNumber: "SHUTTL-1",
      makeModel: "Ford Transit Blue",
      capacity: 14,
    },
  });

  const vehicle2 = await prisma.vehicle.create({
    data: {
      operatorId: operator.id,
      plateNumber: "SHUTTL-2",
      makeModel: "Mercedes Sprinter Premium",
      capacity: 20,
    },
  });

  // 3. Create Drivers
  const driver1 = await prisma.driver.create({
    data: {
      operatorId: operator.id,
      driverPin: "1234",
      name: "Bob Miller",
      phone: "+1 (403) 555-0101",
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      operatorId: operator.id,
      driverPin: "5678",
      name: "Alice Smith",
      phone: "+1 (403) 555-0102",
    },
  });

  // 4. Create Routes
  const routeSamsonToLouise = await prisma.route.create({
    data: {
      operatorId: operator.id,
      origin: "Samson Mall",
      destination: "Lake Louise",
      basePrice: 10.00,
    },
  });

  const routeLouiseToMoraine = await prisma.route.create({
    data: {
      operatorId: operator.id,
      origin: "Lake Louise",
      destination: "Moraine Lake",
      basePrice: 15.00,
    },
  });

  const routeSamsonToMoraine = await prisma.route.create({
    data: {
      operatorId: operator.id,
      origin: "Samson Mall",
      destination: "Moraine Lake",
      basePrice: 20.00,
    },
  });

  // 5. Create Trips (Scheduled departure & arrival times)
  const tripSamsonToLouiseAM = await prisma.trip.create({
    data: {
      routeId: routeSamsonToLouise.id,
      departureTime: "08:00",
      arrivalTime: "08:30",
    },
  });

  const tripSamsonToLouisePM = await prisma.trip.create({
    data: {
      routeId: routeSamsonToLouise.id,
      departureTime: "13:00",
      arrivalTime: "13:30",
    },
  });

  const tripLouiseToMoraineSunrise = await prisma.trip.create({
    data: {
      routeId: routeLouiseToMoraine.id,
      departureTime: "04:30", // Sunrise Express
      arrivalTime: "05:15",
    },
  });

  const tripLouiseToMoraineMidday = await prisma.trip.create({
    data: {
      routeId: routeLouiseToMoraine.id,
      departureTime: "11:00",
      arrivalTime: "11:45",
    },
  });

  const tripSamsonToMoraineMorning = await prisma.trip.create({
    data: {
      routeId: routeSamsonToMoraine.id,
      departureTime: "09:00",
      arrivalTime: "10:00",
    },
  });

  // 6. Create Shifts for Today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Shift 1: Samson to Louise Morning
  await prisma.shift.create({
    data: {
      vehicleId: vehicle1.id,
      driverId: driver1.id,
      tripId: tripSamsonToLouiseAM.id,
      date: today,
      status: "SCHEDULED",
    },
  });

  // Shift 2: Louise to Moraine Sunrise Express (Alice driving the Mercedes Sprinter)
  await prisma.shift.create({
    data: {
      vehicleId: vehicle2.id,
      driverId: driver2.id,
      tripId: tripLouiseToMoraineSunrise.id,
      date: today,
      status: "SCHEDULED",
    },
  });

  // Shift 3: Louise to Moraine Midday
  await prisma.shift.create({
    data: {
      vehicleId: vehicle1.id,
      driverId: driver1.id,
      tripId: tripLouiseToMoraineMidday.id,
      date: today,
      status: "SCHEDULED",
    },
  });

  // Shift 4: Samson to Moraine Morning
  await prisma.shift.create({
    data: {
      vehicleId: vehicle2.id,
      driverId: driver2.id,
      tripId: tripSamsonToMoraineMorning.id,
      date: today,
      status: "SCHEDULED",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
