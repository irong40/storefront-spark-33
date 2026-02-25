# Codebase Concerns

**Analysis Date:** 2026-02-25

## TypeScript Configuration Issues

**Loose Type Safety:**
- Issue: TypeScript strict mode disabled (`"strict": false`) in `tsconfig.app.json`, plus explicit `noImplicitAny: false`, `strictNullChecks: false`, and `noUnusedLocals: false`
- Files: `tsconfig.app.json`, `tsconfig.json`
- Impact: Allows implicit `any` types, null/undefined errors slip through at runtime, unused variables don't trigger errors. Type safety is the primary defense against bugs in a payment-handling application
- Fix approach: Enable `"strict": true` and fix resulting type errors incrementally. Start with payment-related files (`src/components/checkout/`, `src/contexts/CartContext.tsx`)

**Type Assertion Workarounds:**
- Issue: Use of `as unknown as` type casts in data transforms (e.g., `CartContext.tsx:159`)
- Files: `src/contexts/CartContext.tsx`
- Impact: Bypasses type checking, masks data shape mismatches that could cause runtime errors
- Fix approach: Fix source data shapes from Supabase queries instead of casting. Use proper type guards

## State Management & Data Handling

**Excessive localStorage Usage Without Validation:**
- Issue: `localStorage.getItem("cart_session_id")` called without checking validity or expiration. No serialization/deserialization validation for stored data
- Files: `src/contexts/CartContext.tsx` (lines 71-76), `src/pages/Checkout.tsx` (line 293)
- Impact: Corrupted or stale session data could break cart functionality. No replay attack protection
- Fix approach: Add session timestamp validation, encrypt sensitive data, or move to sessionStorage with proper expiration

**Cart State Sync Complexity:**
- Issue: Multiple async operations in `CartProvider` (`fetchCartItems`, `addItem`, `updateQuantity`) with no transaction guarantee. State updates not atomic
- Files: `src/contexts/CartContext.tsx`
- Impact: Race conditions possible - user clicks "add to cart" twice rapidly, both queries fire, items could be duplicated or lost
- Fix approach: Implement request deduplication (use AbortController), add optimistic UI updates with rollback on failure, or debounce mutations

**Gift Card Balance Not Persisted Securely:**
- Issue: Gift card balance stored in `state` (`appliedGiftCards` array) only. No server-side validation that applied amount matches backend balance before checkout
- Files: `src/pages/Checkout.tsx` (lines 45-49, 113-170)
- Impact: User could modify client-side state and apply more gift card value than available. Fraud vector
- Fix approach: Move redemption logic to Supabase edge function. Server validates balance at payment time, not client

## Security Concerns

**Missing Error Boundary & Suspense Handling:**
- Issue: No `<ErrorBoundary>` components found in entire codebase. No `<Suspense>` fallbacks for async queries
- Files: All pages and components
- Impact: Single component error crashes entire page. Users see blank screen instead of graceful error message
- Fix approach: Add Error Boundary wrapper in `src/App.tsx`, add Suspense fallbacks in data-fetching components

**Public Credentials in Config:**
- Issue: Square `applicationId` and `locationId` hardcoded in `src/config/square.ts` (lines 3-5)
- Files: `src/config/square.ts`
- Impact: Credentials are public by design (Square requires this), but not validated. No protection against malicious Square API calls using these IDs
- Fix approach: This is acceptable for Square, but add HMAC validation on edge function responses. Also ensure `sessionId` validation in payment handler

**Session ID Used for Server-Side Validation Without Cryptographic Protection:**
- Issue: `sessionId` is `crypto.randomUUID()` but transmitted in plaintext. Used to validate cart amount on backend, but no signature verification
- Files: `src/contexts/CartContext.tsx`, `src/components/checkout/SquarePaymentForm.tsx`
- Impact: Attacker could guess UUIDs or modify sessionId to target other users' carts. No integrity guarantee
- Fix approach: Add HMAC-SHA256 signature to sessionId, validate on server. Or use server-issued tokens with expiration

**Payment Form Sends sourceId + sessionId Only (Good Design, but Validate):**
- Issue: Correctly doesn't send `amountInCents` to client-side form, delegates to edge function via `sessionId`
- Files: `src/components/checkout/SquarePaymentForm.tsx` (lines 54-62)
- Impact: If edge function is compromised, all payments vulnerable. Also no request origin validation
- Fix approach: Ensure edge function validates request origin (Referer header), validates session ownership vs user ID

**Console.error Leaks Implementation Details:**
- Issue: 30+ `console.error()` calls throughout codebase without sanitization. Production builds still include these
- Files: `src/components/admin/`, `src/contexts/`, `src/hooks/`
- Impact: Errors logged to browser console reveal database errors, API issues. Attackers can use this for reconnaissance
- Fix approach: Use logger with environment-based filtering. Never log database column names or full error objects in production

## Testing & Reliability

**No Test Coverage:**
- Issue: Zero test files found. No unit, integration, or E2E tests
- Files: None (gap)
- Impact: Refactoring breaks production without detection. Cart/payment logic untested, gift card edge cases not validated
- Fix approach: Add Jest/Vitest. Start with critical paths: cart operations, gift card logic, payment integration

**Error Handling Lacks Standardization:**
- Issue: Each hook/component catches errors differently. Some return `{ error }`, some throw, some use `toast()`
- Files: `src/hooks/use-gift-card.ts`, `src/hooks/use-loyalty.ts`, `src/contexts/CartContext.tsx`, `src/contexts/AuthContext.tsx`
- Impact: Error states not consistently displayed. User might not know operation failed
- Fix approach: Create centralized error handler. Standardize all API calls to return `{ data?, error? }` or throw custom errors with user-facing messages

**No Loading State in Some Critical Paths:**
- Issue: `useGiftCard()` returns `isLoading`, but `Checkout.tsx` doesn't disable form while checking balance
- Files: `src/pages/Checkout.tsx`, `src/hooks/use-gift-card.ts`
- Impact: User can submit form multiple times while gift card is being validated. Multiple concurrent requests
- Fix approach: Set `disabled` on form inputs based on `giftCardLoading` and `isSubmitting` flags

## Performance & Complexity

**Monolithic Admin Component:**
- Issue: `src/pages/Admin.tsx` (531 lines) handles 9+ different admin features in tabs. ProductVariantsPanel.tsx is 924 lines with deeply nested state
- Files: `src/pages/Admin.tsx`, `src/components/admin/ProductVariantsPanel.tsx`
- Impact: Hard to test, refactor, or reason about. State management is complex (size/addon/override forms all in one component)
- Fix approach: Extract dialog forms into separate custom hooks. Use a state machine for tab navigation. Break ProductVariantsPanel into SizesTab, AddonsTab, OverridesTab subcomponents

**Unconstrained useEffect Dependencies:**
- Issue: Multiple useEffect hooks with incomplete or overly broad dependency arrays (e.g., `ProductDetail.tsx` lines 70-95 has 5 items in deps)
- Files: `src/pages/ProductDetail.tsx`, `src/pages/Checkout.tsx`, other pages
- Impact: Unnecessary re-renders, fetches. Possible infinite loops if deps not carefully managed
- Fix approach: Audit all useEffect. Use ESLint `exhaustive-deps` rule. Consider extracting to custom hooks (useProductVariants, useGiftCardBalance)

**No Pagination on Orders/Products:**
- Issue: `useOrders()` and `useProducts()` queries fetch all records with no limit/offset
- Files: `src/hooks/use-orders.ts`, `src/hooks/use-products.ts`
- Impact: As catalog grows to 100+ products or 1000+ orders, initial load and admin UI will slow down significantly
- Fix approach: Add `limit` parameter to queries. Implement cursor-based pagination. Add server-side filtering on category/date

**Recharts Chart Component Uses dangerouslySetInnerHTML:**
- Issue: `src/components/ui/chart.tsx` line 51+ uses `dangerouslySetInnerHTML` for CSS variables
- Files: `src/components/ui/chart.tsx`
- Impact: If theme object ever accepts user input, could be XSS vector. Low risk currently, but fragile
- Fix approach: Keep this pattern but add strict validation/sanitization of ChartConfig input

## Data Integrity & Validation

**No Input Validation on Size/Price Fields:**
- Issue: Size form in ProductVariantsPanel accepts any string for `size_oz`, no validation that it's numeric or > 0
- Files: `src/components/admin/ProductVariantsPanel.tsx` (lines 104-110, 153+)
- Impact: Could save invalid sizes (negative, NaN, empty). Cart calculations would fail or return wrong totals
- Fix approach: Add Zod schemas. Validate on client (better UX) and server (security). Handle numeric parsing explicitly

**Gift Card Code Validation Insufficient:**
- Issue: Code formatting in `GiftCardBalance.tsx` (lines 32-38) uses simple regex replacement, but no checksum validation
- Files: `src/pages/GiftCardBalance.tsx`, `src/hooks/use-gift-card.ts`
- Impact: Malformed codes accepted, wasted API calls. No detection of typos (e.g., GC-XXXX-XXXX-XXXC could mean wrong card)
- Fix approach: Add Luhn or similar checksum to gift card generation. Validate on client before server call

**Checkout Form Doesn't Validate Address Fields:**
- Issue: Shipping address fields optional for pickup, required for delivery. No client validation
- Files: `src/pages/Checkout.tsx` (lines 76-90, 196-205)
- Impact: User can proceed with incomplete data. Server rejects order, confusing user
- Fix approach: Use Zod + react-hook-form for form validation. Create conditional schemas (pickup vs delivery)

**Product Availability Not Atomic:**
- Issue: Product marked `is_available` but could be out of stock. No stock check at cart-add time
- Files: `src/contexts/CartContext.tsx`, `src/hooks/use-products.ts`
- Impact: User adds out-of-stock item to cart, progresses to checkout, payment fails or order can't be fulfilled
- Fix approach: Check `stock_quantity > 0` before adding. Return inventory error from edge function. Implement stock hold on checkout initiation

## Fragile Areas

**Product Slug-Based Feature Flags:**
- Issue: `ProductDetail.tsx` (lines 25-42) uses hardcoded product slug strings to determine behavior (flavor limits, detox packages)
- Files: `src/pages/ProductDetail.tsx`
- Impact: Adding new product type requires code change. Renaming slug breaks feature. No audit trail
- Fix approach: Add `type` or `category` enum field to products table. Use that instead of slug matching

**Style String Ordering/Naming Issues:**
- Issue: No consistent naming for Tailwind breakpoints. `className` strings are inline and untyped, easy to make typos
- Files: Throughout components
- Impact: Responsive design breaks silently. CSS classes don't match actual class names
- Fix approach: Use `clsx()` or `cn()` consistently. Consider CSS modules or CSS-in-JS for type safety

**Hardcoded Dates/Times:**
- Issue: `checkout.ts` config file (line 40) hardcodes pickup cutoff times. Closed dates hardcoded
- Files: `src/config/checkout.ts`
- Impact: Holiday hours can't be updated without code deploy. No flexibility for special hours
- Fix approach: Move to database table `business_settings` or `schedule`. Query at runtime. Cache with 1-hour TTL

**Product Image Upload Security:**
- Issue: File upload in ProductForm (lines 68-80) uses `fileName` created from slug + timestamp. No file type validation, no max size check
- Files: `src/components/admin/ProductForm.tsx`
- Impact: Could upload malicious files (SVG with JS, oversized images). No storage quota protection
- Fix approach: Validate MIME type on client, compress with sharp, add max file size (5MB). Implement storage quota per location

## Dependencies at Risk

**Supabase Client Auto-Refresh Without Error Handling:**
- Issue: `src/integrations/supabase/client.ts` sets `autoRefreshToken: true` but no handling if refresh fails
- Files: `src/integrations/supabase/client.ts`
- Impact: If auth service is down, tokens expire and user is logged out without warning
- Fix approach: Add `onAuthStateChange` listener to detect token refresh failures. Show warning, prompt re-login

**React Query Not Configured for Offline:**
- Issue: No `networkMode` config, no custom retry logic for failed queries
- Files: `src/hooks/use-*.ts`
- Impact: Network hiccup causes immediate failure. No exponential backoff. User experience poor on unstable connections
- Fix approach: Add `retry: 3, retryDelay: (attempt) => attempt * 1000` to queryClient defaults

**No Fallback Image Handling:**
- Issue: Product images fail silently if URL 404s. No placeholder or error UI
- Files: Components rendering `image_url`
- Impact: Products appear broken. No way to know if image upload succeeded
- Fix approach: Add `onError` handler to `<img>` tags, show Shadcn Image component with fallback icon

## Scalability Concerns

**N+1 Queries in Cart:**
- Issue: `CartContext.fetchCartItems()` fetches cart items, then maps IDs to fetch sizes, addons, flavors separately (no batch)
- Files: `src/contexts/CartContext.tsx` (lines 200+)
- Impact: 100-item cart = 1 query + N queries for sizes. Slow. Repeated API calls
- Fix approach: Use Supabase `in()` filters to batch fetch. Or create materialized view `cart_items_expanded`

**Admin Orders Table Has No Filtering/Search:**
- Issue: `OrdersTable.tsx` fetches all orders, renders all rows with no server-side filter
- Files: `src/components/admin/OrdersTable.tsx`
- Impact: 1000+ orders = slow table render, high memory usage, unusable
- Fix approach: Add search box, date range picker. Move filtering to Supabase query. Implement virtual scrolling

## Build & Deployment

**Lovable Tagger in Production:**
- Issue: `vite.config.ts` (line 4) imports `lovable-tagger` component tagging tool in dev mode
- Files: `vite.config.ts`
- Impact: Adds dependency on Lovable infrastructure. If Lovable service down, dev builds fail
- Fix approach: Make this optional. Add env var to disable. Consider removing if not using Lovable UI builder

**No Environment Variable Validation:**
- Issue: Supabase URL/key accessed directly from `import.meta.env` with no null checks
- Files: `src/integrations/supabase/client.ts`
- Impact: If env vars missing, app loads blank page. No helpful error message
- Fix approach: Validate env vars at startup. Show helpful error if Supabase config missing

---

*Concerns audit: 2026-02-25*
