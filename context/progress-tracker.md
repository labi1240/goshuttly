# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Project Setup & Initialization

## Current Goal

- Establish foundational context files and initialize the core Next.js 16 repository.

## Completed

- Context file system (`project-overview.md`, `architecture.md`, `ui-context.md`, `code-standards.md`, `ai-workflow-rules.md`) established.
- **Home page SSR refactor (2026-05-24):** `src/app/page.tsx` is now a Server Component. Modal open/close state lifted into Zustand store `src/store/booking-modal.ts`. Client islands isolated to leaves: `HeroBookingForm`, `ScheduleInteractive`, `RouteMapInteractive`, plus existing client-only components (`Navbar`, `ShuttleTracker`, `BookingModal`, `LightRays`). Hero narrative copy, schedule/map section headers, and "Important travel notes" advisory now ship as server-rendered HTML for SEO. Verified via `curl localhost:3000` — H1 and all marketing copy present in initial response. `tsc --noEmit` clean.

## In Progress

- None yet.

## Next Up

- Unit 01: Initialize Next.js 16 App Router repository with Tailwind 4.0 and shadcn/ui.
- Unit 02: Configure Clerk authentication with `proxy.ts` (Node.js runtime).
- Unit 03: Set up Prisma schema and connect to PostgreSQL database.

## Open Questions

- Which specific shadcn/ui components will be required for the first feature build?
- What are the initial data sources to be ingested for the Ammo Terminal aggregator functionality?

## Architecture Decisions

- **Framework:** Next.js 16 utilizing async Request-time APIs exclusively to prevent application crashes.
- **Routing/Auth:** Clerk implemented via `proxy.ts` (Node.js runtime) rather than the deprecated `middleware.ts`.
- **State Management:** Strict segregation between server data fetching (TanStack Query) and global client UI state (Zustand).
- **Styling:** Tailwind 4.0 with HSL custom properties to allow predictable lightness and saturation adjustments.

## Session Notes

- Context files are complete and locked in. 
- Ready to begin spec-driven development. 
- Ensure the first prompt instructs the AI to read the context files and `Unit 01` spec before executing any terminal commands or generating code.