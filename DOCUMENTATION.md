# JuiceBar - Application Documentation

> Cold-pressed juice e-commerce platform with online ordering, loyalty rewards, gift cards, and Square payment processing.

**Stack**: Vite + React 18 + TypeScript + Shadcn/ui + Tailwind CSS + Supabase + Square Payments + TanStack Query
**Origin**: Lovable-generated, locally maintained
**Deploy target**: Vercel

---

## Table of Contents

1. [Routes & Pages](#routes--pages)
2. [Database Schema](#database-schema)
3. [Edge Functions](#edge-functions)
4. [Feature Breakdown](#feature-breakdown)
5. [Component Architecture](#component-architecture)
6. [Hooks](#hooks)
7. [Configuration](#configuration)
8. [Build & Tooling](#build--tooling)
9. [Migrations](#migrations)
10. [Public Assets](#public-assets)

---

## Routes & Pages

| Route | Page Component | Description |
|-------|---------------|-------------|
| `/` | `Home.tsx` | Hero, announcements, benefits bar, featured products, testimonials, locations |
| `/products` | `Products.tsx` | Full catalog with category filtering (`?category=slug`), product grid |
| `/products/:slug` | `ProductDetail.tsx` | Single product with variants, sizes, flavors, add-ons, gift card form |
| `/about` | `About.tsx` | Founder story, mission, values (6 cards), cold-press process (4 steps) |
| `/contact` | `Contact.tsx` | Contact form (name/email/phone/subject/message), business info, Google Map embed |
| `/auth` | `Auth.tsx` | Login / signup / password reset tabs. Redirects admins to `/admin` |
| `/reset-password` | `ResetPassword.tsx` | New password form triggered from email recovery link |
| `/account` | `Account.tsx` | Profile tab (name, phone) + order history tab with reorder button |
| `/account/orders` | `Account.tsx` | Same Account page, orders tab |
| `/checkout` | `Checkout.tsx` | Contact info, fulfillment type (pickup/delivery), gift card codes, Square payment |
| `/order-confirmation/:id` | `OrderConfirmation.tsx` | Success page with order number, items, totals, fulfillment details |
| `/gift-cards/balance` | `GiftCardBalance.tsx` | Check gift card balance by code (GC-XXXX-XXXX-XXXX format) |
| `/rewards` | `LoyaltyDashboard` | Member tier, points balance, transaction history, reward redemption |
| `/admin` | `Admin.tsx` | 13-tab admin dashboard (requires admin role) |
| `*` | `NotFound.tsx` | 404 page |

---

## Database Schema

### 18 Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `products` | Product catalog | name, slug, price, category_id, image_url, images[], features[], ingredients, nutrition_info, sku, stock_quantity, is_featured, is_available, active, compare_at_price, square_catalog_id, square_variation_id |
| `categories` | Product categories | name, slug, image_url, sort_order, active, square_category_id |
| `product_sizes` | Global size options | name, price, size_oz, sort_order, active |
| `product_size_overrides` | Per-product variant pricing | product_id, size_name, price, size_oz, is_subscription, subscription_interval, sort_order |
| `product_addons` | Add-ons (protein, supplements) | name, display_name, price, sort_order, active |
| `orders` | Customer orders | order_number, email, customer_name, phone, status, payment_status, payment_id, subtotal, tax, shipping, total, fulfillment_type, pickup_date, pickup_time, shipping_address, billing_address, notes, admin_notes |
| `order_items` | Order line items | order_id, product_id, product_name, product_price, quantity, total |
| `carts` | Shopping cart sessions | session_id, user_id |
| `cart_items` | Cart line items | cart_id, product_id, quantity, size_id, size_override_id, addon_ids[], selected_flavor_ids[], gift_card_data |
| `customer_profiles` | User profiles | email, full_name, phone, default_shipping_address, default_billing_address, marketing_opt_in |
| `user_roles` | RBAC roles | user_id, role (admin / moderator / user) |
| `gift_cards` | Gift card inventory | code, original_amount, balance, status, recipient_email, recipient_name, message, delivery_date, purchased_by, expires_at |
| `gift_card_transactions` | Gift card ledger | gift_card_id, order_id, type, amount, description |
| `loyalty_members` | Loyalty program members | user_id, points_balance, lifetime_points, tier |
| `loyalty_transactions` | Points earn/spend log | member_id, order_id, type, points, description |
| `loyalty_rewards` | Available rewards | name, description, points_required, reward_type, reward_value, min_order_amount, product_id |
| `loyalty_redemptions` | Reward redemptions | member_id, reward_id, order_id, code, points_spent, status, expires_at |
| `announcements` | Site-wide banners | message, emoji, is_active, starts_at, ends_at, sort_order |
| `business_settings` | Business config (single row) | business_name, tagline, description, email, phone, address, hours, social_links, logo_url, favicon_url |
| `contact_submissions` | Contact form entries | name, email, phone, subject, message, status, admin_notes |
| `square_merchant_tokens` | Square OAuth tokens | merchant_id, access_token, refresh_token, expires_at, location_id, is_active |

### Database Functions (RPC)

| Function | Purpose |
|----------|---------|
| `has_role(_user_id, _role)` | Check if user has a specific role |
| `calculate_loyalty_tier(lifetime_pts)` | Returns tier name from points threshold |
| `generate_gift_card_code()` | Generates GC-XXXX-XXXX-XXXX code |
| `generate_reward_code()` | Generates loyalty reward redemption code |
| `check_gift_card_balance(code)` | Returns balance, status, expiry for a gift card |
| `redeem_gift_card(code, amount, order_id?)` | Deducts from gift card balance, returns success + remaining |

### Enum

- `app_role`: `admin` | `moderator` | `user`

---

## Edge Functions

9 Supabase Edge Functions + 1 shared module:

| Function | Purpose |
|----------|---------|
| `process-payment` | Server-side Square payment processing. Validates cart server-side (recalculates subtotal from DB), applies 8% tax, calls Square v2/payments API. Returns payment_id, status, receipt_url, card details |
| `send-order-confirmation` | Sends HTML order confirmation email via Resend. Escapes user input for HTML injection prevention. Supports guest checkout |
| `create-user` | Admin user creation |
| `generate-product-image` | AI product image generation |
| `refresh-square-token` | Square OAuth token refresh |
| `reset-user-password` | Admin-triggered password reset |
| `square-webhook` | Square payment event webhook handler |
| `sync-square-catalog` | Syncs product catalog from Square POS |
| `sync-square-inventory` | Syncs inventory levels from Square |
| `_shared/` | Shared utilities across functions |

---

## Feature Breakdown

### Product System
- **Standard juices**: Sizes + add-ons (protein, supplements) + quantity
- **Wellness shots**: Fixed $3 price, no variants
- **Detox packages**: Fixed bundles, no variants or add-ons
- **Sample boxes / subscriptions**: Flavor selection (multi-select from product catalog)
- **Gift cards**: eGift card with recipient email, name, message, delivery date
- **Product variants**: Per-product size overrides with custom pricing, subscription intervals
- **Compare-at pricing**: Strikethrough original price for sales
- **Featured products**: Admin-curated featured flag
- **Category filtering**: URL-driven category filter on catalog page
- **Square sync**: Two-way catalog and inventory sync with Square POS

### Shopping Cart
- Server-side cart (Supabase `carts` + `cart_items` tables)
- Session-based (24-hour TTL, `localStorage` session ID)
- Supports sizes, variant overrides, add-ons, flavor selections, gift card data
- Mutex pattern for concurrent mutation safety
- Debounced refetch (300ms) for rapid quantity changes
- AbortController to cancel stale fetches
- Reorder from past orders

### Checkout
- Contact info collection (email, name, phone)
- **Pickup**: Tue-Fri 10AM-6PM, Sat 10AM-5PM, 30-min time slots
- **Delivery**: Mon-Fri, free delivery
- Gift card application (multiple codes, partial balance)
- Order notes
- Zod validation with conditional fields based on fulfillment type
- Square Web Payments SDK (Apple Pay, Google Pay, credit card)
- Zero-dollar order handling (fully covered by gift cards)
- Order confirmation email via Resend
- Server-side cart total validation in edge function

### Gift Cards
- Code format: `GC-XXXX-XXXX-XXXX`
- Purchase as eGift card (recipient email, name, message, scheduled delivery)
- Balance check page (`/gift-cards/balance`)
- Redeem during checkout (multiple codes, partial balances)
- Transaction ledger tracking all debits/credits
- Admin management panel

### Loyalty Program
- **Tiers**: Bronze (0-199), Silver (200-499), Gold (500-999), Platinum (1000+) lifetime points
- Points earned on purchases
- Redeemable rewards: discounts, free products, free shipping
- Redemption codes with expiry
- Transaction history
- Admin management panel
- Auto-tier calculation via `calculate_loyalty_tier()` RPC

### Authentication
- Email/password signup with email confirmation
- Login with redirect (admin -> `/admin`, user -> `/account`)
- Password reset via email link
- Customer profile (name, phone, addresses, marketing opt-in)
- Role-based access: admin, moderator, user

### Admin Dashboard (13 Tabs)
1. **Analytics** - Revenue chart, category breakdown, top products, peak hours, customer metrics, activity feed, KPI cards
2. **Orders** - Order list with status management (pending/confirmed/preparing/ready/completed/cancelled), archival, manual order creation
3. **Products** - Full CRUD for products with image, description, pricing, features, ingredients, nutrition, SKU, stock
4. **Variants** - Manage product_size_overrides (per-product sizes, subscription pricing)
5. **Gift Cards** - Create and manage gift cards
6. **Featured** - Toggle which products appear in featured section
7. **Announcements** - Create/edit site-wide banners with emoji, date range, sort order
8. **Users** - User management and role assignment
9. **Messages** - View and respond to contact form submissions
10. **Loyalty** - Manage loyalty rewards, view members and transactions
11. **Categories** - CRUD for product categories
12. **Settings** - Business name, contact info, hours, social links, logos
13. **Help** - Admin help documentation

---

## Component Architecture

```
src/
├── App.tsx                          # Root: providers, router, global components
├── main.tsx                         # Entry point
├── contexts/
│   ├── AuthContext.tsx               # Auth state, profile, signUp/signIn/signOut
│   └── CartContext.tsx               # Cart state, add/remove/update, mutex, session
├── components/
│   ├── layout/
│   │   ├── Layout.tsx               # Header + main + Footer wrapper
│   │   ├── Header.tsx               # Fixed nav, cart badge, mobile menu, admin link
│   │   └── Footer.tsx               # 4-column footer, social links, legal
│   ├── home/
│   │   ├── Hero.tsx                 # Hero section with tagline
│   │   ├── AnnouncementBanner.tsx   # Scrolling promotional banner
│   │   ├── BenefitsBar.tsx          # Value propositions strip
│   │   ├── FeaturedProducts.tsx     # Featured product cards
│   │   ├── Categories.tsx           # Category preview grid
│   │   ├── MenuPreview.tsx          # Quick menu peek
│   │   ├── Testimonials.tsx         # Customer reviews
│   │   ├── Story.tsx                # Brand story section
│   │   ├── Locations.tsx            # Physical store info
│   │   ├── Newsletter.tsx           # Email signup
│   │   └── CTA.tsx                  # Call-to-action block
│   ├── products/
│   │   ├── ProductGrid.tsx          # Responsive product grid
│   │   ├── ProductCard.tsx          # Product card (image, name, price, category)
│   │   ├── ProductVariantSelector.tsx # Size/subscription variant picker
│   │   ├── FlavorSelector.tsx       # Multi-select flavor picker for bundles
│   │   ├── CategoryFilter.tsx       # Category filter dropdown/buttons
│   │   └── GiftCardForm.tsx         # Recipient details for eGift cards
│   ├── cart/
│   │   ├── CartDrawer.tsx           # Slide-out cart panel
│   │   ├── CartItem.tsx             # Cart line item display
│   │   └── AddToCartButton.tsx      # Add-to-cart with validation
│   ├── checkout/
│   │   └── SquarePaymentForm.tsx    # Square SDK: Apple/Google/card payment
│   ├── loyalty/
│   │   └── LoyaltyDashboard.tsx     # Member tier, points, rewards, history
│   ├── admin/
│   │   ├── OrdersTable.tsx          # Order list + status management
│   │   ├── AdminProductsTab.tsx     # Product CRUD
│   │   ├── ProductForm.tsx          # Product create/edit form
│   │   ├── ProductVariantsPanel.tsx # Size override management
│   │   ├── GiftCardsPanel.tsx       # Gift card admin
│   │   ├── FeaturedProductsPanel.tsx # Featured product toggle
│   │   ├── AnnouncementsPanel.tsx   # Announcement management
│   │   ├── UserManagementPanel.tsx  # User/role admin
│   │   ├── BusinessSettingsForm.tsx # Business settings editor
│   │   ├── CategoriesPanel.tsx      # Category CRUD
│   │   ├── ContactSubmissionsPanel.tsx # Contact form inbox
│   │   ├── LoyaltyAdminPanel.tsx    # Loyalty program admin
│   │   ├── CreateOrderDialog.tsx    # Manual order creation
│   │   ├── AdminHelpPanel.tsx       # Help docs
│   │   └── analytics/
│   │       ├── AnalyticsDashboard.tsx
│   │       ├── RevenueChart.tsx
│   │       ├── CategoryChart.tsx
│   │       ├── TopProductsPanel.tsx
│   │       ├── PeakHoursPanel.tsx
│   │       ├── CustomerMetricsPanel.tsx
│   │       ├── KPICard.tsx
│   │       └── ActivityFeed.tsx
│   ├── ui/                          # 40+ Shadcn/ui primitives
│   ├── ErrorBoundary.tsx
│   ├── ScrollToTop.tsx
│   └── NavLink.tsx
├── hooks/                           # (see Hooks section)
├── config/                          # (see Configuration section)
├── integrations/supabase/
│   ├── client.ts                    # Supabase client init
│   └── types.ts                     # Auto-generated DB types
└── lib/
    ├── utils.ts                     # cn(), generateOrderNumber()
    ├── logger.ts                    # Dev-only console logger
    └── format-hours.ts             # Business hours formatting
```

---

## Hooks

| Hook | Purpose |
|------|---------|
| `useProducts(categorySlug?)` | Fetch products with category joins and variants |
| `useProduct(slug)` | Single product by slug |
| `useFeaturedProducts()` | Featured products query |
| `useOrders()` | Admin: all orders with items |
| `useUpdateOrderStatus()` | Admin: change order status |
| `useArchiveOrders()` / `useUnarchiveOrders()` | Admin: order archival |
| `useCreateOrder()` | Admin: manual order creation |
| `useCustomerOrders()` | Customer: own order history |
| `useBusinessSettings()` | Single business_settings row |
| `useCategories()` | All active categories |
| `useAnnouncements()` | Active announcements |
| `useLoyaltyMember()` | Current user's loyalty membership |
| `useLoyaltyTransactions()` | Points transaction history |
| `useLoyaltyRewards()` | Available rewards catalog |
| `useLoyaltyRedemptions()` | User's redemption history |
| `useRedeemReward()` | Redeem a reward for points |
| `useJoinLoyalty()` | Enroll in loyalty program |
| `useGiftCard()` | checkBalance() and redeemGiftCard() |
| `useProductVariants()` | Product size overrides and add-ons |
| `useSquareSync()` | Trigger Square catalog/inventory sync |
| `useAdmin()` | Admin role authorization check |
| `useUsers()` | Admin: user management |
| `useAnalytics()` | Admin: analytics data queries |
| `useDocumentTitle()` | Dynamic page title |
| `useMobile()` | Responsive breakpoint detection |

---

## Configuration

### `src/config/square.ts`
- `SQUARE_CONFIG.applicationId` from `VITE_SQUARE_APP_ID`
- `SQUARE_CONFIG.locationId` from `VITE_SQUARE_LOCATION_ID`
- Dev warnings if env vars missing

### `src/config/checkout.ts`
- `TAX_RATE`: 0.08 (8%)
- `DELIVERY_FEE`: 0 (free delivery)
- `PICKUP_HOURS`: Tue-Fri 10AM-6PM, Sat 10AM-5PM
- `DELIVERY_DAYS`: Mon-Fri
- `getAvailablePickupDates()` - Next 7 valid pickup days
- `getAvailableTimeSlots(dateStr)` - 30-min slots for a given day
- `formatTime(hour, min)` - 12-hour time format

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SQUARE_APP_ID` - Square application ID
- `VITE_SQUARE_LOCATION_ID` - Square location ID

---

## Build & Tooling

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite + React SWC plugin, `@/` path alias, dep optimization for react/react-dom |
| `tailwind.config.ts` | Brand colors (cream, terracotta, olive, mustard, berry, brown, kraft + ivory, stone, taupe, sage, charcoal). Fonts: Playfair Display (display), Cormorant (accent), Libre Franklin (body). Animations: fade-in, fade-in-up, slide-up, scale-in, float-card, marquee |
| `eslint.config.js` | ESLint 9 flat config with React Hooks + React Refresh plugins |
| `tsconfig.json` | TypeScript strict mode, `@/*` path alias |
| `postcss.config.js` | Tailwind + Autoprefixer |
| `components.json` | Shadcn/ui config (New York style, CSS variables) |

---

## Migrations

29 migration files (Jan 9 - Feb 11, 2026):

| Date | Migration | Purpose |
|------|-----------|---------|
| Jan 9 | 7 UUID-named migrations | Initial schema: products, categories, orders, order_items, carts, cart_items, customer_profiles, user_roles, business_settings, contact_submissions, announcements |
| Jan 11 | `reorganize_categories` | Category restructure |
| Jan 11 | `product_variants` | product_sizes, product_size_overrides tables |
| Jan 11 | `gift_cards` | gift_cards, gift_card_transactions tables |
| Jan 11 | `loyalty_program` | loyalty_members, loyalty_transactions, loyalty_rewards, loyalty_redemptions |
| Jan 11 | `inventory_sync_schedule` | Inventory sync scheduling |
| Jan 11 | UUID migration | Additional schema changes |
| Jan 12 | `add_product_images` | Product images support |
| Jan 13 | `seed_new_products` | Product seed data |
| Jan 13 | `update_prices` | Price adjustments |
| Jan 13 | `update_3pack` | 3-pack product update |
| Jan 13 | `loyalty_and_reporting` | Loyalty enhancements |
| Jan 13 | `gift_card_rpc` | Gift card RPC functions (check_balance, redeem, generate_code) |
| Jan 13-14 | 8 UUID migrations | Incremental schema refinements, product_addons, RLS policies |
| Feb 11 | `square_merchant_tokens` | Square OAuth token storage |

---

## Public Assets

```
public/
├── favicon.ico
├── favicon.jpg
├── favicon.png
├── og-image.jpg              # OpenGraph social preview
├── placeholder.svg
├── robots.txt
├── images/
│   ├── about-founder.png     # Founder photo for About page
│   ├── categories/           # Category hero images
│   └── products/             # Product photos
└── products/                 # Additional product assets (eGift cards)
```

---

## Key Architecture Patterns

- **Server-side cart**: Cart persisted in Supabase, not localStorage (supports cross-device)
- **Server-side price validation**: Edge function recalculates totals from DB before charging Square
- **Mutex + debounce on cart**: Prevents race conditions from rapid clicks, collapses fetches
- **AbortController**: Cancels stale cart fetches when newer requests are in flight
- **RPC for atomic operations**: Gift card balance check and redemption use Postgres functions
- **Role-based access**: `user_roles` table + `has_role()` RPC + `useAdmin()` hook
- **TanStack Query**: All data fetching with 5-min stale time, exponential retry backoff
- **Square dual-mode**: Detects sandbox vs production from token prefix
- **Lovable-generated UI**: Shadcn/ui components, consistent design system
