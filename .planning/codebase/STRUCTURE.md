# Codebase Structure

**Analysis Date:** 2026-02-25

## Directory Layout

```
juicebar/
├── src/
│   ├── main.tsx                 # React app entry point
│   ├── App.tsx                  # Root component with providers and routes
│   ├── App.css                  # App-level styles
│   ├── index.css                # Global styles and Tailwind imports
│   ├── vite-env.d.ts            # Vite type definitions
│   │
│   ├── pages/                   # Page-level components (route handlers)
│   │   ├── Home.tsx             # Landing page
│   │   ├── Products.tsx         # Product catalog page
│   │   ├── ProductDetail.tsx    # Single product detail view
│   │   ├── About.tsx            # About page
│   │   ├── Contact.tsx          # Contact page
│   │   ├── Checkout.tsx         # Checkout/payment page
│   │   ├── OrderConfirmation.tsx# Order success page
│   │   ├── Auth.tsx             # Sign in/up page
│   │   ├── Account.tsx          # User profile and order history
│   │   ├── Admin.tsx            # Admin dashboard
│   │   ├── GiftCardBalance.tsx  # Gift card lookup
│   │   ├── NotFound.tsx         # 404 page
│   │   └── Index.tsx            # (Unused legacy file)
│   │
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # Shadcn/ui primitives (button, input, card, etc.)
│   │   ├── layout/              # Layout wrappers
│   │   │   ├── Layout.tsx       # Main page wrapper with header/footer
│   │   │   ├── Header.tsx       # Navigation header
│   │   │   └── Footer.tsx       # Footer
│   │   ├── home/                # Home page sections
│   │   │   ├── Hero.tsx
│   │   │   ├── AnnouncementBanner.tsx
│   │   │   ├── BenefitsBar.tsx
│   │   │   ├── FeaturedProducts.tsx
│   │   │   ├── Categories.tsx
│   │   │   ├── MenuPreview.tsx
│   │   │   ├── Testimonials.tsx
│   │   │   ├── Story.tsx
│   │   │   ├── Locations.tsx
│   │   │   ├── CTA.tsx
│   │   │   └── Newsletter.tsx
│   │   ├── products/            # Product display components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   └── ProductFilters.tsx
│   │   ├── cart/                # Shopping cart components
│   │   │   ├── CartDrawer.tsx   # Sliding cart panel
│   │   │   ├── CartItem.tsx     # Individual cart item
│   │   │   └── AddToCartButton.tsx
│   │   ├── checkout/            # Checkout flow components
│   │   │   └── SquarePaymentForm.tsx
│   │   ├── loyalty/             # Loyalty program components
│   │   │   └── LoyaltyDashboard.tsx
│   │   ├── admin/               # Admin panel components
│   │   │   ├── analytics/       # Analytics sub-components
│   │   │   │   ├── AnalyticsDashboard.tsx
│   │   │   │   ├── RevenueChart.tsx
│   │   │   │   ├── CategoryChart.tsx
│   │   │   │   ├── TopProductsPanel.tsx
│   │   │   │   ├── CustomerMetricsPanel.tsx
│   │   │   │   ├── PeakHoursPanel.tsx
│   │   │   │   ├── KPICard.tsx
│   │   │   │   └── ActivityFeed.tsx
│   │   │   ├── ProductForm.tsx  # Create/edit product form
│   │   │   ├── ProductVariantsPanel.tsx # Manage product variants
│   │   │   ├── OrdersTable.tsx  # Order list with filtering
│   │   │   ├── CreateOrderDialog.tsx
│   │   │   ├── GiftCardsPanel.tsx
│   │   │   ├── FeaturedProductsPanel.tsx
│   │   │   ├── AnnouncementsPanel.tsx
│   │   │   ├── UserManagementPanel.tsx
│   │   │   ├── BusinessSettingsForm.tsx
│   │   │   ├── AdminHelpPanel.tsx
│   │   ├── NavLink.tsx          # Custom router link component
│   │   └── ScrollToTop.tsx      # Scroll-to-top on route change
│   │
│   ├── contexts/                # React Context for global state
│   │   ├── AuthContext.tsx      # User auth, profile, session management
│   │   └── CartContext.tsx      # Shopping cart state and operations
│   │
│   ├── hooks/                   # Custom React hooks for data fetching
│   │   ├── use-products.ts      # Product queries and types
│   │   ├── use-product-variants.ts  # Product variants/addons
│   │   ├── use-orders.ts        # Order queries and mutations
│   │   ├── use-analytics.ts     # Dashboard analytics queries
│   │   ├── use-users.ts         # User/customer queries
│   │   ├── use-categories.ts    # Product category queries
│   │   ├── use-gift-card.ts     # Gift card balance and redemption
│   │   ├── use-loyalty.ts       # Loyalty program queries
│   │   ├── use-admin.ts         # Admin permission checks
│   │   ├── use-announcements.ts # Announcement queries
│   │   ├── use-business.ts      # Business settings queries
│   │   ├── use-customer-orders.ts  # Customer order history
│   │   ├── use-square-sync.ts   # Square payment integration
│   │   ├── use-toast.ts         # Toast notification hook
│   │   └── use-mobile.tsx       # Mobile/responsive hook
│   │
│   ├── integrations/            # External service integrations
│   │   └── supabase/            # Supabase database and auth
│   │       ├── client.ts        # Supabase client instance
│   │       └── types.ts         # Auto-generated TypeScript types
│   │
│   ├── config/                  # Configuration and constants
│   │   ├── checkout.ts          # Tax, pickup hours, time slots
│   │   └── square.ts            # Square payment configuration
│   │
│   ├── lib/                     # Utility functions
│   │   ├── utils.ts             # General utilities (clsx, cn helpers)
│   │   └── format-hours.ts      # Business hours formatting
│   │
│   └── assets/                  # Static images and media
│
├── public/                      # Static files served as-is
│   ├── .well-known/            # Web server configuration
│   ├── images/
│   │   ├── categories/         # Category images
│   │   └── products/           # Product images
│   └── products/               # Legacy product data?
│
├── supabase/                    # Supabase configuration
│   ├── functions/              # Edge Functions (serverless)
│   └── .temp/                  # Temporary migration files
│
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.app.json           # App-specific TypeScript rules
├── tsconfig.node.json          # Build tool TypeScript rules
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS plugin configuration
├── eslint.config.js            # ESLint rules
├── package.json                # Dependencies and scripts
└── package-lock.json           # Locked dependency versions
```

## Directory Purposes

**pages/:**
- Purpose: Page-level components that map to routes via App.tsx
- Contains: Top-level page components (Home, Products, Admin, etc.)
- Key files: `Home.tsx` (landing), `Products.tsx` (catalog), `Admin.tsx` (dashboard), `Checkout.tsx` (payment)
- Routing: Each file is a page; routes are defined in `App.tsx`

**components/:**
- Purpose: Reusable UI components organized by feature
- Contains: Presentational components (no data fetching)
- Structure: Subdirectories by feature (home, products, admin, etc.) + ui/ for Shadcn primitives
- Pattern: Components receive data and callbacks as props

**components/ui/:**
- Purpose: Shadcn/ui primitive components (unstyled but accessible)
- Contains: Button, Input, Card, Dialog, Select, etc.
- Auto-generated: Copied from Shadcn library, never edit directly
- Extends: Uses Tailwind CSS and CVA for styling

**contexts/:**
- Purpose: Global state management via React Context API
- Contains: AuthContext (user, profile, auth methods), CartContext (cart items, operations)
- Pattern: Provider wraps App, hooks access via useAuth() and useCart()
- Lifecycle: Persist cart to localStorage, auth via Supabase session

**hooks/:**
- Purpose: Encapsulate server-state queries and mutations
- Contains: React Query hooks + Supabase client calls
- Pattern: `useQuery` for reads, `useMutation` for writes
- Naming: All start with `use-` prefix (use-products.ts, use-orders.ts)

**integrations/supabase/:**
- Purpose: Client-safe database and auth access
- Contents:
  - `client.ts`: Supabase client instance (initialized with env vars)
  - `types.ts`: Auto-generated TypeScript definitions from schema
- Never edit `types.ts`: Regenerated after migrations via `supabase gen types`

**config/:**
- Purpose: Business logic constants and config helpers
- Contents:
  - `checkout.ts`: Tax rate, pickup hours, available dates/times
  - `square.ts`: Square payment config
- Pattern: Export constants and pure functions for scheduling logic

**lib/:**
- Purpose: Reusable utility functions
- Contents: Format hours, CSS class helpers (clsx, cn), etc.
- Non-opinionated: Pure utility, no business logic

**supabase/:**
- Purpose: Supabase infrastructure configuration
- Contains:
  - `functions/`: Edge Functions (if any)
  - `.temp/`: Migration files during local development

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React root render
- `src/App.tsx`: Route definitions and provider setup
- `public/index.html`: HTML template (not shown, standard Vite)

**Configuration:**
- `vite.config.ts`: Vite build settings, @ alias, React SWC plugin
- `tsconfig.json`: TypeScript compiler options, @ path alias
- `tailwind.config.ts`: Tailwind CSS theme and plugin configuration
- `src/config/checkout.ts`: Business hours and fulfillment rules
- `.env.local`: Environment variables (not in repo, must be created locally)

**Core Logic:**
- `src/contexts/AuthContext.tsx`: User authentication and profile management
- `src/contexts/CartContext.tsx`: Shopping cart state and persistence
- `src/hooks/use-products.ts`: Product catalog queries
- `src/hooks/use-orders.ts`: Order management queries and mutations
- `src/hooks/use-analytics.ts`: Dashboard analytics data

**Testing:**
- No test files in repo (not yet implemented)
- Would go in `src/**/__tests__/` or `src/**/*.test.tsx`

## Naming Conventions

**Files:**
- Components: PascalCase (ProductDetail.tsx, CartDrawer.tsx)
- Hooks: kebab-case with `use-` prefix (use-products.ts, use-orders.ts)
- Utilities: kebab-case (format-hours.ts, utils.ts)
- Config: kebab-case (checkout.ts, square.ts)

**Directories:**
- Features: lowercase (products/, cart/, checkout/, admin/)
- UI: lowercase (ui/)
- Contexts: lowercase (contexts/)

**React Components:**
- Functional components: PascalCase with default export
- Custom hooks: camelCase starting with `use`
- Context: PascalCase (AuthContext, CartContext)

**Type/Interface Names:**
- Product, Order, CartItem: PascalCase
- Props interfaces: ComponentNameProps suffix (e.g., ProductCardProps)
- API response types: Often suffixed with Data (JoinedProductData)

## Where to Add New Code

**New Feature (e.g., Subscription Management):**
- Primary code: `src/pages/Subscriptions.tsx` (if full page) or `src/components/subscriptions/`
- Hooks: `src/hooks/use-subscriptions.ts`
- Context: `src/contexts/SubscriptionContext.tsx` (if global state needed)
- Config: `src/config/subscriptions.ts` (if business rules)
- Tests: `src/pages/__tests__/Subscriptions.test.tsx` or `src/hooks/__tests__/use-subscriptions.test.ts`

**New UI Component:**
- Location: `src/components/[feature]/ComponentName.tsx`
- Pattern: Receive data and callbacks as props, no data fetching
- Add exports to parent index.ts if creating barrel file

**New Hook (Data Fetching):**
- Location: `src/hooks/use-feature.ts`
- Pattern: Export interface for data shape + useQuery/useMutation hook
- Export types: `export type DataType = ...`

**New Admin Panel:**
- Location: `src/components/admin/FeaturePanel.tsx`
- Pattern: Self-contained component with inline queries/mutations
- Register in: `src/pages/Admin.tsx` as new tab

**Utilities & Helpers:**
- Shared helpers: `src/lib/utils.ts` or domain-specific `src/lib/[domain]-utils.ts`
- Business logic: `src/config/[domain].ts`
- Do not mix utilities and business logic

## Special Directories

**node_modules/:**
- Purpose: Dependencies
- Generated: Yes (via `npm install`)
- Committed: No

**dist/ (after build):**
- Purpose: Production build output
- Generated: Yes (via `npm run build`)
- Committed: No

**public/**
- Purpose: Static assets served at root (`/images/...`)
- Generated: No
- Committed: Yes

**supabase/.temp/:**
- Purpose: Temporary migration files during local dev
- Generated: Yes (during `supabase migration new`)
- Committed: No (add to .gitignore if not present)

---

*Structure analysis: 2026-02-25*
