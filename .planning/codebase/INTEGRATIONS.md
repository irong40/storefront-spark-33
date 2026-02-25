# External Integrations

**Analysis Date:** 2026-02-25

## APIs & External Services

**Payment Processing:**
- Square (Payments API, Catalog API, Inventory API)
  - SDK/Client: React Square Web Payments SDK 3.3.0 (frontend)
  - Backend: Direct REST API calls via fetch in edge functions
  - Auth: OAuth 2.0 token stored in `square_merchant_tokens` table
  - Credentials:
    - Application ID: `SQUARE_APP_ID` (env var, public: sandbox-sq0idb-OCjdptlSLoTDl285-wMhDg)
    - Location ID: `SQUARE_LOCATION_ID` (env var, public: L31YY4ESCWKPH)
    - Access Token: `SQUARE_ACCESS_TOKEN` (env var, sensitive)
    - App Secret: `SQUARE_APP_SECRET` (env var, sensitive, used for OAuth refresh)
  - Endpoints:
    - Sandbox: `https://connect.squareupsandbox.com` (OAuth, payments)
    - Production: `https://connect.squareup.com`
  - Functions:
    - `process-payment` - Server-side payment processing via Square Payments API
    - `sync-square-catalog` - Sync Square catalog to Supabase products table
    - `sync-square-inventory` - Sync Square inventory to Supabase inventory table
    - `refresh-square-token` - Refresh OAuth token before expiration (7-day window)
    - `square-webhook` - Webhook handler for catalog and inventory updates

**Email Service:**
- Resend (Email delivery)
  - SDK/Client: Resend 2.0.0 (via esm.sh in Deno)
  - Auth: API key `RESEND_API_KEY` (env var, sensitive)
  - Function: `send-order-confirmation` - Sends order confirmation emails with HTML formatting
  - Sender: "Order Confirmation <onboarding@resend.dev>"

**Image Generation:**
- Lovable AI (Product image generation)
  - SDK/Client: Direct HTTP calls to Lovable API
  - Auth: API key `LOVABLE_API_KEY` (env var, sensitive)
  - Endpoint: `https://ai.gateway.lovable.dev/v1/chat/completions`
  - Function: `generate-product-image` - Generates AI product photos for juice bottles
  - Trigger: Admin portal product creation

## Data Storage

**Primary Database:**
- Supabase PostgreSQL
  - Project ID: qgaprpdwdvfttraqhydc
  - Tables include: products, orders, users, square_merchant_tokens, inventory, cart_items, gift_cards, loyalty_program, etc.
  - Client: @supabase/supabase-js 2.90.1
  - Connection: Via `supabase` client in `src/integrations/supabase/client.ts`
  - Auto schema generation: TypeScript types from `supabase/functions/types.ts` (auto-generated)

**File Storage:**
- Not explicitly configured in integrations
- Uses Supabase Storage (inferred from migrations: `add_product_images` migration)

**Caching:**
- TanStack React Query 5.83.0 - Client-side query caching
- Supabase real-time subscriptions (enabled via client config)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (Custom implementation)
  - Implementation: Session-based with localStorage persistence
  - Auto token refresh enabled
  - Context: `AuthContext.tsx` manages user session and profile data
  - Features:
    - User signup/login via Supabase Auth
    - Password reset via `reset-user-password` edge function
    - User profile fetching and caching
  - Edge function: `create-user` - Creates user profiles on signup

## Monitoring & Observability

**Error Tracking:**
- Not detected - Errors logged to console in edge functions

**Logs:**
- Console logging via `console.log()` and `console.error()` in edge functions
- Supabase edge function logs viewable in dashboard

## CI/CD & Deployment

**Hosting:**
- Supabase project (edge functions, database, auth)
- Frontend: Deployed via Lovable.dev or Vercel (SPA)
  - Lovable provides automatic git commits on changes

**CI Pipeline:**
- Lovable.dev provides automatic deployment on git push
- No explicit CI config detected (build handled by deployment platform)

## Environment Configuration

**Required env vars (Frontend - VITE_* prefix):**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Public API key for browser

**Required env vars (Edge Functions - Deno):**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin access)
- `SUPABASE_ANON_KEY` - Anonymous key
- `SQUARE_APP_ID` - Square application identifier
- `SQUARE_APP_SECRET` - Square OAuth secret (sensitive)
- `SQUARE_ACCESS_TOKEN` - Current merchant access token (stored in DB, env var fallback)
- `SQUARE_LOCATION_ID` - Square location identifier
- `LOVABLE_API_KEY` - Lovable AI API key (sensitive)
- `RESEND_API_KEY` - Resend email API key (sensitive)

**Secrets location:**
- Frontend: `.env` file (read by Vite at build time)
- Edge functions: Supabase project settings (env vars in dashboard)
- Fallback: Direct env var access via `Deno.env.get()` in functions

**Token Storage:**
- Square access tokens stored in `square_merchant_tokens` table with:
  - `access_token` - OAuth access token
  - `refresh_token` - OAuth refresh token
  - `location_id` - Associated location
  - `expires_at` - Token expiration timestamp
  - `is_active` - Boolean flag for active token
- Session tokens: Supabase auth tokens stored in localStorage (browser)

## Webhooks & Callbacks

**Incoming:**
- Square webhooks (catalog and inventory updates)
  - Endpoint: `supabase/functions/square-webhook` (unauthenticated for webhooks)
  - Events handled: `catalog.version.updated`, `inventory.count.updated`
  - Webhook triggers catalog/inventory sync functions
  - Verification: Square signature validation (configured in Supabase)

**Outgoing:**
- Edge function triggers within Supabase:
  - `process-payment` called from frontend checkout form
  - `send-order-confirmation` called after successful payment
  - `sync-square-catalog` called via webhook or scheduled
  - `sync-square-inventory` called via webhook or scheduled
  - `generate-product-image` called from admin for new products
  - `refresh-square-token` called via scheduled edge function or explicit trigger
  - `create-user` called on Supabase auth user creation trigger

## Third-Party SDKs Used

**Client-Side:**
- @supabase/supabase-js - Supabase client library
- react-square-web-payments-sdk - Square Web Payments form
- @tanstack/react-query - API data fetching and caching

**Server-Side (Edge Functions):**
- Supabase client library (esm.sh/supabase-js)
- Resend email SDK (esm.sh/resend)
- Standard Deno libraries (http/server, std utilities)

## API Endpoints Called

**Square:**
- `POST https://connect.squareupsandbox.com/v2/payments` (sandbox)
- `POST https://connect.squareup.com/v2/payments` (production)
- `POST https://connect.squareupsandbox.com/oauth2/token` (token refresh)
- `POST https://connect.squareup.com/oauth2/token` (production token refresh)
- Catalog sync via Square API (full catalog fetch)
- Inventory sync via Square API (inventory counts)

**Lovable AI:**
- `POST https://ai.gateway.lovable.dev/v1/chat/completions` - Generate product images

**Resend:**
- Email sending via Resend SDK methods

**Supabase Internal:**
- Real-time subscriptions for live data updates
- REST API calls via client SDK

---

*Integration audit: 2026-02-25*
