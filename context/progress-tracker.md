# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Project Setup & Initialization

## Current Goal

- Establish foundational context files and initialize the core Next.js 16 repository.

## Completed

- Context file system (`project-overview.md`, `architecture.md`, `ui-context.md`, `code-standards.md`, `ai-workflow-rules.md`) established.
- **Home page SSR refactor (2026-05-24):** `src/app/page.tsx` is now a Server Component. Modal open/close state lifted into Zustand store `src/store/booking-modal.ts`. Client islands isolated to leaves: `HeroBookingForm`, `ScheduleInteractive`, `RouteMapInteractive`, plus existing client-only components (`Navbar`, `ShuttleTracker`, `BookingModal`, `LightRays`). Hero narrative copy, schedule/map section headers, and "Important travel notes" advisory now ship as server-rendered HTML for SEO. Verified via `curl localhost:3000` — H1 and all marketing copy present in initial response. `tsc --noEmit` clean.
- **Schema expansion for marketplace + mobile + Stripe Connect (2026-05-25):** Layered marketplace/mobile gap-closers onto the leg-based schema without disturbing existing PascalCase relations (caller code in the Phase-C-remaining files still uses them). Added on `Operator`: full Stripe Connect onboarding state (`stripeAccountType`, `stripeOnboardingComplete`, `stripeChargesEnabled`, `stripePayoutsEnabled`, `stripeRequirementsDue` Json) + cancellation policy defaults (`refundFullHoursBefore`, `refundPartialHoursBefore`, `refundPartialPercent`). Added on `Payment`: `operatorId` FK + `stripeTransferId` + `stripeDestinationAccount` + `applicationFeeCents` + `operatorNetCents` for marketplace fee tracking, plus per-jurisdiction tax columns (`hstCents`/`pstCents`/`qstCents` alongside existing `gstCents`). Same tax columns mirrored on `Booking` with new `taxJurisdiction`, plus `cancelledAt`/`cancellationReason`. Added on `BookingLeg`: `boardedByDriverId` for boarding audit trail. New models: `Refund` (multiple partial refunds per Payment, with `reversedTransfer` for Stripe Connect transfer reversals), `Payout` (mirror of Stripe payout objects per operator), `StripeWebhookEvent` (idempotency log keyed on `stripeEventId`), `DeviceToken` (push notifications, user XOR driver), `LocationPing` (Shift telemetry time series — needs retention policy), `ApiKey` (hashed third-party access tokens), `NotificationLog` (proof of dispatch for receipts/SMS). New enums: `StripeAccountType`, `NotificationChannel`, `NotificationStatus`, `DevicePlatform`. Schema-level small fixes: added missing `@default(uuid())` on `BookingLeg.id`, `LegTemplate.id`, `ScheduleTemplate.id`, `Stop.id`, `TripLeg.id`, `User.id`. Renamed only the ugly `Stop_LegTemplate_fromStopIdToStop`/`Stop_LegTemplate_toStopIdToStop` field pair to `fromStop`/`toStop` (relation `name:` strings preserved so no DB-side migration needed for the rename); updated the 4 callers: `app/actions/search.ts`, `app/actions/driver.ts`, `app/(driver)/terminal/[driverId]/select-shift/page.tsx`. Other PascalCase relations (`BookingLeg`, `TripLeg`, `ScheduleTemplate`, etc.) left as-is to avoid expanding blast radius. `Booking.updatedAt` deliberately kept WITHOUT `@updatedAt` — callers still set it explicitly per the 2026-05-24 convention. **No migration yet — schema-only change. `prisma migrate dev --create-only` should be run to produce the SQL diff for review before applying.** TS error count went from 168 → 142 (pre-existing Phase-C-remaining files unchanged).

- **Schema pivot to leg-based booking model (2026-05-24):** The Prisma Postgres database had drifted to a far more sophisticated leg-based schema (`Trip` + `TripLeg` + `BookingLeg` + `Stop` + `ScheduleTemplate` + `LegTemplate`) than what was in `prisma/schema.prisma`. Decision was to adopt the DB schema as authoritative rather than reset and lose it. **Phase A:** `prisma db pull` overwrote schema.prisma with the introspected leg-based model; stale `init` and `seat_inventory` migrations deleted; baseline migration recreated and aligned with the DB's original `20260521092718_init` row (after fighting an advisory lock and a checksum mismatch). **Phase B:** added `Operator`, `Driver`, `Admin`, `Shift` models back (with `ShiftStatus`, `AdminRole`, `BoardedStatus` enums) via migration `20260524223742_add_operator_marketplace`; `Vehicle.operatorId` and `Route.operatorId` are nullable for backfill safety; `BookingLeg` gained `boardedStatus` + `boardedAt` (boarding is per-leg in the new model). One Shift binds (Vehicle, Driver) to a single Trip (`@unique` on tripId). Previous `Shift.seatsBooked` seat-concurrency work is now superseded by `TripLeg.seatsBooked` which already exists in the DB.

## In Progress

- **Phase C: Code rewrite for leg-based schema.** 14 files reference the old `Shift`/`Driver`/`Operator`/`Passenger`/`Admin` model and need to be rewritten against the new schema. Order of attack: (1) `actions/booking.ts` + webhook + cron with `TripLeg.seatsBooked` row-locking concurrency, (2) `actions/search.ts` + passenger book/track pages, (3) operator dashboard pages, (4) driver terminal + telemetry, (5) `prisma/seed.ts`. Running on branch `feat/leg-based-schema`.

## Next Up

- Unit 01: Initialize Next.js 16 App Router repository with Tailwind 4.0 and shadcn/ui.
- Unit 02: Configure Clerk authentication with `proxy.ts` (Node.js runtime).
- Unit 03: Set up Prisma schema and connect to PostgreSQL database.

## Open Questions

- Which specific shadcn/ui components will be required for the first feature build?
- What are the initial data sources to be ingested for the Ammo Terminal aggregator functionality?
- **Auth provider (blocks mobile work):** Clerk or better-auth? Both currently in schema. Clerk has mature RN SDK + B2B orgs; better-auth is self-hosted/cheaper but less mobile-tested.

## Architecture Decisions

- **API surface (2026-05-26):** REST API under `app/api/v1/*` with Zod schemas exported to OpenAPI, consumed by both the Expo mobile app and third-party `ApiKey` integrations. Web uses Server Components for initial loads + Server Actions for mutations + TanStack Query for client-side polling/caching. **tRPC was rejected** because the `ApiKey` model already commits us to a REST surface for third parties — running both is duplicated work.
- **Mobile stack (2026-05-26):** Expo / React Native. Will consume the same `packages/api-contracts` generated client as web. Lives in `apps/mobile/` after the monorepo split.
- **Repo structure (2026-05-26):** Monorepo, extracted **before** mobile work starts. Layout: `apps/web`, `apps/mobile`, `packages/db`, `packages/booking-core` (seat-lock + pricing + refund policy — Next-free), `packages/api-contracts`, `packages/ui`. Order of operations: (1) finish current leg-based-schema Phase C rewrites, (2) upgrade Prisma 6.x → 7.x, (3) extract monorepo packages, (4) start mobile app. Rationale: do not reimplement the `TripLeg` row-lock discipline in mobile code.
- **Framework:** Next.js 16 utilizing async Request-time APIs exclusively to prevent application crashes.
- **Routing/Auth:** Clerk implemented via `proxy.ts` (Node.js runtime) rather than the deprecated `middleware.ts`. **Open:** schema still has both better-auth tables AND `AuthProviderType.CLERK` — pick one provider before mobile begins.
- **State Management:** Strict segregation between server data fetching (TanStack Query) and global client UI state (Zustand).
- **Styling:** Tailwind 4.0 with HSL custom properties to allow predictable lightness and saturation adjustments.
- **Prisma version (2026-05-24):** Staying on Prisma ORM `6.19.x` for now. Prisma 7 is available (`7.8.0` current) and brings a real architectural shift — ESM-first `prisma-client` generator, mandatory driver adapters (`@prisma/adapter-pg` + `pg`), `prisma.config.ts`, and a custom output path. Upgrade was deferred so it can be done as a dedicated PR after the seat-inventory work stabilizes — not stacked on top of feature changes. Revisit when migrating to Prisma Postgres managed product or when serverless cold-start matters.
- **Seat inventory authority (2026-05-24, revised):** `TripLeg.seatsBooked` is the single source of truth for capacity per leg. Do not compute availability by summing `BookingLeg.passengers` at read time. All mutations must hold a Postgres row lock on the TripLeg (`SELECT … FOR UPDATE OF tl`) and use `{ increment }` / `{ decrement }` for the counter. Multi-leg bookings must lock and validate **all** affected `TripLeg` rows in a deterministic order (e.g. by id) to prevent deadlocks. External calls (Stripe, etc.) must happen outside the DB transaction; reservations get `Booking.holdExpiresAt` and are swept by the release-stale-holds cron.
- **Shift binding (2026-05-24):** A `Shift` is `(Operator, Vehicle, Driver, Trip)` with `tripId @unique` — one shift per trip. The driver covers all `TripLeg` rows of that trip in sequence. `TripLeg.seatsTotal` is independent of `Vehicle.seatCapacity`; if a vehicle swap changes capacity, callers must update the trip's TripLeg seat totals explicitly.
- **Operator scoping (2026-05-24):** Multi-operator marketplace. `Vehicle.operatorId`, `Route.operatorId`, `Driver.operatorId`, `Admin.operatorId` are all FKs to `Operator`. The first two are nullable for migration safety — tighten to NOT NULL after backfilling an operator row.

## Session Notes

- Context files are complete and locked in. 
- Ready to begin spec-driven development. 
- Ensure the first prompt instructs the AI to read the context files and `Unit 01` spec before executing any terminal commands or generating code.