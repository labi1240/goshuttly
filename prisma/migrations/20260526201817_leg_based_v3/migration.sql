-- CreateEnum
CREATE TYPE "AuthProviderType" AS ENUM ('GOOGLE', 'APPLE', 'CLERK', 'CREDENTIALS');

-- CreateEnum
CREATE TYPE "OperatorRole" AS ENUM ('OWNER', 'MANAGER', 'DISPATCHER', 'FINANCE');

-- CreateEnum
CREATE TYPE "StripeAccountType" AS ENUM ('EXPRESS', 'STANDARD', 'CUSTOM');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('SHUTTLE_VAN', 'MINI_BUS', 'COACH_BUS', 'SUV', 'SEDAN');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED');

-- CreateEnum
CREATE TYPE "ComplianceType" AS ENUM ('PTC_LICENCE', 'MUNICIPAL_LIVERY_PERMIT', 'AIRPORT_AUTHORITY_PERMIT', 'PROVINCIAL_OPERATING_LICENCE', 'VEHICLE_INSURANCE', 'VEHICLE_INSPECTION', 'COMMERCIAL_VEHICLE_PERMIT', 'DRIVER_ABSTRACT', 'DRIVER_BACKGROUND_CHECK', 'DRIVER_MEDICAL', 'WSIB_CLEARANCE', 'GST_HST_REGISTRATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketTier" AS ENUM ('ECONOMY_FLEX_WINDOW', 'STANDARD', 'REFUNDABLE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'INTERAC', 'PAYPAL', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'INTERAC_ETRANSFER', 'APPLE_PAY', 'GOOGLE_PAY', 'CASH');

-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('OPERATOR_CANCELLED', 'PASSENGER_CANCELLED_FREE_WINDOW', 'PASSENGER_CANCELLED_PARTIAL', 'PASSENGER_CANCELLED_LATE', 'SERVICE_FAILURE', 'DUPLICATE_CHARGE', 'FRAUD', 'DISPUTE_LOST', 'GOODWILL');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'PAID', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('IOS', 'ANDROID', 'WEB');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED');

-- CreateEnum
CREATE TYPE "AccessTokenPurpose" AS ENUM ('GUEST_VIEW', 'REFUND_CONFIRM', 'SMS_RESEND', 'DRIVER_OVERRIDE');

-- CreateEnum
CREATE TYPE "Province" AS ENUM ('AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT');

-- CreateEnum
CREATE TYPE "LicenceClass" AS ENUM ('CLASS_1', 'CLASS_2', 'CLASS_3', 'CLASS_4', 'CLASS_5', 'CLASS_6');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'BOARDED';
ALTER TYPE "BookingStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "BookingStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "BookingStatus" ADD VALUE 'NO_SHOW';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_REFUNDED';

-- DropForeignKey
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_operatorId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- DropForeignKey
ALTER TABLE "BookingLeg" DROP CONSTRAINT "BookingLeg_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_operatorId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Route" DROP CONSTRAINT "Route_operatorId_fkey";

-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Shift" DROP CONSTRAINT "Shift_operatorId_fkey";

-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_operatorId_fkey";

-- DropIndex
DROP INDEX "Admin_clerkUserId_key";

-- DropIndex
DROP INDEX "Admin_email_key";

-- DropIndex
DROP INDEX "Admin_operatorId_idx";

-- DropIndex
DROP INDEX "Booking_userId_idx";

-- DropIndex
DROP INDEX "Driver_driverPin_key";

-- DropIndex
DROP INDEX "Driver_operatorId_idx";

-- DropIndex
DROP INDEX "Operator_email_key";

-- DropIndex
DROP INDEX "Operator_stripeAccountId_key";

-- DropIndex
DROP INDEX "Route_kind_key";

-- DropIndex
DROP INDEX "Route_operatorId_idx";

-- DropIndex
DROP INDEX "Shift_operatorId_idx";

-- DropIndex
DROP INDEX "Shift_tripId_key";

-- DropIndex
DROP INDEX "User_clerkUserId_key";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "Vehicle_operatorId_idx";

-- AlterTable
ALTER TABLE "Admin" DROP CONSTRAINT "Admin_pkey",
DROP COLUMN "clerkUserId",
DROP COLUMN "email",
DROP COLUMN "id",
DROP COLUMN "name",
DROP COLUMN "operatorId",
DROP COLUMN "role",
ADD COLUMN     "uid" TEXT NOT NULL,
ADD CONSTRAINT "Admin_pkey" PRIMARY KEY ("uid");

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "userId",
ADD COLUMN     "bookingFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "hstCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "passcode" TEXT,
ADD COLUMN     "passengerId" TEXT,
ADD COLUMN     "pstCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qstCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seatsBooked" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "taxExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxExemptionRef" TEXT,
ADD COLUMN     "taxJurisdiction" "Province",
ADD COLUMN     "tier" "TicketTier" NOT NULL DEFAULT 'STANDARD',
ALTER COLUMN "gstCents" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "BookingLeg" ADD COLUMN     "boardedByDriverId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "passengers" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_pkey",
DROP COLUMN "active",
DROP COLUMN "driverPin",
DROP COLUMN "id",
DROP COLUMN "name",
DROP COLUMN "operatorId",
DROP COLUMN "phone",
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "driverPinHash" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "licenceClass" "LicenceClass" NOT NULL DEFAULT 'CLASS_4',
ADD COLUMN     "licenceExpiry" TIMESTAMP(3),
ADD COLUMN     "licenceNumber" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "licenceProvince" "Province",
ADD COLUMN     "uid" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "Driver_pkey" PRIMARY KEY ("uid");

-- AlterTable
ALTER TABLE "LegTemplate" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Operator" DROP CONSTRAINT "Operator_pkey",
DROP COLUMN "active",
DROP COLUMN "businessName",
DROP COLUMN "email",
DROP COLUMN "id",
DROP COLUMN "phone",
DROP COLUMN "stripeAccountId",
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "role" "OperatorRole" NOT NULL DEFAULT 'MANAGER',
ADD COLUMN     "uid" TEXT NOT NULL,
ADD CONSTRAINT "Operator_pkey" PRIMARY KEY ("uid");

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "amountSubtotalCents",
DROP COLUMN "gstCents",
ADD COLUMN     "applicationFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "idempotencyKey" TEXT NOT NULL,
ADD COLUMN     "method" "PaymentMethod",
ADD COLUMN     "operatorNetCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "provider" "PaymentProvider" NOT NULL DEFAULT 'STRIPE',
ADD COLUMN     "stripeChargeId" TEXT,
ADD COLUMN     "stripeDestinationAccount" TEXT,
ADD COLUMN     "stripeFeeCents" INTEGER,
ADD COLUMN     "stripeTransferId" TEXT;

-- AlterTable
ALTER TABLE "Route" DROP COLUMN "kind",
DROP COLUMN "operatorId",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ScheduleTemplate" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "sortOrder" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Shift" DROP COLUMN "operatorId";

-- AlterTable
ALTER TABLE "Stop" DROP COLUMN "notes",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'CA',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "province" "Province" NOT NULL,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Toronto',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "lat" SET NOT NULL,
ALTER COLUMN "lng" SET NOT NULL;

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "TripLeg" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "shiftId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "clerkUserId",
DROP COLUMN "email",
DROP COLUMN "firstName",
DROP COLUMN "id",
DROP COLUMN "lastName",
DROP COLUMN "phone",
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "uid" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("uid");

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "active",
DROP COLUMN "operatorId",
ADD COLUMN     "colour" TEXT,
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "inspectionExpiry" TIMESTAMP(3),
ADD COLUMN     "insuranceExpiry" TIMESTAMP(3),
ADD COLUMN     "make" TEXT NOT NULL,
ADD COLUMN     "modelName" TEXT NOT NULL,
ADD COLUMN     "outOfServiceNote" TEXT,
ADD COLUMN     "outOfServiceUntil" TIMESTAMP(3),
ADD COLUMN     "plateNumber" TEXT NOT NULL,
ADD COLUMN     "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "type" "VehicleType" NOT NULL DEFAULT 'SHUTTLE_VAN',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vin" TEXT,
ADD COLUMN     "year" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "AdminRole";

-- DropEnum
DROP TYPE "RouteKind";

-- CreateTable
CREATE TABLE "Credentials" (
    "uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credentials_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "AuthProvider" (
    "uid" TEXT NOT NULL,
    "type" "AuthProviderType" NOT NULL,
    "externalId" TEXT,

    CONSTRAINT "AuthProvider_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "Passenger" (
    "uid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,

    CONSTRAINT "Passenger_pkey" PRIMARY KEY ("uid")
);

-- CreateTable
CREATE TABLE "ShuttleCompany" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "legalName" TEXT,
    "businessNumber" TEXT,
    "gstHstNumber" TEXT,
    "stripeAccountId" TEXT,
    "stripeAccountType" "StripeAccountType" NOT NULL DEFAULT 'EXPRESS',
    "stripeOnboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stripeRequirementsDue" JSONB,
    "stripeOnboardedAt" TIMESTAMP(3),
    "platformFeeBps" INTEGER NOT NULL DEFAULT 500,
    "refundFullHoursBefore" INTEGER NOT NULL DEFAULT 24,
    "refundPartialHoursBefore" INTEGER NOT NULL DEFAULT 2,
    "refundPartialPercent" INTEGER NOT NULL DEFAULT 50,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ShuttleCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" "Province" NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CA',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceDocument" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "ComplianceType" NOT NULL,
    "issuer" TEXT NOT NULL,
    "documentNumber" TEXT,
    "fileUrl" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "companyId" TEXT,
    "driverId" TEXT,
    "vehicleId" TEXT,

    CONSTRAINT "ComplianceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationPing" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speedKph" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "shiftId" TEXT NOT NULL,

    CONSTRAINT "LocationPing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingTimeline" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "BookingStatus" NOT NULL,
    "note" TEXT,
    "bookingId" TEXT NOT NULL,
    "driverId" TEXT,
    "operatorId" TEXT,

    CONSTRAINT "BookingTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripeRefundId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reason" "RefundReason" NOT NULL,
    "notes" TEXT,
    "reversedTransfer" BOOLEAN NOT NULL DEFAULT false,
    "reversedAmountCents" INTEGER NOT NULL DEFAULT 0,
    "reversedApplicationFeeCents" INTEGER NOT NULL DEFAULT 0,
    "paymentId" TEXT NOT NULL,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stripePayoutId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "arrivalDate" TIMESTAMP(3),
    "failureReason" TEXT,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processingError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT,
    "passengerId" TEXT NOT NULL,
    "tripId" TEXT,
    "companyId" TEXT,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyVerification" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "adminId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "CompanyVerification_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "DriverVerification" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "backgroundCheckPassed" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "adminId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,

    CONSTRAINT "DriverVerification_pkey" PRIMARY KEY ("driverId")
);

-- CreateTable
CREATE TABLE "VehicleVerification" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "rejectionReason" TEXT,
    "adminId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,

    CONSTRAINT "VehicleVerification_pkey" PRIMARY KEY ("vehicleId")
);

-- CreateTable
CREATE TABLE "DeviceToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "DevicePlatform" NOT NULL,
    "appVersion" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "driverId" TEXT,

    CONSTRAINT "DeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" "NotificationChannel" NOT NULL,
    "template" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "providerMessageId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "bookingId" TEXT,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "companyId" TEXT,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAccessToken" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokenHash" TEXT NOT NULL,
    "purpose" "AccessTokenPurpose" NOT NULL DEFAULT 'GUEST_VIEW',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "sentToEmail" TEXT,
    "sentToPhone" TEXT,
    "bookingId" TEXT NOT NULL,

    CONSTRAINT "BookingAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Credentials_email_key" ON "Credentials"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AuthProvider_type_externalId_key" ON "AuthProvider"("type", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ShuttleCompany_businessNumber_key" ON "ShuttleCompany"("businessNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ShuttleCompany_stripeAccountId_key" ON "ShuttleCompany"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Address_companyId_key" ON "Address"("companyId");

-- CreateIndex
CREATE INDEX "ComplianceDocument_companyId_type_idx" ON "ComplianceDocument"("companyId", "type");

-- CreateIndex
CREATE INDEX "ComplianceDocument_driverId_type_idx" ON "ComplianceDocument"("driverId", "type");

-- CreateIndex
CREATE INDEX "ComplianceDocument_vehicleId_type_idx" ON "ComplianceDocument"("vehicleId", "type");

-- CreateIndex
CREATE INDEX "ComplianceDocument_expiresAt_idx" ON "ComplianceDocument"("expiresAt");

-- CreateIndex
CREATE INDEX "LocationPing_shiftId_recordedAt_idx" ON "LocationPing"("shiftId", "recordedAt");

-- CreateIndex
CREATE INDEX "BookingTimeline_bookingId_idx" ON "BookingTimeline"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_stripeRefundId_key" ON "Refund"("stripeRefundId");

-- CreateIndex
CREATE INDEX "Refund_paymentId_idx" ON "Refund"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_stripePayoutId_key" ON "Payout"("stripePayoutId");

-- CreateIndex
CREATE INDEX "Payout_companyId_status_idx" ON "Payout"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_eventType_idx" ON "StripeWebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_processed_idx" ON "StripeWebhookEvent"("processed");

-- CreateIndex
CREATE INDEX "Review_companyId_idx" ON "Review"("companyId");

-- CreateIndex
CREATE INDEX "Review_tripId_idx" ON "Review"("tripId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceToken_token_key" ON "DeviceToken"("token");

-- CreateIndex
CREATE INDEX "DeviceToken_userId_idx" ON "DeviceToken"("userId");

-- CreateIndex
CREATE INDEX "DeviceToken_driverId_idx" ON "DeviceToken"("driverId");

-- CreateIndex
CREATE INDEX "NotificationLog_bookingId_idx" ON "NotificationLog"("bookingId");

-- CreateIndex
CREATE INDEX "NotificationLog_status_idx" ON "NotificationLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_companyId_idx" ON "ApiKey"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAccessToken_tokenHash_key" ON "BookingAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "BookingAccessToken_bookingId_idx" ON "BookingAccessToken"("bookingId");

-- CreateIndex
CREATE INDEX "BookingAccessToken_expiresAt_idx" ON "BookingAccessToken"("expiresAt");

-- CreateIndex
CREATE INDEX "Booking_passengerId_idx" ON "Booking"("passengerId");

-- CreateIndex
CREATE INDEX "Booking_guestEmail_idx" ON "Booking"("guestEmail");

-- CreateIndex
CREATE INDEX "Booking_guestPhone_idx" ON "Booking"("guestPhone");

-- CreateIndex
CREATE INDEX "Booking_deletedAt_idx" ON "Booking"("deletedAt");

-- CreateIndex
CREATE INDEX "BookingLeg_boardedByDriverId_idx" ON "BookingLeg"("boardedByDriverId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_driverPinHash_key" ON "Driver"("driverPinHash");

-- CreateIndex
CREATE INDEX "Driver_companyId_idx" ON "Driver"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_companyId_uid_key" ON "Driver"("companyId", "uid");

-- CreateIndex
CREATE INDEX "LegTemplate_fromStopId_idx" ON "LegTemplate"("fromStopId");

-- CreateIndex
CREATE INDEX "LegTemplate_toStopId_idx" ON "LegTemplate"("toStopId");

-- CreateIndex
CREATE UNIQUE INDEX "LegTemplate_templateId_sequence_key" ON "LegTemplate"("templateId", "sequence");

-- CreateIndex
CREATE INDEX "Operator_companyId_idx" ON "Operator"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeChargeId_key" ON "Payment"("stripeChargeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripeTransferId_key" ON "Payment"("stripeTransferId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_companyId_idx" ON "Payment"("companyId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Route_companyId_idx" ON "Route"("companyId");

-- CreateIndex
CREATE INDEX "ScheduleTemplate_activeFrom_activeUntil_idx" ON "ScheduleTemplate"("activeFrom", "activeUntil");

-- CreateIndex
CREATE INDEX "Shift_tripId_idx" ON "Shift"("tripId");

-- CreateIndex
CREATE INDEX "Trip_status_idx" ON "Trip"("status");

-- CreateIndex
CREATE INDEX "TripLeg_shiftId_idx" ON "TripLeg"("shiftId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_companyId_status_idx" ON "Vehicle"("companyId", "status");

-- AddForeignKey
ALTER TABLE "Credentials" ADD CONSTRAINT "Credentials_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthProvider" ADD CONSTRAINT "AuthProvider_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operator" ADD CONSTRAINT "Operator_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operator" ADD CONSTRAINT "Operator_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ShuttleCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_uid_fkey" FOREIGN KEY ("uid") REFERENCES "User"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ShuttleCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ShuttleCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ShuttleCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Admin"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ShuttleCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceDocument" ADD CONSTRAINT "ComplianceDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ShuttleCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripLeg" ADD CONSTRAINT "TripLeg_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationPing" ADD CONSTRAINT "LocationPing_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLeg" ADD CONSTRAINT "BookingLeg_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingLeg" ADD CONSTRAINT "BookingLeg_boardedByDriverId_fkey" FOREIGN KEY ("boardedByDriverId") REFERENCES "Driver"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTimeline" ADD CONSTRAINT "BookingTimeline_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTimeline" ADD CONSTRAINT "BookingTimeline_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTimeline" ADD CONSTRAINT "BookingTimeline_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("uid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ShuttleCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ShuttleCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "Passenger"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ShuttleCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyVerification" ADD CONSTRAINT "CompanyVerification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyVerification" ADD CONSTRAINT "CompanyVerification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ShuttleCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVerification" ADD CONSTRAINT "DriverVerification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverVerification" ADD CONSTRAINT "DriverVerification_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleVerification" ADD CONSTRAINT "VehicleVerification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("uid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleVerification" ADD CONSTRAINT "VehicleVerification_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("uid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "ShuttleCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAccessToken" ADD CONSTRAINT "BookingAccessToken_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

