import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Award, TrendingUp, Gift, Pencil, Trash2, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

type RewardType = "discount_percent" | "discount_fixed" | "free_product" | "free_shipping";

type RewardRow = {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: RewardType;
  reward_value: number | null;
  product_id: string | null;
  min_order_amount: number | null;
  active: boolean;
  sort_order: number;
};

type RewardDraft = {
  name: string;
  description: string;
  points_required: string;
  reward_type: RewardType;
  reward_value: string;
  product_id: string;
  min_order_amount: string;
  sort_order: string;
  active: boolean;
};

const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  discount_percent: "% off order",
  discount_fixed: "$ off order",
  free_product: "Free product",
  free_shipping: "Free shipping/delivery",
};

const emptyDraft = (sortOrder: number): RewardDraft => ({
  name: "",
  description: "",
  points_required: "100",
  reward_type: "discount_percent",
  reward_value: "10",
  product_id: "",
  min_order_amount: "0",
  sort_order: String(sortOrder),
  active: true,
});

const rowToDraft = (r: RewardRow): RewardDraft => ({
  name: r.name,
  description: r.description ?? "",
  points_required: String(r.points_required),
  reward_type: r.reward_type,
  reward_value: r.reward_value != null ? String(r.reward_value) : "",
  product_id: r.product_id ?? "",
  min_order_amount: r.min_order_amount != null ? String(r.min_order_amount) : "0",
  sort_order: String(r.sort_order ?? 0),
  active: r.active,
});

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-orange-100 text-orange-800",
  silver: "bg-gray-100 text-gray-800",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-purple-100 text-purple-800",
};

export function LoyaltyAdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adjustments, setAdjustments] = useState<
    Record<string, { points: string; reason: string }>
  >({});

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["loyalty-members-admin"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("loyalty_members")
        .select("*")
        .order("points_balance", { ascending: false });
      if (error) throw error;
      if (!rows || rows.length === 0) return [];

      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profiles, error: profilesErr } = await supabase
        .from("customer_profiles")
        .select("id, email, full_name")
        .in("id", userIds);
      if (profilesErr) throw profilesErr;

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p]),
      );
      return rows.map((r) => ({
        ...r,
        profiles: profileMap.get(r.user_id) ?? null,
      }));
    },
  });

  const { data: rewards = [], isLoading: isLoadingRewards } = useQuery({
    queryKey: ["loyalty-rewards-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Products eligible for a free-product reward. Excludes gift cards (can't
  // be "given for free" the same way). Annotates each row with its available
  // sizes so the owner can see at a glance whether a 10 oz option exists.
  const { data: products = [] } = useQuery({
    queryKey: ["products-for-loyalty"],
    queryFn: async () => {
      const { data: globalSizes, error: gsErr } = await supabase
        .from("product_sizes")
        .select("name, size_oz, sort_order")
        .eq("active", true)
        .order("sort_order");
      if (gsErr) throw gsErr;

      const { data: rows, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, category:categories(slug), product_size_overrides(size_name, size_oz, active, sort_order)",
        )
        .eq("active", true)
        .order("name");
      if (error) throw error;

      type Row = {
        id: string;
        name: string;
        slug: string | null;
        category: { slug: string | null } | null;
        product_size_overrides:
          | { size_name: string; size_oz: number | null; active: boolean | null; sort_order: number }[]
          | null;
      };

      const globalLabel = (globalSizes ?? [])
        .map((s) => s.name)
        .join(", ");

      return (rows as unknown as Row[])
        .filter((r) => (r.slug ?? "") !== "egift-card")
        .map((r) => {
          const activeOverrides = (r.product_size_overrides ?? [])
            .filter((o) => o.active !== false)
            .sort((a, b) => a.sort_order - b.sort_order);
          const sizeLabel = activeOverrides.length > 0
            ? activeOverrides.map((o) => o.size_name).join(", ")
            : globalLabel;
          const has10oz = activeOverrides.length > 0
            ? activeOverrides.some((o) => o.size_oz === 10)
            : (globalSizes ?? []).some((s) => s.size_oz === 10);
          return { id: r.id, name: r.name, sizeLabel, has10oz };
        });
    },
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<RewardDraft>(emptyDraft(0));
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    const nextSort = (rewards as RewardRow[]).reduce(
      (m, r) => Math.max(m, r.sort_order ?? 0),
      0,
    ) + 10;
    setDraft(emptyDraft(nextSort));
    setEditingId(null);
    setEditorMode("create");
    setEditorOpen(true);
  };

  const openEdit = (r: RewardRow) => {
    setDraft(rowToDraft(r));
    setEditingId(r.id);
    setEditorMode("edit");
    setEditorOpen(true);
  };

  const saveReward = useMutation({
    mutationFn: async () => {
      const points = Number(draft.points_required);
      if (!draft.name.trim()) throw new Error("Name is required");
      if (!Number.isFinite(points) || points < 1)
        throw new Error("Points required must be at least 1");
      const valueNeeded =
        draft.reward_type === "discount_percent" ||
        draft.reward_type === "discount_fixed";
      const rewardValue = draft.reward_value === "" ? null : Number(draft.reward_value);
      if (valueNeeded && (rewardValue == null || !Number.isFinite(rewardValue) || rewardValue <= 0))
        throw new Error("Reward value is required for discount rewards");
      if (draft.reward_type === "free_product" && !draft.product_id)
        throw new Error("Pick a product for a free-product reward");
      const minOrder = draft.min_order_amount === "" ? 0 : Number(draft.min_order_amount);

      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        points_required: points,
        reward_type: draft.reward_type,
        reward_value: valueNeeded ? rewardValue : null,
        product_id: draft.reward_type === "free_product" ? draft.product_id : null,
        min_order_amount: minOrder,
        active: draft.active,
        sort_order: Number(draft.sort_order) || 0,
      };

      if (editorMode === "edit" && editingId) {
        const { error } = await supabase
          .from("loyalty_rewards")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("loyalty_rewards").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards-admin"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
      setEditorOpen(false);
      toast({ title: editorMode === "edit" ? "Reward updated" : "Reward created" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save reward",
        variant: "destructive",
      });
    },
  });

  const deleteReward = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("loyalty_rewards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards-admin"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
      setDeleteId(null);
      toast({ title: "Reward deleted" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to delete reward (it may be referenced by past redemptions — try deactivating instead).",
        variant: "destructive",
      });
      setDeleteId(null);
    },
  });

  const toggleRewardActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("loyalty_rewards")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards-admin"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to toggle reward",
        variant: "destructive",
      });
    },
  });

  const adjustPoints = useMutation({
    mutationFn: async ({
      memberId,
      points,
      reason,
    }: {
      memberId: string;
      points: number;
      reason: string;
    }) => {
      // Insert transaction
      const { error: txError } = await supabase
        .from("loyalty_transactions")
        .insert({
          member_id: memberId,
          type: "adjustment",
          points,
          description: reason || "Admin adjustment",
        });
      if (txError) throw txError;

      // Update balance
      const member = members.find((m) => m.id === memberId);
      if (!member) throw new Error("Member not found");

      const { error: updateError } = await supabase
        .from("loyalty_members")
        .update({ points_balance: member.points_balance + points })
        .eq("id", memberId);
      if (updateError) throw updateError;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-members-admin"] });
      setAdjustments((prev) => {
        const next = { ...prev };
        delete next[vars.memberId];
        return next;
      });
      toast({ title: "Points adjusted" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to adjust points",
        variant: "destructive",
      });
    },
  });

  // Stats
  const memberCount = members.length;
  const totalPoints = members.reduce((s, m) => s + (m.points_balance || 0), 0);
  const tierCounts = members.reduce(
    (acc, m) => {
      const tier = (m.tier as string) || "bronze";
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loyalty Program</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{memberCount}</p>
                <p className="text-sm text-muted-foreground">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">
                  {totalPoints.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              <div className="flex flex-wrap gap-1">
                {Object.entries(tierCounts).map(([tier, count]) => (
                  <Badge
                    key={tier}
                    variant="secondary"
                    className={TIER_COLORS[tier] || ""}
                  >
                    {tier}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Catalog */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Rewards Catalog
          </CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> New Reward
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingRewards ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rewards.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No rewards configured.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward</TableHead>
                  <TableHead className="w-32">Offer</TableHead>
                  <TableHead className="w-24">Points</TableHead>
                  <TableHead className="w-20">Active</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rewards as RewardRow[]).map((reward) => {
                  const offerText =
                    reward.reward_type === "discount_percent"
                      ? `${reward.reward_value ?? 0}% off`
                      : reward.reward_type === "discount_fixed"
                        ? `$${reward.reward_value ?? 0} off`
                        : reward.reward_type === "free_shipping"
                          ? "Free shipping"
                          : "Free product";
                  return (
                    <TableRow key={reward.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reward.name}</p>
                          {reward.description && (
                            <p className="text-xs text-muted-foreground">
                              {reward.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{offerText}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {reward.points_required}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={!!reward.active}
                          onCheckedChange={(checked) =>
                            toggleRewardActive.mutate({
                              id: reward.id,
                              active: checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEdit(reward)}
                            aria-label="Edit reward"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setDeleteId(reward.id)}
                            aria-label="Delete reward"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editorMode === "edit" ? "Edit Reward" : "New Reward"}
            </DialogTitle>
            <DialogDescription>
              Configure what members get when they redeem points.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reward-name">Name</Label>
              <Input
                id="reward-name"
                value={draft.name}
                placeholder="$5 off your order"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reward-description">Description (optional)</Label>
              <Textarea
                id="reward-description"
                rows={2}
                value={draft.description}
                placeholder="Shown to members on the rewards page"
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Reward type</Label>
                <Select
                  value={draft.reward_type}
                  onValueChange={(v) =>
                    setDraft({ ...draft, reward_type: v as RewardType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(REWARD_TYPE_LABELS) as RewardType[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {REWARD_TYPE_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reward-points">Points required</Label>
                <Input
                  id="reward-points"
                  type="number"
                  min={1}
                  value={draft.points_required}
                  onChange={(e) =>
                    setDraft({ ...draft, points_required: e.target.value })
                  }
                />
              </div>
            </div>
            {(draft.reward_type === "discount_percent" ||
              draft.reward_type === "discount_fixed") && (
              <div className="space-y-1.5">
                <Label htmlFor="reward-value">
                  {draft.reward_type === "discount_percent"
                    ? "Percent off (e.g. 10 = 10%)"
                    : "Dollar amount off (e.g. 5 = $5)"}
                </Label>
                <Input
                  id="reward-value"
                  type="number"
                  min={0}
                  step={draft.reward_type === "discount_percent" ? "1" : "0.01"}
                  value={draft.reward_value}
                  onChange={(e) =>
                    setDraft({ ...draft, reward_value: e.target.value })
                  }
                />
              </div>
            )}
            {draft.reward_type === "free_product" && (
              <div className="space-y-1.5">
                <Label>Free product</Label>
                <Select
                  value={draft.product_id}
                  onValueChange={(v) => setDraft({ ...draft, product_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex flex-col">
                          <span>
                            {p.name}
                            {p.has10oz ? " · 10 oz available" : ""}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Sizes: {p.sizeLabel || "n/a"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Customer redeems at checkout — the size they choose is the
                  size they get free.
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reward-min-order">Min. order ($)</Label>
                <Input
                  id="reward-min-order"
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.min_order_amount}
                  onChange={(e) =>
                    setDraft({ ...draft, min_order_amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reward-sort">Sort order</Label>
                <Input
                  id="reward-sort"
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) =>
                    setDraft({ ...draft, sort_order: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="reward-active">Active (visible to members)</Label>
              <Switch
                id="reward-active"
                checked={draft.active}
                onCheckedChange={(checked) =>
                  setDraft({ ...draft, active: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveReward.mutate()}
              disabled={saveReward.isPending}
            >
              {saveReward.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editorMode === "edit" ? (
                "Save changes"
              ) : (
                "Create reward"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this reward?</AlertDialogTitle>
            <AlertDialogDescription>
              If members have already redeemed it, deletion may fail — deactivate
              instead to hide it from the rewards page while keeping history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteReward.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({memberCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No loyalty members yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead>Adjust Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const profile = member.profiles as unknown as {
                    full_name: string | null;
                    email: string | null;
                  } | null;
                  const adj = adjustments[member.id] || {
                    points: "",
                    reason: "",
                  };
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {profile?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {profile?.email || member.user_id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            TIER_COLORS[(member.tier as string) || "bronze"] ||
                            ""
                          }
                        >
                          {(member.tier as string) || "bronze"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {(member.points_balance || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="+/-"
                            className="w-20"
                            value={adj.points}
                            onChange={(e) =>
                              setAdjustments((prev) => ({
                                ...prev,
                                [member.id]: { ...adj, points: e.target.value },
                              }))
                            }
                          />
                          <Input
                            placeholder="Reason"
                            className="w-32"
                            value={adj.reason}
                            onChange={(e) =>
                              setAdjustments((prev) => ({
                                ...prev,
                                [member.id]: { ...adj, reason: e.target.value },
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={
                              !adj.points ||
                              isNaN(Number(adj.points)) ||
                              adjustPoints.isPending
                            }
                            onClick={() =>
                              adjustPoints.mutate({
                                memberId: member.id,
                                points: Number(adj.points),
                                reason: adj.reason,
                              })
                            }
                          >
                            {adjustPoints.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Apply"
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
