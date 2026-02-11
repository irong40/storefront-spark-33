import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, Gift, Eye, Ban, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface GiftCard {
  id: string;
  code: string;
  original_amount: number;
  balance: number;
  status: string;
  recipient_email: string | null;
  recipient_name: string | null;
  purchased_at: string;
  expires_at: string | null;
}

interface GiftCardTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export function GiftCardsPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [newCardAmount, setNewCardAmount] = useState("");
  const [newCardRecipientEmail, setNewCardRecipientEmail] = useState("");
  const [newCardRecipientName, setNewCardRecipientName] = useState("");

  // Fetch gift cards
  const { data: giftCards = [], isLoading } = useQuery({
    queryKey: ["admin-gift-cards", search],
    queryFn: async () => {
      let query = supabase
        .from("gift_cards")
        .select("*")
        .order("purchased_at", { ascending: false });

      if (search) {
        query = query.or(
          `code.ilike.%${search}%,recipient_email.ilike.%${search}%`,
        );
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as GiftCard[];
    },
  });

  // Fetch transactions for selected card
  const { data: transactions = [] } = useQuery({
    queryKey: ["gift-card-transactions", selectedCard?.id],
    queryFn: async () => {
      if (!selectedCard) return [];
      const { data, error } = await supabase
        .from("gift_card_transactions")
        .select("*")
        .eq("gift_card_id", selectedCard.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GiftCardTransaction[];
    },
    enabled: !!selectedCard,
  });

  // Create gift card mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(newCardAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

      const insertData = {
        original_amount: amount,
        balance: amount,
        recipient_email: newCardRecipientEmail || null,
        recipient_name: newCardRecipientName || null,
      };

      const { data, error } = await supabase
        .from("gift_cards")
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;

      // Record purchase transaction
      await supabase.from("gift_card_transactions").insert({
        gift_card_id: data.id,
        type: "purchase",
        amount: amount,
        description: "Gift card created by admin",
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
      toast.success(`Gift card created: ${data.code}`);
      setIsCreateOpen(false);
      setNewCardAmount("");
      setNewCardRecipientEmail("");
      setNewCardRecipientName("");
    },
    onError: (err) => {
      toast.error(`Failed to create gift card: ${err.message}`);
    },
  });

  // Cancel gift card mutation
  const cancelMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase
        .from("gift_cards")
        .update({ status: "cancelled" })
        .eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
      toast.success("Gift card cancelled");
    },
    onError: () => {
      toast.error("Failed to cancel gift card");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      active: "default",
      depleted: "secondary",
      expired: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Gift Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Gift Card</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  value={newCardAmount}
                  onChange={(e) => setNewCardAmount(e.target.value)}
                  placeholder="25.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientEmail">Recipient Email</Label>
                <Input
                  id="recipientEmail"
                  type="email"
                  value={newCardRecipientEmail}
                  onChange={(e) => setNewCardRecipientEmail(e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  value={newCardRecipientName}
                  onChange={(e) => setNewCardRecipientName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !newCardAmount}
              >
                {createMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Gift className="h-4 w-4 mr-2" />
                )}
                Create Gift Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : giftCards.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No gift cards found</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead className="text-right">Original</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {giftCards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-mono text-sm">
                    {card.code}
                  </TableCell>
                  <TableCell>
                    {card.recipient_email ? (
                      <div>
                        <div className="font-medium">
                          {card.recipient_name || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {card.recipient_email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    ${card.original_amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${card.balance.toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(card.status)}</TableCell>
                  <TableCell>
                    {format(new Date(card.purchased_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedCard(card)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Gift Card Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">
                                  Code
                                </div>
                                <div className="font-mono font-medium">
                                  {card.code}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">
                                  Status
                                </div>
                                <div>{getStatusBadge(card.status)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">
                                  Original Amount
                                </div>
                                <div>${card.original_amount.toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">
                                  Current Balance
                                </div>
                                <div className="font-bold text-primary">
                                  ${card.balance.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-2">
                                Transaction History
                              </div>
                              {transactions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  No transactions
                                </p>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {transactions.map((tx) => (
                                    <div
                                      key={tx.id}
                                      className="flex justify-between items-center text-sm p-2 bg-muted rounded"
                                    >
                                      <div>
                                        <div className="capitalize">
                                          {tx.type}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {format(
                                            new Date(tx.created_at),
                                            "MMM d, yyyy h:mm a",
                                          )}
                                        </div>
                                      </div>
                                      <div
                                        className={
                                          tx.type === "redemption"
                                            ? "text-destructive"
                                            : "text-primary"
                                        }
                                      >
                                        {tx.type === "redemption" ? "-" : "+"}$
                                        {tx.amount.toFixed(2)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {card.status === "active" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => cancelMutation.mutate(card.id)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
