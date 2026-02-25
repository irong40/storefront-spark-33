# Architecture

**Analysis Date:** 2026-02-25

## Pattern Overview

**Overall:** Layered frontend MVC with context-based state management and data-driven backend separation

**Key Characteristics:**
- Component-driven UI with React 18 + Vite
- Centralized state via React Context (Auth, Cart)
- React Query for server-state and API caching
- Single-source-of-truth routing with React Router v6
- Supabase for authentication and data storage
- Shadcn/ui for composable, accessible UI components

## Layers

**Presentation Layer:**
- Purpose: Render UI and handle user interactions
- Location: `src/pages/`, `src/components/`
- Contains: Page components, UI components (buttons, forms, cards), layout wrappers
- Depends on: Hooks, Contexts, UI library components
- Used by: BrowserRouter entry point in App.tsx

**State Management Layer:**
- Purpose: Manage application state (authentication, cart, UI state)
- Location: `src/contexts/` (AuthContext.tsx, CartContext.tsx)
- Contains: Context providers, context value types, state hooks
- Depends on: Supabase client, React hooks
- Used by: Any component that needs auth or cart data

**Data/API Integration Layer:**
- Purpose: Fetch, cache, and manage server data
- Location: `src/hooks/` (use-products.ts, use-orders.ts, use-analytics.ts, etc.)
- Contains: React Query hooks, data types, Supabase queries
- Depends on: Supabase client, @tanstack/react-query
- Used by: Components and pages that need data

**Backend Integration:**
- Purpose: Client-safe database and auth access
- Location: `src/integrations/supabase/`
- Contains: Supabase client, TypeScript type definitions (auto-generated)
- Depends on: @supabase/supabase-js
- Used by: All hooks and contexts

**Configuration Layer:**
- Purpose: Store business logic constants and helpers
- Location: `src/config/`
- Contains: Pickup schedules, tax rates, Square configuration
- Depends on: date-fns for date utilities
- Used by: Checkout logic, delivery/pickup scheduling

## Data Flow

**Product Browsing Flow:**

1. User navigates to `/products` or clicks category
2. Products page calls `useProducts(categorySlug)` hook
3. Hook queries Supabase `products` table with filters (active, is_available)
4. React Query caches result and manages loading/error states
5. Component receives data and renders product grid
6. User clicks product → `ProductDetail` page with `useProduct(slug)` hook
7. Hook fetches single product + product_size_overrides (variants) table
8. Returns enriched Product with variants array

**Cart Flow:**

1. CartProvider initializes on app load:
   - Generates or retrieves `cart_session_id` from localStorage
   - Looks up or creates `carts` record in Supabase
   - Fetches cart items with relationships (sizes, overrides, addons, flavors)
2. User clicks "Add to Cart":
   - `CartContext.addItem()` inserts into `cart_items` table
   - Fetches related size/addon/flavor data in parallel
   - Updates local state with enriched CartItem objects
3. Cart drawer updates in real-time on quantity/item changes
4. Checkout reads cart from context, calculates totals with tax

**Order Placement Flow:**

1. Checkout page displays summary + payment form
2. SquarePaymentForm handles payment tokenization
3. On payment success, `useCreateOrder()` mutation:
   - Generates order_number
   - Inserts order record with fulfillment details (pickup/delivery)
   - Inserts order_items from cart
   - Clears cart
   - Redirects to `/order-confirmation/:id`
4. OrderConfirmation page displays order details from `supabase.from('orders')`

**Authentication Flow:**

1. AuthProvider sets up Supabase auth listener on mount
2. `onAuthStateChange` event updates user and session state
3. If user exists, fetches customer_profiles record
4. Components access via `useAuth()` hook
5. On sign out, clears user, profile, and session state

**Admin Dashboard Flow:**

1. `/admin` page checks `useIsAdmin()` (checks customer_profiles.is_admin)
2. If not admin, redirects to home
3. Admin tabs load different panels:
   - Orders: `useOrders()` queries orders + order_items
   - Products: `useProducts()` for management
   - Analytics: `useAnalytics()` with time-period filtering
   - Users: `useUsers()` to view customer profiles
4. Forms use mutations to update Supabase (create, update, delete)

## Key Abstractions

**CartItem:**
- Purpose: Represents a product instance in cart with all customizations
- Examples: `src/contexts/CartContext.tsx` (lines 19-36)
- Pattern: Enriched data type that combines cart_items record with related entities (sizes, addons, flavors)

**Product:**
- Purpose: Product catalog entry with all variants and metadata
- Examples: `src/hooks/use-products.ts` (lines 15-42)
- Pattern: Base product record enriched with category and variants array

**Order & OrderWithItems:**
- Purpose: Complete order record with line items
- Examples: `src/hooks/use-orders.ts` (lines 5-10)
- Pattern: Root order + nested order_items array

**Data Fetching Pattern:**
- Purpose: Consistent async data loading with caching
- Examples: `useProducts()`, `useOrders()`, `useAnalytics()`
- Pattern: React Query useQuery with Supabase select, error handling, and optional caching keys

## Entry Points

**App Root:**
- Location: `src/main.tsx`
- Triggers: Browser loads index.html
- Responsibilities: Mount React app to DOM

**App Component:**
- Location: `src/App.tsx`
- Triggers: After React mount
- Responsibilities: Set up provider layers (QueryClient, AuthProvider, CartProvider, TooltipProvider), define all routes, render root layout

**Pages (Route Entry Points):**
- Home (`src/pages/Home.tsx`): Landing page with announcements, hero, featured products, testimonials
- Products (`src/pages/Products.tsx`): Product catalog with category filtering
- ProductDetail (`src/pages/ProductDetail.tsx`): Single product view with variants and add-to-cart
- Checkout (`src/pages/Checkout.tsx`): Cart review, fulfillment details, payment form
- OrderConfirmation (`src/pages/OrderConfirmation.tsx`): Order success page with details
- Auth (`src/pages/Auth.tsx`): Sign in/sign up page
- Account (`src/pages/Account.tsx`): User profile and order history
- Admin (`src/pages/Admin.tsx`): Admin dashboard with tabs for orders, products, analytics
- GiftCardBalance (`src/pages/GiftCardBalance.tsx`): Gift card lookup and balance check

## Error Handling

**Strategy:** Try-catch in async functions with toast notifications for user feedback; console.error for debugging

**Patterns:**
- Data loading errors log to console and show toast.error()
- Mutation errors (create/update/delete) return `{ error: Error | null }`
- Context functions wrap Supabase calls in try-catch, toast on failure
- No explicit error boundaries currently (could be improved for graceful degradation)

## Cross-Cutting Concerns

**Logging:**
- Console.error for errors in hooks and contexts
- No centralized logging framework (could add structured logging)

**Validation:**
- React Hook Form + Zod in ProductForm, Auth, and Checkout
- Client-side validation before submission
- No server-side validation layer yet (rely on Supabase RLS)

**Authentication:**
- Supabase Auth handles JWT tokens
- AuthContext provides session context globally
- Admin pages check `customer_profiles.is_admin` field
- No role-based access control (RBAC) beyond is_admin boolean

**Authorization:**
- Supabase Row Level Security (RLS) enforces data access rules
- Frontend checks `useIsAdmin()` for admin UI visibility
- No granular permission system (could add for future features)

---

*Architecture analysis: 2026-02-25*
