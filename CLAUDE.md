# CLAUDE.md — Project Instructions

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
├── integrations/    # Supabase client and generated types
├── utils/           # Test utility files
└── test/            # Test setup (setup.ts, test-utils.tsx)

supabase/
└── migrations/      # 28 SQL migration files (schema, RLS, triggers)
```

## Architecture Patterns

- **Path aliases:** Use `@/` to import from `src/` (e.g., `import { supabase } from "@/integrations/supabase/client"`)
- **Data fetching:** Use TanStack React Query hooks in `src/hooks/` — never call Supabase directly from components
- **Auth:** `AuthContext` provides user, session, profile, and auth methods; wrap components needing auth
- **Cart:** `CartContext` manages cart state with localStorage persistence
- **Routing:** All routes defined in `src/App.tsx` — add custom routes above the `"*"` catch-all
- **UI components:** shadcn/ui components live in `src/components/ui/` — add new ones via the shadcn CLI, don't hand-write them
- **Toasts:** Two systems available — `sonner` (preferred for simple notifications) and shadcn `Toaster`

## Key Conventions

- **Component style:** Functional components with arrow functions as default exports for pages, named exports for reusable components
- **Styling:** Tailwind utility classes; use `cn()` from `@/lib/utils` to merge conditional classes
- **Brand colors:** Use `brand-berry`, `brand-olive`, `brand-cream`, `brand-terracotta`, `brand-mustard`, `brand-brown`, `brand-kraft` (defined as CSS custom properties)
- **Fonts:** `font-sans` (Nunito Sans), `font-display` (Cormorant Garamond), `font-script` (Dancing Script)
- **TypeScript:** `strictNullChecks` is off; `noImplicitAny` is off; unused vars/params are allowed
- **ESLint:** `@typescript-eslint/no-unused-vars` is disabled

## Testing

- Tests live alongside source in `src/` with `.test.ts` or `.test.tsx` suffix
- Test setup at `src/test/setup.ts` (mocks `matchMedia`, `ResizeObserver`, `localStorage`)
- Use `renderWithProviders` from `src/test/test-utils.tsx` — wraps components with QueryClient, Auth, Cart, and MemoryRouter
- Utility tests in `src/utils/` (e.g., `discount-calculations.test.ts`)

## Database

- Supabase project with Row Level Security (RLS) enabled
- Migrations in `supabase/migrations/` — ordered by timestamp
- Key tables: products, orders, gift_cards, loyalty_points, reviews, referrals, subscriptions, product_variants
- Generated types at `src/integrations/supabase/types.ts` — auto-generated, do not edit manually
- Supabase client at `src/integrations/supabase/client.ts` — auto-generated, do not edit manually

## Environment Variables

Required in `.env` (Vite `import.meta.env`):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- Square payment config is in `src/config/square.ts`
