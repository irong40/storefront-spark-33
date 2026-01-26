import { useState } from 'react';
import { format } from 'date-fns';
import { useOrders, useUpdateOrderStatus, OrderWithItems } from '@/hooks/use-orders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Package, Truck, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' },
  { value: 'preparing', label: 'Preparing', icon: Package, color: 'bg-purple-100 text-purple-800' },
  { value: 'ready', label: 'Ready', icon: Package, color: 'bg-green-100 text-green-800' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' },
];

function getStatusBadge(status: string) {
  const statusConfig = ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
  return (
    <Badge className={`${statusConfig.color} border-0`}>
      {statusConfig.label}
    </Badge>
  );
}

export function OrdersTable() {
  const { data: orders, isLoading, refetch } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast({ title: 'Order status updated' });

      // Trigger email notification
      const order = orders?.find(o => o.id === orderId);
      if (order) {
        supabase.functions.invoke('send-order-status-update', {
          body: {
            email: order.email,
            customerName: order.customer_name,
            orderNumber: order.order_number,
            newStatus: newStatus,
            fulfillmentType: order.fulfillment_type,
            trackingUrl: `${window.location.origin}/order-tracking?order=${order.order_number}&email=${encodeURIComponent(order.email)}`,
          }
        }).then(({ error }) => {
          if (error) console.error('Failed to send status email:', error);
        });
      }
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No orders yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono font-medium">
                {order.order_number}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(order.created_at ?? new Date()), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{order.customer_name || 'Guest'}</p>
                  <p className="text-sm text-muted-foreground">{order.email}</p>
                </div>
              </TableCell>
              <TableCell>{order.order_items?.length || 0} items</TableCell>
              <TableCell className="font-medium">${order.total.toFixed(2)}</TableCell>
              <TableCell>
                <Select
                  value={order.status || 'pending'}
                  onValueChange={(value) => handleStatusChange(order.id, value)}
                >
                  <SelectTrigger className="w-[130px] h-8">
                    <SelectValue>{getStatusBadge(order.status || 'pending')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <status.icon className="h-4 w-4" />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedOrder(order)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && <OrderDetails order={selectedOrder} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function OrderDetails({ order }: { order: OrderWithItems }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Customer Info</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Name:</span> {order.customer_name || 'N/A'}</p>
            <p><span className="text-muted-foreground">Email:</span> {order.email}</p>
            <p><span className="text-muted-foreground">Phone:</span> {order.phone || 'N/A'}</p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Order Info</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Date:</span> {format(new Date(order.created_at ?? new Date()), 'PPpp')}</p>
            <p><span className="text-muted-foreground">Status:</span> {getStatusBadge(order.status || 'pending')}</p>
            <p><span className="text-muted-foreground">Fulfillment:</span> {order.fulfillment_type || 'pickup'}</p>
            {order.payment_id && (
              <p><span className="text-muted-foreground">Payment ID:</span> <span className="font-mono text-xs">{order.payment_id}</span></p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Items</h3>
        <div className="border rounded-lg divide-y">
          {order.order_items?.map((item) => (
            <div key={item.id} className="p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  ${item.product_price.toFixed(2)} × {item.quantity}
                </p>
              </div>
              <p className="font-medium">${item.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          {order.tax && order.tax > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>${order.tax.toFixed(2)}</span>
            </div>
          )}
          {order.shipping && order.shipping > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>${order.shipping.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base pt-2 border-t">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {order.notes && (
        <div>
          <h3 className="font-semibold mb-2">Customer Notes</h3>
          <p className="text-sm bg-muted p-3 rounded-lg">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
