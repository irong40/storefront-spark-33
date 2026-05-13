import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Critical path — eager imports
import Home from "./pages/Home";
import Products from "./pages/Products";
import Auth from "./pages/Auth";
import { Layout } from "./components/layout/Layout";
import NotFound from "./pages/NotFound";

// Non-critical pages — lazy loaded
const Admin = lazy(() => import("./pages/Admin"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const Account = lazy(() => import("./pages/Account"));
const GiftCardBalance = lazy(() => import("./pages/GiftCardBalance"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const LoyaltyDashboard = lazy(() =>
  import("./components/loyalty/LoyaltyDashboard").then((m) => ({
    default: m.LoyaltyDashboard,
  }))
);
const Contact = lazy(() => import("./pages/Contact"));
const About = lazy(() => import("./pages/About"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route
                  path="/order-confirmation/:id"
                  element={<OrderConfirmation />}
                />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/account" element={<Account />} />
                <Route path="/account/orders" element={<Account />} />
                <Route path="/gift-cards/balance" element={<GiftCardBalance />} />
                <Route path="/rewards" element={<Layout><LoyaltyDashboard /></Layout>} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CartDrawer />
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
  </ErrorBoundary>
);

export default App;
