-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('REQUIRES_PAYMENT', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."RouteKind" AS ENUM ('SUNRISE_EXPRESS', 'DAYTIME_CIRCUIT', 'EVENING_RETURN');

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT,
    "guestEmail" TEXT,
    "guestFirstName" TEXT,
    "guestLastName" TEXT,
    "guestPhone" TEXT,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "holdExpiresAt" TIMESTAMP(3),
    "subtotalCents" INTEGER NOT NULL,
    "gstCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingLeg" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tripLegId" TEXT NOT NULL,
    "passengers" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,

    CONSTRAINT "BookingLeg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LegTemplate" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "fromStopId" TEXT NOT NULL,
    "toStopId" TEXT NOT NULL,
    "departMin" INTEGER NOT NULL,
    "arriveMin" INTEGER NOT NULL,
    "bookable" BOOLEAN NOT NULL DEFAULT true,
    "priceCents" INTEGER NOT NULL,

    CONSTRAINT "LegTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "amountSubtotalCents" INTEGER NOT NULL,
    "gstCents" INTEGER NOT NULL,
    "amountTotalCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Route" (
    "id" TEXT NOT NULL,
    "kind" "public"."RouteKind" NOT NULL,
    "displayName" TEXT NOT NULL,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduleTemplate" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeUntil" TIMESTAMP(3),

    CONSTRAINT "ScheduleTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Stop" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "Stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Trip" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "serviceDate" DATE NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TripLeg" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "legTemplateId" TEXT NOT NULL,
    "departAt" TIMESTAMP(3) NOT NULL,
    "arriveAt" TIMESTAMP(3) NOT NULL,
    "seatsTotal" INTEGER NOT NULL DEFAULT 25,
    "seatsBooked" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TripLeg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vehicle" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "seatCapacity" INTEGER NOT NULL DEFAULT 25,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "public"."Booking"("reference" ASC);

-- CreateIndex
CREATE INDEX "Booking_status_holdExpiresAt_idx" ON "public"."Booking"("status" ASC, "holdExpiresAt" ASC);

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "public"."Booking"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BookingLeg_bookingId_tripLegId_key" ON "public"."BookingLeg"("bookingId" ASC, "tripLegId" ASC);

-- CreateIndex
CREATE INDEX "BookingLeg_tripLegId_idx" ON "public"."BookingLeg"("tripLegId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "public"."Payment"("bookingId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeCheckoutSessionId_key" ON "public"."Payment"("stripeCheckoutSessionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "public"."Payment"("stripePaymentIntentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Route_kind_key" ON "public"."Route"("kind" ASC);

-- CreateIndex
CREATE INDEX "ScheduleTemplate_routeId_sortOrder_idx" ON "public"."ScheduleTemplate"("routeId" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Stop_code_key" ON "public"."Stop"("code" ASC);

-- CreateIndex
CREATE INDEX "Trip_serviceDate_idx" ON "public"."Trip"("serviceDate" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Trip_templateId_serviceDate_key" ON "public"."Trip"("templateId" ASC, "serviceDate" ASC);

-- CreateIndex
CREATE INDEX "TripLeg_departAt_idx" ON "public"."TripLeg"("departAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TripLeg_tripId_legTemplateId_key" ON "public"."TripLeg"("tripId" ASC, "legTemplateId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "public"."User"("clerkUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_code_key" ON "public"."Vehicle"("code" ASC);

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingLeg" ADD CONSTRAINT "BookingLeg_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingLeg" ADD CONSTRAINT "BookingLeg_tripLegId_fkey" FOREIGN KEY ("tripLegId") REFERENCES "public"."TripLeg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegTemplate" ADD CONSTRAINT "LegTemplate_fromStopId_fkey" FOREIGN KEY ("fromStopId") REFERENCES "public"."Stop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegTemplate" ADD CONSTRAINT "LegTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ScheduleTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LegTemplate" ADD CONSTRAINT "LegTemplate_toStopId_fkey" FOREIGN KEY ("toStopId") REFERENCES "public"."Stop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "public"."Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleTemplate" ADD CONSTRAINT "ScheduleTemplate_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "public"."Route"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Trip" ADD CONSTRAINT "Trip_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ScheduleTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TripLeg" ADD CONSTRAINT "TripLeg_legTemplateId_fkey" FOREIGN KEY ("legTemplateId") REFERENCES "public"."LegTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TripLeg" ADD CONSTRAINT "TripLeg_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "public"."Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

