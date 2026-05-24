# AI Workflow Rules

## Approach

Build this project incrementally using a strict spec-driven workflow. Context files define what to build, how to build it (Next.js 16 App Router, Tailwind 4.0, shadcn/ui), and the current state of progress. Always implement against these specs—do not infer or invent product behavior from scratch. 

## Scoping Rules

- Work on one feature unit at a time as defined by the current spec file.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step (e.g., do not write Prisma schema migrations and complex Framer Motion UI animations in the same prompt).

## When to Split Work

Split an implementation step if it combines:

- UI implementation (Tailwind/shadcn) and Database architecture (Prisma schema updates).
- Complex client-side state (Zustand/TanStack Query) and Server-side route handlers or Server Actions.
- Behavior or visual layouts not clearly defined in the context files.

If a change cannot be verified end-to-end quickly, the scope is too broad—split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — These are generated shadcn/ui primitives. Wrap them in custom components or extend via `className` props instead of modifying the underlying source files.
- `prisma/migrations/*` — Never manually edit generated migration files.
- Any third-party library internals.

## Refactoring UI Audit

Before finalizing any UI component, you MUST verify:
- **Labels:** Are there any unnecessary labels that can be removed or combined with values (e.g., "3 bedrooms" instead of "Bedrooms: 3")?
- **Hierarchy:** Is visual hierarchy established through weight and color contrast rather than just increasing font size?
- **Spacing:** Is there ample whitespace around element groups to avoid ambiguous spacing? 
- **Depth & Borders:** Are borders minimized in favor of subtle background color differences or box shadows?
- **Alignment:** Do mixed font sizes on the same line align by their baseline?

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries (`architecture.md`).
- Storage model decisions (`architecture.md`).
- Code conventions or standards (`code-standards.md`).
- Feature scope (`project-overview.md`).

## Before Moving to the Next Unit

1. The current unit works end-to-end within its defined scope.
2. No Next.js 16 asynchronous paradigm rules or invariants defined in `architecture.md` were violated.
3. `progress-tracker.md` reflects the completed work.
4. `npm run build` passes with zero type errors.