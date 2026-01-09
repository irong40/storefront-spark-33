import { useRecentOrders } from '@/hooks/use-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  ready: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-brand-olive/20 text-brand-olive dark:bg-brand-olive/30',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function ActivityFeed() {
  const { data: orders, isLoading } = useRecentOrders(8);

  return (
    <Card className="shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-heading">Recent Activity</CardTitle>
        <a 
          href="#orders" 
          className="text-sm text-brand-berry hover:text-brand-berry-dark flex items-center gap-1"
        >
          View All <ArrowRight className="h-3 w-3" />
        </a>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No orders yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div 
                key={order.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 rounded-full bg-brand-cream">
                  <ShoppingBag className="h-4 w-4 text-brand-olive" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{order.order_number}</p>
                    <Badge 
                      variant="secondary"
                      className={cn('text-xs', statusColors[order.status || 'pending'])}
                    >
                      {order.status || 'pending'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {order.customer_name || order.email}
                  </p>
                </div>
                
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm">${order.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
