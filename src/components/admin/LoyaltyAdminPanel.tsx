import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Award, TrendingUp, Gift } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
      const { data, error } = await supabase
        .from("loyalty_members")
        .select("*, profiles:user_id(full_name, email)")
        .order("points_balance", { ascending: false });
      if (error) throw error;
      return data;
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

  const [rewardEdits, setRewardEdits] = useState<Record<string, string>>({});

  const updateRewardThreshold = useMutation({
    mutationFn: async ({ id, points }: { id: string; points: number }) => {
      const { error } = await supabase
        .from("loyalty_rewards")
        .update({ points_required: points })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards-admin"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-rewards"] });
      setRewardEdits((prev) => {
        const next = { ...prev };
        delete next[vars.id];
        return next;
      });
      toast({ title: "Reward updated" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update reward",
        variant: "destructive",
      });
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Reward Thresholds
          </CardTitle>
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
                  <TableHead className="w-32">Points Required</TableHead>
                  <TableHead className="w-24">Active</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((reward) => {
                  const editValue =
                    rewardEdits[reward.id] ?? String(reward.points_required);
                  const dirty =
                    rewardEdits[reward.id] !== undefined &&
                    Number(rewardEdits[reward.id]) !== reward.points_required;
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
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={editValue}
                          onChange={(e) =>
                            setRewardEdits((prev) => ({
                              ...prev,
                              [reward.id]: e.target.value,
                            }))
                          }
                          className="w-24"
                        />
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
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            !dirty ||
                            !editValue ||
                            isNaN(Number(editValue)) ||
                            Number(editValue) < 1 ||
                            updateRewardThreshold.isPending
                          }
                          onClick={() =>
                            updateRewardThreshold.mutate({
                              id: reward.id,
                              points: Number(editValue),
                            })
                          }
                        >
                          {updateRewardThreshold.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
