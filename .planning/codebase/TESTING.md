# Testing Patterns

**Analysis Date:** 2026-02-25

## Test Framework

**Status:** Not detected

**Finding:**
No test files (`.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx`) found in the codebase.
No test runner configuration files detected (`vitest.config.ts`, `jest.config.js`, etc.).
No testing libraries in devDependencies.

**Implication:**
This is a development codebase without automated tests. Quality assurance relies on:
- Manual testing during development
- Linting via ESLint (enforced naming, syntax, React hook rules)
- TypeScript compilation for type safety

## Code Quality Tooling

**Linting:**
- Framework: ESLint 9.32.0 (flat config format)
- Config location: `eslint.config.js`
- Plugins: react-hooks, react-refresh, typescript-eslint
- Run command: `npm run lint` (maps to `eslint .`)

**Type Checking:**
- Framework: TypeScript 5.8.3
- Config location: `tsconfig.json` (references `tsconfig.app.json` and `tsconfig.node.json`)
- Less strict configuration (see CONVENTIONS.md for settings)

## Setting Up Testing

**Recommended approach for this stack:**

Given the React 18 + Vite + TypeScript + Shadcn/ui stack, the following frameworks are suitable:

**Option 1: Vitest (Recommended for Vite projects)**
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

**Option 2: Jest**
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom @types/jest ts-jest
```

Vitest is preferred due to:
- Native Vite integration (no webpack config needed)
- Faster test execution
- ESM-first approach (matches project setup)

## Potential Test Locations

**Pattern observed in codebase:**
No test files present, but conventional locations would be:

**For unit tests (hooks/utilities):**
- `src/hooks/__tests__/use-products.test.ts`
- `src/lib/__tests__/utils.test.ts`
- `src/integrations/supabase/__tests__/client.test.ts`

**For component tests:**
- `src/components/products/__tests__/ProductCard.test.tsx`
- `src/components/cart/__tests__/AddToCartButton.test.tsx`
- `src/components/checkout/__tests__/SquarePaymentForm.test.tsx`

**For context tests:**
- `src/contexts/__tests__/CartContext.test.tsx`
- `src/contexts/__tests__/AuthContext.test.tsx`

**For integration tests:**
- `src/__tests__/integration/checkout.test.tsx`
- `src/__tests__/integration/product-variants.test.tsx`

## What Should Be Tested

**High Priority (Business Critical):**

1. **CartContext functions** (`src/contexts/CartContext.tsx`)
   - addItem: validates cart state update, handles missing cartId, triggers toast
   - removeItem: correctly removes from cart, refreshes items
   - updateQuantity: handles quantity <= 0 (triggers removeItem), updates state
   - subtotal calculation: correct price prioritization (override > size > base price)
   - reorderItems: filters unavailable products, tracks addedCount/skippedCount

2. **AuthContext functions** (`src/contexts/AuthContext.tsx`)
   - signUp: creates user, handles errors, returns error object
   - signIn: authenticates user, handles invalid credentials
   - signOut: clears user/profile/session state
   - updateProfile: updates profile data, syncs state
   - fetchProfile: loads customer profile from DB

3. **useProducts hook** (`src/hooks/use-products.ts`)
   - useProducts: filters by category slug, returns active products
   - useProduct: fetches single product with variants (product_size_overrides)
   - useFeaturedProducts: returns featured products limited to 4

4. **useOrders hooks** (`src/hooks/use-orders.ts`)
   - useOrders: filters archived vs non-archived correctly
   - useCreateOrder: calculates tax correctly (8%), generates order number, creates items
   - useUpdateOrderStatus: invalidates admin-orders query on success
   - useArchiveOrders/useUnarchiveOrders: applies status correctly

5. **Payment processing** (`src/components/checkout/SquarePaymentForm.tsx`)
   - processPayment: sends correct payload to edge function
   - Error handling: distinguishes edge function errors from payment errors
   - Token validation: handles token status errors correctly
   - Wallet type detection: identifies apple_pay, google_pay, card

**Medium Priority (Feature Correctness):**

- ProductForm validation (name required, slug generation, image upload)
- AddToCartButton state management (loading, disabled states)
- Price calculations in cart (addons, variants)
- Navigation and routing transitions

**Low Priority (Display/UI):**

- Component rendering with various props
- CSS class application (Tailwind)
- Icon display (Lucide)

## Mocking Strategy

**What to Mock:**

1. **Supabase client** - All database and auth operations
   ```typescript
   // Mock the supabase client for all hooks
   vi.mock('@/integrations/supabase/client', () => ({
     supabase: {
       from: vi.fn().mockReturnValue({
         select: vi.fn().mockReturnValue({
           eq: vi.fn().mockReturnValue({
             single: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
           }),
         }),
         insert: vi.fn().mockResolvedValue({ error: null }),
         update: vi.fn().mockReturnValue({
           eq: vi.fn().mockResolvedValue({ error: null }),
         }),
         delete: vi.fn().mockReturnValue({
           eq: vi.fn().mockResolvedValue({ error: null }),
         }),
       }),
       auth: {
         onAuthStateChange: vi.fn(),
         getSession: vi.fn(),
         signUp: vi.fn(),
         signInWithPassword: vi.fn(),
         signOut: vi.fn(),
         resetPasswordForEmail: vi.fn(),
       },
       functions: {
         invoke: vi.fn(),
       },
       storage: {
         from: vi.fn().mockReturnValue({
           upload: vi.fn(),
           getPublicUrl: vi.fn(),
         }),
       },
     },
   }))
   ```

2. **React Query** - When testing beyond hook behavior
   ```typescript
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

   const createTestQueryClient = () => new QueryClient({
     defaultOptions: {
       queries: { retry: false },
       mutations: { retry: false },
     },
   });
   ```

3. **Toast notifications** (sonner and custom useToast)
   ```typescript
   vi.mock('sonner', () => ({
     toast: {
       success: vi.fn(),
       error: vi.fn(),
     },
   }));
   ```

**What NOT to Mock:**

- React hooks (useState, useContext, useEffect) - test with actual behavior
- Routing (react-router-dom) - mount components in routing context
- UI components from `@/components/ui/` - test with real components
- TypeScript types - no mocking needed

## Example Test Patterns

**Hook Test Pattern:**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from '@/hooks/use-products';

vi.mock('@/integrations/supabase/client');

describe('useProducts', () => {
  it('should fetch active products', async () => {
    const { result } = renderHook(() => useProducts(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={testQueryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[0].active).toBe(true);
  });

  it('should filter by category slug', async () => {
    const { result } = renderHook(() => useProducts('beverages'), {
      wrapper: QueryClientProvider,
    });

    await waitFor(() => !result.current.isLoading);
    expect(supabase.from).toHaveBeenCalledWith('products');
  });
});
```

**Context Test Pattern:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '@/contexts/CartContext';

vi.mock('@/integrations/supabase/client');

function TestComponent() {
  const { items, addItem } = useCart();
  return (
    <>
      <button onClick={() => addItem('prod-1', 2)}>Add</button>
      <span>{items.length} items</span>
    </>
  );
}

describe('CartContext', () => {
  it('should add item to cart', async () => {
    render(<CartProvider><TestComponent /></CartProvider>);
    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(screen.getByText('1 items')).toBeInTheDocument();
    });
  });
});
```

**Component Test Pattern:**
```typescript
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/products/ProductCard';
import { BrowserRouter } from 'react-router-dom';

const mockProduct = {
  id: '1',
  name: 'Green Juice',
  slug: 'green-juice',
  price: 8.99,
  image_url: 'http://example.com/img.jpg',
  is_featured: true,
  is_available: true,
  // ... required fields
};

describe('ProductCard', () => {
  it('should render product name and featured badge', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} />
      </BrowserRouter>
    );

    expect(screen.getByText('Green Juice')).toBeInTheDocument();
    expect(screen.getByText(/Best Seller/i)).toBeInTheDocument();
  });
});
```

**Async Test Pattern:**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('SquarePaymentForm', () => {
  it('should show loading state during payment processing', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    render(
      <SquarePaymentForm
        amountInCents={999}
        sessionId="sess-1"
        onSuccess={onSuccess}
        onError={onError}
      />
    );

    // Simulate payment submission
    const button = screen.getByText(/Pay/i);
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Processing payment/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

## Coverage Targets

**Recommended coverage:**
- Statements: 70-80%
- Branches: 65-75%
- Functions: 70-80%
- Lines: 70-80%

**Critical paths (aim for 90%+):**
- `src/contexts/` (state management)
- `src/hooks/use-products.ts`, `use-orders.ts`, `use-cart.ts`
- `src/lib/utils.ts`
- Payment/checkout logic

**Lower priority (<50% acceptable initially):**
- UI component rendering variations
- Marketing pages (Home, About, Contact)

## Running Tests (When Implemented)

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific file
npm run test -- useProducts

# UI for test results
npm run test:ui
```

---

*Testing analysis: 2026-02-25*

**Note:** This document describes testing strategy and patterns the codebase should adopt. Currently, no automated tests are present. Implementation should begin with critical business logic (cart, auth, payments) before moving to UI components.
