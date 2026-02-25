# Coding Conventions

**Analysis Date:** 2026-02-25

## Naming Patterns

**Files:**
- Components (PascalCase): `ProductCard.tsx`, `AdminHelpPanel.tsx`, `CartDrawer.tsx`
- Hooks (camelCase with `use-` prefix): `use-products.ts`, `use-orders.ts`, `use-cart.tsx`
- Context files (PascalCase): `CartContext.tsx`, `AuthContext.tsx`
- Configuration files (camelCase): `square.ts`, `checkout.ts`
- Utility files (camelCase): `utils.ts`, `format-hours.ts`
- UI component files (kebab-case): `alert-dialog.tsx`, `use-toast.ts`, `dropdown-menu.tsx`

**Functions:**
- React components: PascalCase (`ProductCard`, `useProducts`, `AuthProvider`)
- Utility functions: camelCase (`generateSlug`, `formatHours`, `fetchProfile`)
- Event handlers: camelCase with `handle` prefix (`handleNameChange`, `handleImageUpload`, `handleAdd`)
- Helper functions within functions: camelCase (`getSessionId`)

**Variables:**
- State variables: camelCase (`formData`, `isLoading`, `cartId`, `userProfile`)
- Boolean prefixes: `is` or `has` (`isOpen`, `hasDiscount`, `isFeatured`, `isLoading`)
- Database records/objects: camelCase (`item`, `product`, `order`, `variants`)
- Constants in camelCase: `queryClient`, `sessionId`, `SQUARE_CONFIG`

**Types:**
- Interfaces: PascalCase (`CartItem`, `Product`, `ProductVariant`, `AuthContextType`, `ProductFormProps`)
- Type aliases: PascalCase (`Order`, `OrderItem`, `OrderWithItems`, `ArchiveType`)
- Generic type parameters: PascalCase (`T`, `ItemType`)

## Code Style

**Formatting:**
- ESLint configured with TypeScript and React rules
- No formatter explicitly configured (Prettier not in devDependencies, but tailored ESLint rules present)
- Two-space indentation (implicit from codebase)
- Line length appears to follow 80-100 character convention based on file patterns

**Linting:**
- Tool: ESLint 9.32.0
- Config file: `eslint.config.js` (flat config format)
- Key rules:
  - `@typescript-eslint/no-unused-vars`: **off** (disabled)
  - `react-refresh/only-export-components`: warn (allows const exports)
  - `react-hooks/...`: recommended rules enforced
  - All JavaScript recommended rules enabled
  - All TypeScript recommended rules enabled

## Import Organization

**Order:**
1. React and core library imports (`import { useState } from "react"`)
2. Third-party UI/data library imports (`import { useQuery } from "@tanstack/react-query"`)
3. Internal component imports (`import { Button } from "@/components/ui/button"`)
4. Internal hook/context imports (`import { useCart } from "@/contexts/CartContext"`)
5. Internal type imports (`import type { Product } from "@/hooks/use-products"`)
6. Utility imports (`import { cn } from "@/lib/utils"`)

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- All imports use absolute paths via `@/` prefix
- No relative imports observed in codebase

**Example from `ProductCard.tsx`:**
```typescript
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { Product } from "@/hooks/use-products";
```

## Error Handling

**Patterns:**
- Try-catch blocks used for async operations with `.finally()` for cleanup
- Supabase error handling: check error object and throw if present
- Type guards for unknown error types: `err instanceof Error ? err.message : "fallback"`
- User feedback via `toast` (both `sonner` and custom `useToast` hook)
- Console logging for debugging (`console.error`, `console.log`)

**Example from `CartContext.tsx`:**
```typescript
try {
  const { error } = await supabase.from("cart_items").insert(insertData);
  if (error) throw error;
  await fetchCartItems(cartId);
  toast.success("Added to cart");
} catch (error) {
  console.error("Failed to add item to cart:", error);
  toast.error("Failed to add item to cart");
}
```

**Example from `SquarePaymentForm.tsx`:**
```typescript
catch (err: unknown) {
  const errorMessage =
    err instanceof Error ? err.message : "Payment failed. Please try again.";
  console.error("Payment processing error:", errorMessage);
  onError(errorMessage);
}
```

## Logging

**Framework:** Console API (no dedicated logging library)

**Patterns:**
- Error logging: `console.error("Operation description:", error)` after failures
- Debug logging: `console.log()` for state/action tracking (rare)
- Location: Within catch blocks and critical paths

**Examples:**
- `CartContext.tsx`: `console.error("Error initializing cart:", error)`
- `SquarePaymentForm.tsx`: `console.error("Card tokenization failed:", token)`
- `ProductForm.tsx`: `console.error("Upload error:", error)`

## Comments

**When to Comment:**
- Complex logic or non-obvious intent (rare in codebase)
- Workarounds or temporary solutions
- Explanations of business rules (e.g., price calculation)

**Examples from codebase:**
- `AddToCartButton.tsx` (lines 44-50): Long comment explaining the size ID mapping strategy
- `CartContext.tsx` (line 90): Inline comment explaining price prioritization logic
- `ProductForm.tsx` (line 53-58): Function documentation via comment

**JSDoc/TSDoc:**
- Not widely used
- Function signatures use TypeScript interfaces for documentation instead
- No comment blocks above functions observed

## Function Design

**Size:**
- Average hook size: 20-80 lines for simple queries, 100-200 lines for complex operations
- Average component size: 30-150 lines (smaller with complex logic extracted to hooks)
- Event handlers: 5-30 lines typically

**Parameters:**
- Destructured in function signature when possible
- Props interfaces defined with `Interface` suffix (e.g., `ProductCardProps`)
- Query/mutation payloads use inline object types or defined interfaces
- Default parameters used for optional values (e.g., `quantity = 1`)

**Return Values:**
- Components return JSX directly
- Hooks return results from `useQuery`/`useMutation` or custom state
- Async functions return Promise of typed object (e.g., `Promise<{ error: Error | null }>`)
- Mutations return structured responses with success/error/data fields

**Example hook signature:**
```typescript
export function useProducts(categorySlug?: string) {
  return useQuery({
    queryKey: ["products", categorySlug],
    queryFn: async () => { ... }
  });
}
```

**Example component signature:**
```typescript
interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // implementation
}
```

## Module Design

**Exports:**
- Named exports for functions and components
- Default exports for page components (Home, Products, Admin, etc.)
- Type exports use `export type` syntax
- Re-exports for backward compatibility (e.g., in `use-products.ts`)

**Barrel Files:**
- Not used explicitly
- UI components each have their own file
- Hooks exported individually from `src/hooks/`

**Example from `use-products.ts`:**
```typescript
export interface ProductVariant { ... }
export interface Product { ... }
export function useProducts(categorySlug?: string) { ... }
export function useProduct(slug: string) { ... }
export { useProductAddons as useAddons } from "./use-product-variants";
export type { ProductAddon } from "./use-product-variants";
```

## Async/Await Patterns

**Observable across codebase:**
- Async functions marked with `async` keyword
- Await used for Supabase and API calls
- Promise.all() for parallel data fetching (CartContext.tsx line 186)
- No explicit Promise chains observed

**Example from `CartContext.tsx`:**
```typescript
const [sizesResult, overridesResult, addonsResult, flavorsResult] =
  await Promise.all([
    sizeIds.length > 0 ? supabase.from("product_sizes").select(...) : { data: [] },
    // ... more parallel queries
  ]);
```

## Data Types & Type Safety

**TypeScript Configuration:**
- `noImplicitAny`: false (allows implicit `any`)
- `strictNullChecks`: false (less strict null checking)
- `noUnusedLocals`: false (allows unused variables)
- `skipLibCheck`: true (faster compilation)
- `allowJs`: true (JavaScript files allowed)

**Patterns:**
- Supabase types imported from `@/integrations/supabase/types`
- Type assertions using `as` keyword when needed
- Optional chaining (`?.`) used frequently
- Nullish coalescing (`??`) for defaults

---

*Convention analysis: 2026-02-25*
