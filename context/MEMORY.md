# Goshuttly — Project Memory

## Architecture decisions (2026-05-26)

### API layer — REST + TanStack Query (no tRPC)
- **Web**: Server Components for initial loads, Server Actions for mutations from web UI.
- **Mobile + third-party**: Versioned REST API under `app/api/v1/*`, schemas defined with Zod, exported to OpenAPI for typed client generation.
- **Both clients** use TanStack Query for client-side caching/polling (seat counts, driver location, booking status).
- **Why**: Mobile is Expo (could share TS) but `ApiKey` model already promises a REST surface to third-party operators — running both tRPC + REST is duplicated work. Single REST surface scales to all consumers.
- **Why not tRPC**: doesn't version cleanly, doesn't help third-party `ApiKey` consumers, would force us to maintain two API surfaces.

### Mobile stack — Expo / React Native
- TypeScript end-to-end with web. Lives in `apps/mobile/` once monorepo is extracted.
- Consumes the same `packages/api-contracts` (Zod → OpenAPI → typed client) as web's internal calls.

### Repo structure — Monorepo, split now (not later)
- Planned layout:
  - `apps/web` (existing Next.js 16)
  - `apps/mobile` (Expo)
  - `packages/db` (Prisma schema + generated client + migrations)
  - `packages/booking-core` (seat-locking, pricing, refund policy — pure TS, no Next deps)
  - `packages/api-contracts` (Zod schemas + OpenAPI export + generated typed client)
  - `packages/ui` (shadcn primitives — web only; React Native uses its own)
- **Why now**: seat-locking discipline (`TripLeg` row-lock + deterministic order) and tiered refund policy must NOT be reimplemented in mobile. Extract to shared package before mobile work starts.
- **Prerequisite**: Upgrade Prisma 6.x → 7.x **before** the monorepo split (per existing progress-tracker note) so `prisma-client` generator + driver adapters land cleanly with the package extraction in one motion, not two.

### Auth provider consolidation needed
- Schema currently has BOTH better-auth tables (`Session`, `Account`, `Verification`, `Credentials`, `AuthProvider`) AND `AuthProviderType.CLERK` enum value. Architecture doc says Clerk via `proxy.ts`.
- **Decision still pending**: pick one auth provider before mobile work. Clerk has native RN SDK + B2B orgs; better-auth is self-hosted and cheaper at scale but less mobile-mature.

## Index

- See [memory.md](./MEMORY.md) (this file) for cross-cutting decisions.
- See [progress-tracker.md](./progress-tracker.md) for phase status and per-change log.
- See [architecture.md](./architecture.md) for system boundaries and invariants.