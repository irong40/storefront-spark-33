# Technology Stack

**Analysis Date:** 2026-02-25

## Languages

**Primary:**
- TypeScript 5.8.3 - Frontend application and edge functions
- JavaScript - Build configuration and tooling

**Secondary:**
- SQL - Database schema and migrations (Supabase)

## Runtime

**Environment:**
- Node.js (development) - via npm
- Deno 1.x (edge functions) - Supabase Functions runtime

**Package Manager:**
- npm - Primary package manager
- Lockfile: Present (package-lock.json implied)

## Frameworks

**Core:**
- React 18.3.1 - Frontend UI library
- Vite 7.3.1 - Build tool and dev server
- React Router DOM 6.30.1 - Client-side routing

**UI Components:**
- shadcn/ui - Component library built on Radix UI
- Radix UI (25+ primitives) 1.1.x - Headless UI component library
  - Accordion, Alert Dialog, Aspect Ratio, Avatar, Checkbox, Collapsible, Context Menu, Dialog, Dropdown Menu, Hover Card, Label, Menubar, Navigation Menu, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Slider, Slot, Switch, Tabs, Toast, Toggle, Toggle Group, Tooltip
- Tailwind CSS 3.4.17 - Utility-first CSS framework
- Tailwind CSS Animate 1.0.7 - Animation plugin

**Forms & Validation:**
- React Hook Form 7.61.1 - Form state management
- Zod 3.25.76 - TypeScript-first schema validation
- @hookform/resolvers 3.10.0 - Integration layer for form validation

**Data & State:**
- TanStack React Query 5.83.0 - Server state management and caching
- React Context API - Client state management (custom contexts)

**Styling:**
- Tailwind Merge 2.6.0 - Merge Tailwind classes safely
- Class Variance Authority 0.7.1 - Component variant patterns
- CLSX 2.1.1 - Conditional CSS class management

**UI Utilities:**
- Lucide React 0.462.0 - Icon library
- Embla Carousel React 8.6.0 - Carousel component
- React Resizable Panels 2.1.9 - Resizable layout panels
- React Day Picker 8.10.1 - Date picker component
- Input OTP 1.4.2 - OTP input component
- CMDK 1.1.1 - Command menu/palette component
- Sonner 1.7.4 - Toast notifications
- Vaul 0.9.9 - Drawer component
- Recharts 2.15.4 - Charting library
- Date-fns 3.6.0 - Date manipulation utilities
- Next Themes 0.3.0 - Dark mode theme management

**Payments:**
- React Square Web Payments SDK 3.3.0 - Square payment integration

**Backend Services:**
- Supabase (@supabase/supabase-js 2.90.1) - Backend platform with PostgreSQL, auth, edge functions
- Supabase Edge Functions (Deno-based) - Serverless functions

## Testing & Development

**Build:**
- Vite 7.3.1 - Bundler and dev server
- Vite SWC Plugin (@vitejs/plugin-react-swc 3.11.0) - Fast JavaScript transpilation

**Code Quality:**
- ESLint 9.32.0 - JavaScript linter
- @eslint/js 9.32.0 - ESLint configuration
- TypeScript ESLint 8.38.0 - TypeScript linting
- ESLint React Hooks Plugin 5.2.0 - React hooks linting
- ESLint React Refresh Plugin 0.4.20 - React refresh linting
- Globals 15.15.0 - Global variables for ESLint

**Styling Tools:**
- PostCSS 8.5.6 - CSS transformation
- Autoprefixer 10.4.21 - CSS vendor prefixing
- @tailwindcss/typography 0.5.16 - Typography plugin

**Development:**
- Lovable Tagger 1.1.13 - Component tagging/tracking for Lovable.dev
- TypeScript 5.8.3 - Static type checking
- @types/react 18.3.23 - React type definitions
- @types/react-dom 18.3.7 - React DOM type definitions
- @types/node 22.16.5 - Node.js type definitions

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.90.1 - Backend connectivity and authentication
- React 18.3.1 - Core UI rendering
- Vite 7.3.1 - Development and production builds
- TanStack React Query 5.83.0 - Data synchronization and caching

**Infrastructure:**
- React Router DOM 6.30.1 - Client-side navigation
- React Hook Form 7.61.1 - Form management
- React Square Web Payments SDK 3.3.0 - Payment processing
- Zod 3.25.76 - Runtime type validation

## Configuration

**Environment:**
- Vite environment variables (VITE_* prefix)
- Supabase environment variables:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_PUBLISHABLE_KEY` - Publishable API key
- Edge function environment variables:
  - `SUPABASE_URL` - Supabase project URL (server-side)
  - `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
  - `SUPABASE_ANON_KEY` - Anonymous key
  - `SQUARE_APP_ID` - Square application ID
  - `SQUARE_APP_SECRET` - Square application secret (sensitive)
  - `SQUARE_ACCESS_TOKEN` - Square merchant access token (sensitive)
  - `SQUARE_LOCATION_ID` - Square location identifier
  - `LOVABLE_API_KEY` - Lovable AI image generation API key (sensitive)
  - `RESEND_API_KEY` - Resend email service API key (sensitive)

**Build Configuration:**
- `vite.config.ts` - Vite bundler configuration
- `tsconfig.json` - TypeScript compiler options (base config with path aliases)
- `tsconfig.app.json` - App-specific TypeScript config
- `tsconfig.node.json` - Node tooling TypeScript config
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - ESLint configuration

## Platform Requirements

**Development:**
- Node.js (current stable recommended)
- npm for package management
- TypeScript support in IDE
- Deno CLI (for local edge function development/testing)

**Production:**
- Supabase project hosting (qgaprpdwdvfttraqhydc)
- Vercel or similar SPA hosting platform
- PostgreSQL database (provided by Supabase)

## Key Integration Points

**Supabase Project ID:** qgaprpdwdvfttraqhydc

**Edge Functions:**
- Deno standard library (std@0.168.0 and std@0.190.0)
- ESM HTTP library (esm.sh) for npm package imports in Deno

---

*Stack analysis: 2026-02-25*
