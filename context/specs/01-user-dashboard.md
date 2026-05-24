# User Dashboard (Dashboard.tsx)

## User Review Required
- **[CRITICAL] Implementation Method:** The user dashboard must be built as a **Next.js 16 Server Component** located at `app/dashboard/page.tsx`. It must strictly adhere to the App Router model defined in `context/architecture.md` to ensure data is fetched server-side and streamed efficiently, avoiding unnecessary client-side hydration or overhead. No Client Components should be used unless explicitly required for interactive state management. Review `context/architecture.md#components` to confirm this alignment.

- **[CRITICAL] Data Fetching & Mutation:** The dashboard will implement complex data display (e.g., tables, charts) and user interactions (e.g., saving filters, triggering alerts). The user must confirm that the planned data fetching strategy aligns with the project’s design patterns, specifically regarding the use of **TanStack Query** for efficient server state management and **Prisma** models for data persistence. Refer to `context/architecture.md#data-layer` for standard practices.

## Design Context
- **Reference Files:** `context/ui-context.md` (color palette, typography, layout) and `context/project-overview.md` (user flow).

## Implementation Guidance

### 1. Server Component Structure
- The dashboard must be a Server Component, leveraging Next.js 16's server-first architecture. Use `export default function Dashboard() {}` at the top level of `app/dashboard/page.tsx`.
- All data fetching logic (e.g., using Prisma `client`) should be performed directly within this component or imported from server-side utility modules, not from client-side hooks.
- Use `async`/`await` for server-side data fetching and ensure all data is serialized properly for server-to-client streaming.

### 2. Data Layer Implementation
- Implement data display and user interaction patterns as defined in `context/architecture.md` and `context/project-overview.md`.
- Use **Prisma** for database interactions and **TanStack Query** for efficient data fetching and state management (if required for client-side caching or mutations).
- Data structures should align with the normalized schemas defined in `context/architecture.md#prisma-schema`.
- Implement appropriate caching and revalidation strategies for user data and aggregated listings.

### 3. UI/UX Implementation
- Apply the **Refactoring UI principles** and **Tailwind/shadcn/ui** conventions outlined in `context/ui-context.md` and `context/architecture.md`.
- Build an intuitive, responsive layout for displaying user data, saved searches, and preferences.
- Ensure strict adherence to color, typography, and border radius standards defined in `context/ui-context.md` to maintain a consistent visual experience.
- Use `await` with component suspense or loading states for optimal user experience during data rendering.

### 4. Error Handling & Edge Cases
- Implement robust error handling for server-side data fetching and user interactions.
- Handle edge cases such as missing user data, failed database operations, and invalid user inputs.
- Use suspense boundaries to manage loading states and display fallback UI gracefully during data rendering.

## Validation Checklist
- [ ] Dashboard is implemented as a Next.js 16 Server Component (`app/dashboard/page.tsx`).
- [ ] Data fetching and mutations strictly follow server-first patterns using Prisma and TanStack Query as defined in `context/architecture.md`.
- [ ] Component boundaries and data flow align with the Server Component architecture described in `context/architecture.md#components`.
- [ ] UI/UX adheres to Refactoring UI principles and uses Tailwind/shadcn/ui components as outlined in `context/ui-context.md`.
- [ ] All data is properly serialized for server-to-client streaming and caching.
- [ ] Error handling and suspense boundaries are correctly implemented for a seamless user experience.
- [ ] The implementation complies with the Prisma schema and database normalization patterns in `context/architecture.md#prisma-schema`.
- [ ] User interaction flows (saving searches, managing preferences) are implemented as per `context/project-overview.md`.