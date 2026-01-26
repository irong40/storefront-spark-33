import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Package, CheckCircle2, Clock, Truck, MapPin, Search, XCircle } from 'lucide-react';

interface OrderItem {
    id: string;
    product_name: string;
    quantity: number;
    total: number;
}

interface TrackedOrder {
    id: string;
    order_number: string;
    email: string;
    status: string;
    fulfillment_type: string;
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    created_at: string;
    updated_at: string;
}

const STATUS_STEPS = [
    { key: 'pending', label: 'Order Placed', icon: Package },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'processing', label: 'Preparing', icon: Clock },
    { key: 'ready', label: 'Ready', icon: MapPin },
    { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

const STATUS_INDEX: Record<string, number> = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    ready: 3,
    completed: 4,
    cancelled: -1,
};

export default function OrderTracking() {
    const [searchParams] = useSearchParams();
    const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [order, setOrder] = useState<TrackedOrder | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        setHasSearched(true);

        try {
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('order_number', orderNumber.trim().toUpperCase())
                .eq('email', email.trim().toLowerCase())
                .single();

            if (orderError || !orderData) {
                setError('Order not found. Please check your order number and email address.');
                setOrder(null);
                setItems([]);
            } else {
                setOrder(orderData);

                const { data: itemsData } = await supabase
                    .from('order_items')
                    .select('id, product_name, quantity, total')
                    .eq('order_id', orderData.id);

                setItems(itemsData || []);
            }
        } catch {
            setError('An error occurred while searching. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const currentStepIndex = order ? STATUS_INDEX[order.status] ?? 0 : 0;
    const isCancelled = order?.status === 'cancelled';

    return (
        <Layout>
            <div className="container px-4 py-12 max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                        Track Your Order
                    </h1>
                    <p className="text-muted-foreground">
                        Enter your order number and email to see the status.
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="bg-card rounded-2xl border border-border p-6 mb-8">
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                            <Label htmlFor="orderNumber">Order Number</Label>
                            <Input
                                id="orderNumber"
                                placeholder="ORD-20260126-XXXX"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            <>
                                <Search className="mr-2 h-4 w-4" />
                                Track Order
                            </>
                        )}
                    </Button>
                </form>

                {/* Error State */}
                {error && hasSearched && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center mb-8">
                        <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                        <p className="text-destructive font-medium">{error}</p>
                    </div>
                )}

                {/* Order Found */}
                {order && (
                    <div className="space-y-6">
                        {/* Status Header */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Order Number</p>
                                    <p className="text-lg font-semibold">{order.order_number}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">
                                        {order.fulfillment_type === 'pickup' ? '📍 Pickup' : '🚚 Delivery'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Cancelled State */}
                            {isCancelled ? (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center">
                                    <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                                    <p className="font-medium text-destructive">Order Cancelled</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        This order has been cancelled. Contact us for assistance.
                                    </p>
                                </div>
                            ) : (
                                /* Status Timeline */
                                <div className="relative">
                                    <div className="flex justify-between items-start">
                                        {STATUS_STEPS.map((step, index) => {
                                            const isActive = index <= currentStepIndex;
                                            const isCurrent = index === currentStepIndex;
                                            const Icon = step.icon;

                                            return (
                                                <div key={step.key} className="flex flex-col items-center flex-1 relative">
                                                    {/* Connecting Line */}
                                                    {index > 0 && (
                                                        <div
                                                            className={`absolute top-5 right-1/2 w-full h-0.5 -z-10 ${index <= currentStepIndex ? 'bg-primary' : 'bg-border'
                                                                }`}
                                                        />
                                                    )}

                                                    {/* Icon Circle */}
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${isActive
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-muted text-muted-foreground'
                                                            } ${isCurrent ? 'ring-4 ring-primary/30' : ''}`}
                                                    >
                                                        <Icon className="w-5 h-5" />
                                                    </div>

                                                    {/* Label */}
                                                    <span
                                                        className={`text-xs text-center ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                                                            }`}
                                                    >
                                                        {step.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Current Status Message */}
                        {!isCancelled && (
                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                                <p className="font-medium text-primary mb-1">
                                    {order.status === 'pending' && 'Order received! We\'re getting started.'}
                                    {order.status === 'confirmed' && 'Your order has been confirmed!'}
                                    {order.status === 'processing' && 'We\'re preparing your items now.'}
                                    {order.status === 'ready' && order.fulfillment_type === 'pickup' && 'Your order is ready for pickup!'}
                                    {order.status === 'ready' && order.fulfillment_type === 'delivery' && 'Your order is out for delivery!'}
                                    {order.status === 'completed' && 'Your order has been completed. Enjoy!'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {order.status === 'pending' && 'Estimated preparation time: 15-20 minutes'}
                                    {order.status === 'confirmed' && 'Your order will be prepared shortly.'}
                                    {order.status === 'processing' && 'Almost done - just a few more minutes!'}
                                    {order.status === 'ready' && order.fulfillment_type === 'pickup' && 'Pick up at our store location.'}
                                    {order.status === 'ready' && order.fulfillment_type === 'delivery' && 'Your driver is on the way!'}
                                    {order.status === 'completed' && 'Thank you for your order!'}
                                </p>
                            </div>
                        )}

                        {/* Order Items */}
                        <div className="bg-card rounded-2xl border border-border p-6">
                            <h2 className="font-semibold mb-4">Order Items</h2>
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>
                                            {item.product_name} × {item.quantity}
                                        </span>
                                        <span className="font-medium">${Number(item.total).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4" />
                            <div className="flex justify-between font-semibold">
                                <span>Total</span>
                                <span>${Number(order.total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
