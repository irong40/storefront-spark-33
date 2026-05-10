import { useState, useMemo } from "react";
import { format } from "date-fns";
import {
  useOrders,
  useUpdateOrderStatus,
  useArchiveOrders,
  useUnarchiveOrders,
  OrderWithItems,
  ArchiveType,
} from "@/hooks/use-orders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Archive,
  Plus,
  ArchiveRestore,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  BellRing,
  Send,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CreateOrderDialog } from "./CreateOrderDialog";

const PAGE_SIZE = 50;

const ORDER_STATUSES = [
  {
    value: "pending",
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "ready",
    label: "Ready",
    icon: Package,
    color: "bg-green-100 text-green-800",
  },
  {
    value: "completed",
    label: "Completed",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: XCircle,
    color: "bg-red-100 text-red-800",
  },
];

const ARCHIVE_OPTIONS: { value: ArchiveType; label: string }[] = [
  { value: "archived_weekly", label: "Weekly Archive" },
  { value: "archived_monthly", label: "Monthly Archive" },
  { value: "archived_quarterly", label: "Quarterly Archive" },
  { value: "archived_yearly", label: "Yearly Archive" },
];

function getStatusBadge(status: string) {
  if (status?.startsWith("archived_")) {
    const archiveLabel =
      ARCHIVE_OPTIONS.find((a) => a.value === status)?.label || "Archived";
    return (
      <Badge className="bg-gray-100 text-gray-800 border-0">
        {archiveLabel}
      </Badge>
    );
  }
  const statusConfig =
    ORDER_STATUSES.find((s) => s.value === status) || ORDER_STATUSES[0];
  return (
    <Badge className={`${statusConfig.color} border-0`}>
      {statusConfig.label}
    </Badge>
  );
}

export function OrdersTable() {
  const [showArchived, setShowArchived] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useOrders(
    showArchived,
    100,
    currentPage,
    PAGE_SIZE,
  );

  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  // Client-side search filter — filters within the current page's results.
  const orders = useMemo(() => {
    const allOrders = data?.orders ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return allOrders;
    return allOrders.filter(
      (o) =>
        o.order_number?.toLowerCase().includes(term) ||
        o.customer_name?.toLowerCase().includes(term) ||
        o.email?.toLowerCase().includes(term),
    );
  }, [data?.orders, search]);

  const updateStatus = useUpdateOrderStatus();
  const archiveOrders = useArchiveOrders();
  const unarchiveOrders = useUnarchiveOrders();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(
    null,
  );
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast({ title: "Order status updated" });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const handleNotifyReady = async (order: OrderWithItems) => {
    setNotifyingId(order.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-order-ready",
        { body: { orderId: order.id } },
      );
      if (error) throw error;
      if ((data as { error?: string })?.error) {
        throw new Error((data as { error: string }).error);
      }
      const isDelivery = order.fulfillment_type === "delivery";
      toast({
        title: isDelivery
          ? "Customer notified — out for delivery"
          : "Customer notified — ready for pickup",
      });
      await refetch();
    } catch (err) {
      toast({
        title: "Failed to notify customer",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setNotifyingId(null);
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds((ids) => [...ids, orderId]);
    } else {
      setSelectedOrderIds((ids) => ids.filter((id) => id !== orderId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && orders) {
      setSelectedOrderIds(orders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleArchive = async (archiveType: ArchiveType) => {
    if (selectedOrderIds.length === 0) {
      toast({
        title: "Please select orders to archive",
        variant: "destructive",
      });
      return;
    }
    try {
      await archiveOrders.mutateAsync({
        orderIds: selectedOrderIds,
        archiveType,
      });
      toast({ title: `${selectedOrderIds.length} order(s) archived` });
      setSelectedOrderIds([]);
    } catch {
      toast({ title: "Failed to archive orders", variant: "destructive" });
    }
  };

  const handleUnarchive = async () => {
    if (selectedOrderIds.length === 0) {
      toast({
        title: "Please select orders to restore",
        variant: "destructive",
      });
      return;
    }
    try {
      await unarchiveOrders.mutateAsync({ orderIds: selectedOrderIds });
      toast({ title: `${selectedOrderIds.length} order(s) restored` });
      setSelectedOrderIds([]);
    } catch {
      toast({ title: "Failed to restore orders", variant: "destructive" });
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

  return (
    <>
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs
            value={showArchived ? "archived" : "active"}
            onValueChange={(v) => {
              setShowArchived(v === "archived");
              setSelectedOrderIds([]);
              setCurrentPage(1);
              setSearch("");
            }}
          >
            <TabsList>
              <TabsTrigger value="active">Active Orders</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            {selectedOrderIds.length > 0 && (
              <>
                {showArchived ? (
                  <Button variant="outline" size="sm" onClick={handleUnarchive}>
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Restore ({selectedOrderIds.length})
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Archive className="h-4 w-4 mr-2" />
                        Archive ({selectedOrderIds.length})
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {ARCHIVE_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => handleArchive(option.value)}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Order
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by order #, customer name, or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
            aria-label="Search orders"
          />
        </div>

        {!orders?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {search.trim()
                ? "No orders match your search"
                : showArchived
                  ? "No archived orders"
                  : "No orders yet"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      orders.length > 0 &&
                      selectedOrderIds.length === orders.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
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
              {orders.map((order) => {
                const needsAck =
                  !order.owner_acknowledged_at &&
                  order.status === "pending";
                return (
                <TableRow
                  key={order.id}
                  className={needsAck ? "bg-amber-50 border-l-4 border-l-amber-400" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedOrderIds.includes(order.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOrder(order.id, !!checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    <div className="flex items-center gap-2">
                      {order.order_number}
                      {needsAck && (
                        <span title="Needs acknowledgment">
                          <BellRing className="h-4 w-4 text-amber-500" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(
                      new Date(order.created_at ?? new Date()),
                      "MMM d, yyyy h:mm a",
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {order.customer_name || "Guest"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{order.order_items?.length || 0} items</TableCell>
                  <TableCell className="font-medium">
                    ${order.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {showArchived ? (
                      getStatusBadge(order.status || "pending")
                    ) : (
                      <Select
                        value={order.status || "pending"}
                        onValueChange={(value) =>
                          handleStatusChange(order.id, value)
                        }
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <SelectValue>
                            {getStatusBadge(order.status || "pending")}
                          </SelectValue>
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
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!order.ready_notified_at &&
                      order.status !== "completed" &&
                      order.status !== "cancelled" &&
                      !showArchived && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mr-1"
                          disabled={notifyingId === order.id}
                          onClick={() => handleNotifyReady(order)}
                          title={
                            order.fulfillment_type === "delivery"
                              ? "Notify customer order is out for delivery"
                              : "Notify customer order is ready for pickup"
                          }
                        >
                          <Send className="h-4 w-4 mr-1" />
                          {notifyingId === order.id ? "Sending..." : "Notify"}
                        </Button>
                      )}
                    {order.status === "ready" && !showArchived && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mr-1 bg-green-50 hover:bg-green-100 text-green-800 border-green-200"
                        disabled={updateStatus.isPending}
                        onClick={() => handleStatusChange(order.id, "completed")}
                        title="Mark order as completed"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
              {!search.trim() && (
                <span className="ml-1">({totalCount} total)</span>
              )}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1">Previous</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
              >
                <span className="mr-1">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedOrder}
        onOpenChange={() => setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && <OrderDetails order={selectedOrder} />}
        </DialogContent>
      </Dialog>

      <CreateOrderDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
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
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              {order.customer_name || "N/A"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span>{" "}
              {order.email}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {order.phone || "N/A"}
            </p>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Order Info</h3>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Date:</span>{" "}
              {format(new Date(order.created_at ?? new Date()), "PPpp")}
            </p>
            <p>
              <span className="text-muted-foreground">Status:</span>{" "}
              {getStatusBadge(order.status || "pending")}
            </p>
            <p>
              <span className="text-muted-foreground">Fulfillment:</span>{" "}
              {order.fulfillment_type || "pickup"}
            </p>
            {order.pickup_date && (
              <p>
                <span className="text-muted-foreground">Pickup:</span>{" "}
                {order.pickup_date} at {order.pickup_time}
              </p>
            )}
            {order.payment_id && (
              <p>
                <span className="text-muted-foreground">Payment ID:</span>{" "}
                <span className="font-mono text-xs">{order.payment_id}</span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Acknowledged:</span>{" "}
              {order.owner_acknowledged_at
                ? format(new Date(order.owner_acknowledged_at), "PPpp")
                : <span className="text-amber-600 font-medium">Not yet</span>}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Items</h3>
        <div className="border rounded-lg divide-y">
          {order.order_items?.map((item) => (
            <div
              key={item.id}
              className="p-3 flex justify-between items-center"
            >
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
