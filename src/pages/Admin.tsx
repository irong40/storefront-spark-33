import { Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminProductsTab } from "@/components/admin/AdminProductsTab";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { AnalyticsDashboard } from "@/components/admin/analytics/AnalyticsDashboard";
import { BusinessSettingsForm } from "@/components/admin/BusinessSettingsForm";
import { ProductVariantsPanel } from "@/components/admin/ProductVariantsPanel";
import { GiftCardsPanel } from "@/components/admin/GiftCardsPanel";
import { FeaturedProductsPanel } from "@/components/admin/FeaturedProductsPanel";
import { AnnouncementsPanel } from "@/components/admin/AnnouncementsPanel";
import { UserManagementPanel } from "@/components/admin/UserManagementPanel";
import { AdminHelpPanel } from "@/components/admin/AdminHelpPanel";
import { ContactSubmissionsPanel } from "@/components/admin/ContactSubmissionsPanel";
import { LoyaltyAdminPanel } from "@/components/admin/LoyaltyAdminPanel";
import { PushNotificationsPanel } from "@/components/admin/PushNotificationsPanel";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import {
  BarChart3,
  Settings,
  Sliders,
  Gift,
  Star,
  Megaphone,
  Users,
  HelpCircle,
  Package,
  ShoppingBag,
  MessageSquare,
  Heart,
  Tag,
} from "lucide-react";

export default function Admin() {
  useDocumentTitle("Admin");
  const { user, isLoading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  if (authLoading || adminLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold text-brand-brown mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-heading font-bold text-brand-brown mb-6">
          Admin Dashboard
        </h1>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="variants" className="gap-2">
              <Sliders className="h-4 w-4" />
              Variants
            </TabsTrigger>
            <TabsTrigger value="gift-cards" className="gap-2">
              <Gift className="h-4 w-4" />
              Gift Cards
            </TabsTrigger>
            <TabsTrigger value="featured" className="gap-2">
              <Star className="h-4 w-4" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="announcements" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Announcements
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="gap-2">
              <Heart className="h-4 w-4" />
              Loyalty
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="help" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Help
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <OrdersTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <AdminProductsTab />
          </TabsContent>

          <TabsContent value="variants">
            <ProductVariantsPanel />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <BusinessSettingsForm />
              </CardContent>
            </Card>
            <PushNotificationsPanel />
          </TabsContent>

          <TabsContent value="gift-cards">
            <Card>
              <CardHeader>
                <CardTitle>Gift Cards</CardTitle>
              </CardHeader>
              <CardContent>
                <GiftCardsPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="featured">
            <FeaturedProductsPanel />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsPanel />
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <UserManagementPanel />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <ContactSubmissionsPanel />
          </TabsContent>

          <TabsContent value="loyalty">
            <LoyaltyAdminPanel />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesPanel />
          </TabsContent>

          <TabsContent value="help">
            <AdminHelpPanel />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
