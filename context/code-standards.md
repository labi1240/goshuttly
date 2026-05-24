# Code Standards

## General

- **Single Responsibility:** Keep components, functions, and modules small and focused on a single purpose.
- **Fix Root Causes:** Do not layer workarounds or CSS hacks to fix layout or state issues. Find and resolve the root cause.
- **Isolate Concerns:** Do not mix database mutation logic, UI animations, and global state management in the same file. 

## TypeScript

- **Strict Mode:** Strict mode is required throughout the project. 
- **No Implicit Any:** Avoid `any` entirely. Use explicit interfaces or narrowly scoped types for all function parameters and return types.
- **Input Validation:** Validate all unknown external input (API payloads, form submissions, query parameters) at system boundaries using a schema validation library (e.g., Zod) before trusting or processing it.

## Next.js 16 Framework

- **Async Request APIs:** All Request-time APIs (`cookies`, `headers`, `draftMode`, `params`, and `searchParams`) must be accessed asynchronously using `await`. Synchronous access is strictly prohibited.
- **Server Components by Default:** Default to React Server Components for all layouts, pages, and data-fetching views.
- **Isolate Interactivity:** Push the `"use client"` directive to the absolute leaf nodes of the component tree. Only convert a component to a Client Component if it requires browser APIs, Framer Motion animations, Zustand state, or user event listeners.
- **Auto-Memoization:** Rely on the Next.js 16 React Compiler for component optimization. Do not manually wrap components or values in `useMemo` or `useCallback` unless specifically required by a third-party library constraint.

## Styling (Tailwind 4.0 & Refactoring UI)

- **HSL Variables:** Use HSL CSS custom property tokens for all colors to allow predictable lightness and saturation adjustments. Do not use hardcoded hex values[cite: 9].
- **Constrained Scales:** Always use the predefined spacing, sizing, and typography scales defined in `ui-context.md`. Do not invent arbitrary pixel values[cite: 9].
- **Typography Sizing:** Use `rem` or `px` for font sizing. Never use `em` units for font sizes to prevent unpredictable fractional scaling[cite: 9].
- **Visual Hierarchy:** Establish hierarchy by adjusting font weight, color contrast, or de-emphasizing surrounding elements before increasing font size[cite: 9].

## API Routes & Server Actions

- **Authentication Boundary:** Enforce Clerk session verification and ownership validation before executing any logic or database mutation.
- **Predictable Responses:** Return consistent, strongly-typed JSON response shapes from API routes, and predictable serializable objects from Server Actions.
- **Cache Invalidation:** Use `updateTag` for "read-your-writes" Server Actions where the UI needs an immediate refresh, and `revalidateTag` with a `cacheLife` profile for standard cache expiration.

## Data and State Storage

- **Database as Source of Truth:** Core application metadata, relationships, and user profile extensions belong in PostgreSQL via Prisma.
- **TanStack Query:** Exclusively use TanStack Query for client-side data fetching, caching, and background synchronization. 
- **Zustand:** Exclusively use Zustand for global client-side UI state (e.g., managing a multi-step form or global modal visibility). Do not store server data in Zustand.

## File Organization

- `app/` — Next.js 16 App Router navigation, pages, layouts, and API route handlers.
- `actions/` — Next.js Server Actions for database mutations.
- `components/ui/` — Generated shadcn/ui primitives.
- `components/` — Feature-specific React components.
- `lib/` — Shared utilities, validation schemas, and singleton instances (e.g., Prisma, Stripe).
- `store/` — Zustand global state stores.
- `hooks/` — Custom React hooks, including TanStack Query data hooks.