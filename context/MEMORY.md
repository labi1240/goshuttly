# Goshuttly — Project Memory

## Architectural commitments (2026-05-26)

- **API surface**: REST under `app/api/v1/*` + Zod → OpenAPI, consumed by web (TanStack Query for polling) and Expo mobile. **Not tRPC** — `ApiKey` table commits us to a REST surface for third-party operators, no point running two API layers.
- **Mobile stack**: Expo / React Native (TS end-to-end).
- **Repo plan**: Monorepo extraction before mobile work starts. Layout: `apps/{web,mobile}`, `packages/{db, booking-core, api-contracts, ui}`. Order: finish Phase C (done), upgrade Prisma 6.x → 7.x, then extract.

## Auth — better-auth (decision settled, code shipped)

- Lib: `lib/auth.ts` + `lib/auth-client.ts`. Email+password and Google OAuth enabled. **Clerk fully removed.**
- Schema: `User.uid` renamed to `id String @id @default(uuid()) @map("uid")` — DB column stays `uid`. better-auth 1.6.11 does NOT support remapping `id` via `user.fields` (the type excludes `id`); the `schema:` option on `prismaAdapter` was a no-op in this version. So `@map` is the only workable approach.
- Organization plugin — **Option B** (side-by-side + FK link). `ShuttleCompany.organizationId` + `Operator.memberId`, both nullable + `onDelete: SetNull` to preserve CRA-retained financial records.
- DB migrated and live (`db push` 2026-05-27 + `migrate resolve --applied` for the on-disk migration file at `prisma/migrations/20260527040000_better_auth_org_plugin/`).

## Phase C — leg-based schema code rewrite (done 2026-05-27)

- `tsc --noEmit` went from 172 → 0.
- Booking flow is now multi-leg: passenger books one or more `TripLeg`s. Booking action locks TripLegs in deterministic ID order with `SELECT ... FOR UPDATE` (schema invariant — without that, two concurrent multi-leg bookings deadlock on overlapping ranges), commits with 15-min `holdExpiresAt`, then calls Stripe outside the tx. Webhook idempotency goes through `StripeWebhookEvent.stripeEventId @unique`.
- Driver PINs are now `SHA-256(pin + DRIVER_PIN_PEPPER)` against `Driver.driverPinHash`.

## Open work (in priority order)

1. **Verify in browser** — sign-up → sign-in → search → book → Stripe → ticket → boarding. Nothing's been driven end-to-end yet. Needs `GOOGLE_CLIENT_ID/SECRET` set in `.env.local`.
2. **Dashboard ↔ session wiring** — replace temp `prisma.operator.findFirst()` in `resolveOperatorContext()` (in `app/(operator)/dashboard/page.tsx`) with `auth.api.getSession({ headers })` → Operator-by-uid. Without this the dashboard is single-tenant.
3. **Atomic ShuttleCompany create + Organization create** — one tx (TODO in `lib/auth.ts`).
4. **Custom roles** — configure better-auth's org plugin to use `OWNER/MANAGER/DISPATCHER/FINANCE` instead of `owner/admin/member`.
5. **Operator invite flow** — create `Member` + `Operator` atomically, keep `Operator.role ↔ Member.role` in sync.
6. **Prisma 6 → 7 upgrade** (then monorepo extraction).

## Branch state

- Working branch: `feat/leg-based-schema`. Pushed to `origin` at `06cf9c3` (2026-05-27).
- 7 commits ahead of `main`. Coderabbit auto-reviews on push per `.coderabbit.yaml` from `cf6b419`.
