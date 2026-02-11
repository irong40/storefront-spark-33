# CLAUDE.md — Project Instructions

**Author:** Adam Pierce
**Updated:** February 2026

---

## Project Overview

Juice bar e-commerce storefront built with React, TypeScript, and Supabase. Sells cold-pressed organic juices, wellness products, gift cards, and subscriptions. Includes a customer-facing storefront and an admin dashboard.

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build:** Vite 7 (SWC plugin)
- **Styling:** Tailwind CSS 3 + shadcn/ui (Radix UI primitives)
- **Routing:** React Router DOM 6
- **State:** React Context (auth, cart) + TanStack React Query (server state)
- **Forms:** React Hook Form + Zod validation
- **Backend:** Supabase (PostgreSQL, auth, RLS)
- **Payments:** Square Web Payments SDK
- **Charts:** Recharts
- **Testing:** Vitest + React Testing Library + jsdom

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (type-checks via tsc)
npm run lint         # ESLint
npm run test         # Vitest watch mode
npm run test:run     # Vitest single run
npm run test:coverage # Vitest with coverage
```

## Project Structure

```
src/
├── pages/           # Route-level page components (16 pages)
├── components/
│   ├── ui/          # shadcn/ui primitives (do not edit directly)
│   ├── layout/      # Header, Footer, Layout
│   ├── home/        # Landing page sections
│   ├── products/    # Product cards, filters, variant selectors
│   ├── cart/        # Cart drawer and items
│   ├── checkout/    # Square payment form integration
│   ├── admin/       # Admin dashboard components
│   ├── account/     # User account tabs
│   ├── loyalty/     # Loyalty program dashboard
│   └── reviews/     # Review forms and lists
├── hooks/           # Custom React hooks (data fetching, business logic)
├── contexts/        # AuthContext, CartContext
├── types/           # Shared TypeScript interfaces
├── lib/             # Utility functions (cn, format-hours)
├── config/          # Checkout and Square configuration
├── integrations/    # Supabase client and generated types (auto-generated, do not edit)
├── utils/           # Utility and test files
└── test/            # Test setup (setup.ts, test-utils.tsx)

supabase/
└── migrations/      # SQL migration files (schema, RLS, triggers)
```

## Architecture Patterns

- **Path aliases:** Use `@/` to import from `src/` (e.g., `import { supabase } from "@/integrations/supabase/client"`)
- **Data fetching:** Use TanStack React Query hooks in `src/hooks/` — never call Supabase directly from components
- **Auth:** `AuthContext` provides user, session, profile, and auth methods
- **Cart:** `CartContext` manages cart state with localStorage persistence
- **Routing:** All routes defined in `src/App.tsx` — add custom routes above the `"*"` catch-all
- **UI components:** shadcn/ui components live in `src/components/ui/` — add new ones via the shadcn CLI, don't hand-write them
- **Toasts:** Two systems available — `sonner` (preferred for simple notifications) and shadcn `Toaster`

## Key Conventions

- **Component style:** Functional components with arrow functions as default exports for pages, named exports for reusable components
- **Styling:** Tailwind utility classes; use `cn()` from `@/lib/utils` to merge conditional classes
- **Brand colors:** `brand-berry`, `brand-olive`, `brand-cream`, `brand-terracotta`, `brand-mustard`, `brand-brown`, `brand-kraft` (CSS custom properties)
- **Fonts:** `font-sans` (Nunito Sans), `font-display` (Cormorant Garamond), `font-script` (Dancing Script)
- **TypeScript:** `strictNullChecks` is off; `noImplicitAny` is off; unused vars/params are allowed
- **ESLint:** `@typescript-eslint/no-unused-vars` is disabled

## Database

- Supabase project with Row Level Security (RLS) enabled
- Migrations in `supabase/migrations/` — ordered by timestamp
- Key tables: products, orders, gift_cards, loyalty_points, reviews, referrals, subscriptions, product_variants
- Generated types at `src/integrations/supabase/types.ts` — auto-generated, do not edit
- Supabase client at `src/integrations/supabase/client.ts` — auto-generated, do not edit

## Environment Variables

Required in `.env` (Vite `import.meta.env`):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- Square payment config is in `src/config/square.ts`

---

## Implementation Best Practices

### 0 — Purpose

These guidelines ensure maintainability, safety, and developer velocity.
**MUST** rules are enforced by CI; **SHOULD** rules are strongly recommended.

---

### 1 — Before Coding

**BP-1 (MUST)** Ask clarifying questions until the requirements and scope are fully understood.

**BP-2 (SHOULD)** Draft and confirm the technical approach for complex or ambiguous work before implementation.

**BP-3 (SHOULD)** When multiple approaches exist, document clear pros and cons to inform decision-making.

**BP-4 (SHOULD)** For complex architectural decisions or ambiguous debugging, request extended thinking to surface deeper analysis before committing to an approach.

---

### 2 — While Coding

**C-1 (MUST)** Follow Test-Driven Development (TDD): scaffold a stub, write a failing test, then implement the feature.

**C-2 (MUST)** Name functions using existing domain vocabulary to maintain semantic consistency.

**C-3 (SHOULD NOT)** Avoid introducing classes unless necessary; prefer small, testable functions.

**C-4 (SHOULD)** Favor simple, composable, and testable functions for clarity and reusability.

**C-5 (MUST)** Use branded types for IDs to enforce type safety and prevent misuse:

```ts
type UserId = Brand<string, 'UserId'>; // Good
type UserId = string;                  // Bad
```

**C-6 (MUST)** Use `import type { ... }` exclusively for type-only imports to reduce runtime overhead.

**C-7 (SHOULD NOT)** Minimize comments; rely on self-explanatory code except for critical caveats.

**C-8 (SHOULD)** Default to `type` over `interface` unless interface merging or enhanced readability warrants otherwise.

**C-9 (SHOULD NOT)** Extract new functions unless they are reusable, essential for unit testing otherwise untestable logic, or dramatically improve readability of complex code blocks.

**C-10 (MUST)** Implement a persistent rotating development log excluded from Git commits. Log all inputs and outputs during error investigation and rely on this log to diagnose issues instead of guessing.

**C-11 (SHOULD)** When operating agentically across multiple files, complete logical units of work before pausing. Prefer atomic changes that pass all gates (tests, lint, typecheck) at each stopping point.

**C-12 (MUST)** When using tools or integrations (MCP servers, file operations, web searches), state intent before execution.

**C-13 (SHOULD)** Leverage available integrations proactively when they reduce manual work. Discover capabilities before asking the user to perform external steps manually.

---

### 3 — Testing

**T-1 (MUST)** Co-locate unit tests in `*.spec.ts` files alongside the source.

**T-2 (MUST)** Add or extend integration tests for any API or hook changes.

**T-3 (MUST)** Always separate pure-logic unit tests from database or external system integration tests.

**T-4 (SHOULD)** Prefer integration tests over heavy mocking for realistic coverage.

**T-5 (SHOULD)** Thoroughly unit-test complex algorithms.

**T-6 (SHOULD)** Consolidate structure verification into single assertions when possible:

```ts
expect(result).toEqual([value]); // Good
expect(result).toHaveLength(1);  // Bad
expect(result[0]).toBe(value);   // Bad
```

---

### 4 — Database

**D-1 (MUST)** Use Supabase RLS policies for authorization. Never bypass RLS from client code.

**D-2 (SHOULD)** Add new migrations to `supabase/migrations/` with timestamp-prefixed filenames.

---

### 5 — Tooling Gates

**G-1 (MUST)** Ensure `npm run lint` passes before committing code.

**G-2 (MUST)** Ensure `npm run build` passes (includes TypeScript type checking).

---

### 6 — Git

**GH-1 (MUST)** Use Conventional Commits format: https://www.conventionalcommits.org/en/v1.0.0

**GH-2 (SHOULD NOT)** Avoid referencing Claude, Anthropic, or internal AI tools in commit messages.

---

### 7 — AI Interaction & Memory

**M-1 (SHOULD)** Rely on Claude's persistent memory for project context rather than manual session continuation files.

**M-2 (SHOULD)** When starting a new session on an ongoing project, state the project name and current objective.

**M-3 (MUST)** For critical decisions or non-obvious context that must persist, explicitly request: "Remember that [decision/context]."

**M-4 (SHOULD NOT)** Avoid re-explaining project architecture, tech stack, or coding preferences already established in memory.

**M-5 (SHOULD)** When context seems missing or stale, ask Claude to search past conversations rather than starting from scratch.

---

### 8 — Integrations & Tool Use

**I-1 (SHOULD)** At the start of a session involving external systems, identify available integrations relevant to the task.

**I-2 (MUST)** Chain integrations logically to complete workflows end-to-end without requiring user to manually bridge steps.

**I-3 (SHOULD)** When an integration fails, log the issue to the development log (C-10) and propose an alternative approach before asking the user to intervene.

**I-4 (SHOULD NOT)** Avoid asking the user to perform actions manually that an available integration can handle.

**I-5 (SHOULD)** For multi-step integration workflows, confirm the plan before execution when the workflow has side effects.

---

### 9 — Extended Thinking

**ET-1 (SHOULD)** Request extended thinking for architectural decisions affecting multiple areas, persistent debugging, security/performance review, or trade-off analysis.

**ET-2 (SHOULD NOT)** Use extended thinking for routine implementation, simple refactors, or well-understood patterns.

**ET-3 (SHOULD)** When extended thinking surfaces multiple viable approaches, present them with clear pros/cons before proceeding.

---

### 10 — Cross-Environment Consistency

**E-1 (MUST)** These guidelines apply uniformly across Claude Code CLI, Claude.ai chat, and API integrations.

**E-2 (SHOULD)** In Claude Code CLI, prefer autonomous multi-step execution with gates (tests pass, lint clean) at each commit point.

**E-3 (SHOULD)** In Claude.ai chat, surface file changes explicitly and offer to create downloadable artifacts.

**E-4 (SHOULD)** When switching environments mid-project, rely on memory rather than manual context transfer.

---

## Writing Functions Checklist

1. Is the function's logic straightforward and easily understandable? If yes, stop here.
2. Does it have high cyclomatic complexity or deep nesting? If so, refactor.
3. Could common data structures or algorithms improve clarity?
4. Are there unused parameters or unnecessary type casts?
5. Is the function easily testable in isolation?
6. Does it have hidden, untested dependencies that should be factored out?
7. Brainstorm three alternative names and select the clearest.

Only extract a separate function if it is reused, needed for unit test coverage, or makes opaque code significantly clearer.

---

## Writing Tests Checklist

1. Parameterize inputs; avoid hardcoded literals without context.
2. Only add tests that can fail due to real defects.
3. Ensure test descriptions precisely state what is being asserted.
4. Compare results to independent or precomputed expected values.
5. Follow linting, type safety, and formatting rules identical to production code.
6. Express invariants and axioms using property-based testing where practical.
7. Group unit tests logically with `describe` blocks.
8. Use flexible assertions (`expect.any(...)`) for variable parameters.
9. Favor strong assertions (`toEqual`) over weaker ones.
10. Test edge cases, realistic inputs, unexpected inputs, and boundary values.
11. Avoid tests that duplicate type system checks.

---

## Developer Shortcuts

| Command | Action |
|---------|--------|
| **QNEW** | Apply all guidelines. Check memory for existing project context. Identify available integrations. |
| **QPLAN** | Analyze codebase for minimal-impact, consistent plans. Use extended thinking for complex decisions. Output a numbered action plan with gates. |
| **QCODE** | Implement the plan in atomic commits. After each unit: run tests, lint, typecheck. Stop at first failing gate. |
| **QCHECK** | Skeptical, checklist-driven review. Apply function and test checklists. Flag MUST violations. Output: PASS, CONCERNS, or FAIL. |
| **QCHECKF** | Detailed function review using Writing Functions checklist. |
| **QCHECKT** | Detailed test review using Writing Tests checklist. |
| **QGIT** | Stage, commit, push with Conventional Commits. Verify all gates pass. Exclude AI references. |
| **QMEM** | Search past conversations and memory for relevant context. |
| **QINT** | List available integrations and propose chains for the current task. |
| **QUX** | Act as a UX tester. Output prioritized test scenarios: happy path, edge cases, errors, accessibility. |

---

## Quick Reference: Rule Categories

| Category | MUST | SHOULD | SHOULD NOT |
|----------|------|--------|------------|
| Before Coding | BP-1 | BP-2, BP-3, BP-4 | — |
| While Coding | C-1, C-2, C-5, C-6, C-10, C-12 | C-4, C-11, C-13 | C-3, C-7, C-9 |
| Testing | T-1, T-2, T-3 | T-4, T-5, T-6 | — |
| Database | D-1 | D-2 | — |
| Tooling Gates | G-1, G-2 | — | — |
| Git | GH-1 | — | GH-2 |
| AI & Memory | M-3 | M-1, M-2, M-5 | M-4 |
| Integrations | I-2 | I-1, I-3, I-5 | I-4 |
| Extended Thinking | — | ET-1, ET-3 | ET-2 |
| Cross-Environment | E-1 | E-2, E-3, E-4 | — |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | Original | Initial guidelines |
| v2.0 | January 2026 | Added AI Memory, Integrations, Extended Thinking, Cross-Environment sections. Enhanced Q-commands. |
| v2.1 | February 2026 | Adapted for storefront-spark-33 project. Merged project-specific context with coding guidelines. |
