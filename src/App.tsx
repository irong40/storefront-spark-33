import { lazy, Suspense, type ReactNode } from "react";
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
import { PageSeo } from "@/components/PageSeo";

// Critical path: eager imports (the home page and the shared layout)
import Home from "./pages/Home";
import { Layout } from "./components/layout/Layout";
import NotFound from "./pages/NotFound";

// Every other route is lazy loaded so the entry bundle carries only Home.
// The Suspense fallback below shows the existing spinner while a chunk loads.
const Products = lazy(() => import("./pages/Products"));
const Auth = lazy(() => import("./pages/Auth"));
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

// Private and transactional pages: rendered with a robots noindex tag so they
// stay out of search results even when a crawler reaches them by a link.
const noindex = (title: string, page: ReactNode) => (
  <>
    <PageSeo title={title} noindex />
    {page}
  </>
);

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
                <Route path="/checkout" element={noindex("Checkout", <Checkout />)} />
                <Route
                  path="/order-confirmation/:id"
                  element={noindex("Order Confirmation", <OrderConfirmation />)}
                />
                <Route path="/auth" element={noindex("Sign In", <Auth />)} />
                <Route path="/reset-password" element={noindex("Reset Password", <ResetPassword />)} />
                <Route path="/account" element={noindex("My Account", <Account />)} />
                <Route path="/account/orders" element={noindex("My Account", <Account />)} />
                <Route path="/gift-cards/balance" element={noindex("Check Gift Card Balance", <GiftCardBalance />)} />
                <Route path="/rewards" element={noindex("Rewards", <Layout><LoyaltyDashboard /></Layout>)} />
                <Route path="/admin" element={noindex("Admin", <Admin />)} />
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
