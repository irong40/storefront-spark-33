import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useCustomerOrders } from '@/hooks/use-customer-orders';
import { User, Package, LogOut, Loader2, RefreshCw } from 'lucide-react';

export default function Account() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut, updateProfile, isLoading: authLoading } = useAuth();
  const { reorderItems } = useCart();
  const { data: orders = [], isLoading: isLoadingOrders } = useCustomerOrders();
  
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await updateProfile(profileData);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    }

    setIsSaving(false);
  };

  const handleReorder = async (order: typeof orders[0]) => {
    setReorderingId(order.id);
    
    const itemsToReorder = order.order_items
      .filter(item => item.product_id)
      .map(item => ({
        product_id: item.product_id!,
        quantity: item.quantity,
      }));

    if (itemsToReorder.length === 0) {
      toast({
        title: 'Cannot Reorder',
        description: 'This order has no products available for reorder.',
        variant: 'destructive',
      });
      setReorderingId(null);
      return;
    }

    const result = await reorderItems(itemsToReorder);
    
    if (result.success) {
      if (result.skippedCount > 0) {
        toast({
          title: 'Items Added to Cart',
          description: `${result.addedCount} item(s) added. ${result.skippedCount} item(s) unavailable.`,
        });
      } else {
        toast({
          title: 'Order Added to Cart',
          description: `${result.addedCount} item(s) added to your cart.`,
        });
      }
    } else {
      toast({
        title: 'Reorder Failed',
        description: 'Some products may no longer be available.',
        variant: 'destructive',
      });
    }
    
    setReorderingId(null);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                My Account
              </h1>
              <p className="text-muted-foreground mt-1">
                {user.email}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="profile">
            <TabsList className="mb-8">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="orders" className="gap-2">
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                
                <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      disabled={isSaving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={isSaving}
                    />
                  </div>

                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-xl font-semibold mb-6">Order History</h2>

                {isLoadingOrders ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No orders yet</p>
                    <p className="text-muted-foreground mb-6">
                      When you place an order, it will appear here.
                    </p>
                    <Button asChild>
                      <Link to="/products">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div 
                        key={order.id}
                        className="p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <Link 
                            to={`/order-confirmation/${order.id}`}
                            className="flex-1 min-w-0"
                          >
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.created_at && new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                            {order.order_items.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                              </p>
                            )}
                          </Link>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold">${Number(order.total).toFixed(2)}</p>
                            <p className="text-sm capitalize text-muted-foreground mb-2">
                              {order.status}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault();
                                handleReorder(order);
                              }}
                              disabled={reorderingId === order.id}
                              className="gap-1.5"
                            >
                              {reorderingId === order.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3.5 w-3.5" />
                              )}
                              Reorder
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
