# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | Next.js 16 + TypeScript | App Router, Server Components, Server Actions, API routes |
| UI | Tailwind 4.0 + shadcn/ui | Styling system, component primitives, and responsive layouts |
| Animation | Framer Motion | Complex UI animations and transitions (Client-side only) |
| Auth | Clerk | User authentication, identity management, and route protection |
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

- **PostgreSQL Database**: Owns core application data (Aggregator/Ammo Terminal data), relational mapping, user profile extensions (synced with Clerk IDs), and Stripe transaction records.
- **Clerk**: Owns raw user authentication credentials, session data, and core user metadata.
- **Stripe**: Owns secure payment methods, PCI-compliant billing history, and active subscription states. 

## Auth and Access Model

- **Authentication**: Every user signs in via Clerk.
- **Route Protection**: Unauthenticated access is blocked at the network boundary using Next.js 16 `proxy.ts` (using the Node.js runtime).
- **Action Protection**: Every Server Action and API Route must independently verify the Clerk session and user permissions before executing Prisma queries or Stripe calls.
- **Data Ownership**: Database rows associated with users must store the Clerk `userId` for strict row-level authorization checks.

## Invariants

1. **Next.js 16 Proxy Boundary:** Route protection must exclusively use `proxy.ts` running on the `nodejs` runtime. The legacy `middleware.ts` file and `edge` runtime are strictly prohibited.
2. **Asynchronous Request APIs:** All Next.js Request-time APIs (`cookies`, `headers`, `draftMode`, `params`, and `searchParams`) must be awaited asynchronously before use. Synchronous access is forbidden and will crash the application.
3. **Strict State Segregation:** Zustand is used exclusively for global client UI state. TanStack Query is used exclusively for client-side data fetching. Initial page data loads must leverage React Server Components.
4. **Database Integrity:** Database schema changes must only be made within `prisma/schema.prisma` and executed via the Prisma CLI. Direct SQL schema mutations or overriding migrations manually is forbidden.
5. **Client Boundary Minimization:** The `"use client"` directive must be pushed to the absolute leaf nodes of the component tree. Wrap Framer Motion animations and Zustand stores in isolated interactive islands to keep layouts as Server Components.