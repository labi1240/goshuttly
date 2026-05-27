# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | Next.js 16 + TypeScript | App Router, Server Components, Server Actions, API routes |
| UI | Tailwind 4.0 + shadcn/ui | Styling system, component primitives, and responsive layouts |
| Animation | Framer Motion | Complex UI animations and transitions (Client-side only) |
| Auth | better-auth | Email+password and Google OAuth, session/cookie management, Prisma-backed users |
| Database | PostgreSQL + Prisma | Relational data storage, schema management, and ORM |
| Payments | Stripe | Checkout sessions, billing, and subscription management |
| Client Fetching | TanStack Query | Client-side data fetching, caching, and background synchronization |
| Client State | Zustand | Global client-side UI state management (e.g., modals, multi-step forms) |

## System Boundaries

- `app/` — Owns Next.js 16 App Router navigation, server-side data fetching, layouts, pages, and API route handlers.
- `components/ui/` — Owns generated shadcn/ui primitives. (Protected: wrap or compose these, do not modify base source).
- `components/` — Owns custom, feature-level React components (both Server and Client components).
- `lib/` — Owns shared utility functions, singleton instances (Prisma client, Stripe client), and validation schemas.
- `prisma/` — Owns the `schema.prisma` definition and generated database migration files.
- `store/` — Owns Zustand global state stores.
- `actions/` — Owns independent Next.js Server Actions for database mutations and external API interactions.

## Storage Model

- **PostgreSQL Database**: Owns core application data (routes, trips, bookings, payments), the canonical `User` row (PK `uid`), better-auth's `Session` / `Account` / `Verification` tables, and Stripe transaction records.
- **better-auth**: Owns the session cookie, password hashes (in `Credentials`), and OAuth account bindings (in `Account`). All data lives in our Postgres via the Prisma adapter — there is no external auth service.
- **Stripe**: Owns secure payment methods, PCI-compliant billing history, and active subscription states.

## Auth and Access Model

- **Authentication**: Every user signs in via **better-auth** (`lib/auth.ts`). Sessions persist via better-auth's cookie (HttpOnly, signed). Email+password and Google OAuth are enabled; additional social providers and the organization plugin will be added in a follow-up.
- **Route Protection**: `proxy.ts` (Node.js runtime — Next.js 16 default for proxy files) performs an **optimistic** session-cookie check via `getSessionCookie()` and redirects to `/sign-in?redirect=...` when missing. The proxy intentionally does NOT hit the database — it only checks for the cookie's presence.
- **Action Protection**: Every Server Action, Route Handler, and Server Component that touches user data MUST independently verify the session by calling `auth.api.getSession({ headers: await headers() })`. Do not trust the proxy alone.
- **Data Ownership**: User rows reference better-auth's `User.uid` (PK). Domain rows (`Passenger`, `Operator`, `Driver`, `Admin`) extend the user via `uid` FKs. All Prisma queries that read or write user-owned rows must filter by the session-derived `uid`.

## Invariants

1. **Next.js 16 Proxy Boundary:** Route protection must exclusively use `proxy.ts`. Next.js 16's proxy defaults to the Node.js runtime — do not attempt to set `runtime` (Next.js will throw). The legacy `middleware.ts` file is strictly prohibited. The proxy MUST only do optimistic cookie checks; real authorization happens in Server Actions / Route Handlers via `auth.api.getSession()`.
2. **Asynchronous Request APIs:** All Next.js Request-time APIs (`cookies`, `headers`, `draftMode`, `params`, and `searchParams`) must be awaited asynchronously before use. Synchronous access is forbidden and will crash the application.
3. **Strict State Segregation:** Zustand is used exclusively for global client UI state. TanStack Query is used exclusively for client-side data fetching. Initial page data loads must leverage React Server Components.
4. **Database Integrity:** Database schema changes must only be made within `prisma/schema.prisma` and executed via the Prisma CLI. Direct SQL schema mutations or overriding migrations manually is forbidden.
5. **Client Boundary Minimization:** The `"use client"` directive must be pushed to the absolute leaf nodes of the component tree. Wrap Framer Motion animations and Zustand stores in isolated interactive islands to keep layouts as Server Components.
