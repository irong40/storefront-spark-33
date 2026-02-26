import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, Loader2, Save } from "lucide-react";

type SubmissionStatus = "new" | "read" | "replied" | "archived";

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  read: "bg-yellow-100 text-yellow-800",
  replied: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-500",
};

export function ContactSubmissionsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["contact-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: SubmissionStatus;
    }) => {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      toast({ title: "Status updated" });
    },
  });

  const saveNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("contact_submissions")
        .update({ admin_notes: notes, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-submissions"] });
      toast({ title: "Notes saved" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contact Submissions</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle>Contact Submissions ({submissions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No contact submissions yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => {
                const isExpanded = expandedId === sub.id;
                return (
                  <Collapsible key={sub.id} asChild open={isExpanded}>
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : sub.id)
                          }
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {sub.created_at
                              ? new Date(sub.created_at).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>{sub.name || "-"}</TableCell>
                          <TableCell>{sub.email}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {sub.subject || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={
                                STATUS_COLORS[
                                  (sub.status as SubmissionStatus) || "new"
                                ]
                              }
                            >
                              {(sub.status || "new").replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="p-4 space-y-4 bg-muted/30 rounded-lg">
                              <div>
                                <p className="text-sm font-medium mb-1">
                                  Message
                                </p>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                  {sub.message}
                                </p>
                              </div>

                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-sm font-medium mb-1">
                                    Status
                                  </p>
                                  <Select
                                    defaultValue={
                                      (sub.status as string) || "new"
                                    }
                                    onValueChange={(v) =>
                                      updateStatus.mutate({
                                        id: sub.id,
                                        status: v as SubmissionStatus,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="w-[160px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="new">New</SelectItem>
                                      <SelectItem value="read">
                                        Read
                                      </SelectItem>
                                      <SelectItem value="replied">
                                        Replied
                                      </SelectItem>
                                      <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm font-medium mb-1">
                                  Admin Notes
                                </p>
                                <div className="flex gap-2">
                                  <Textarea
                                    value={
                                      adminNotes[sub.id] ??
                                      (sub.admin_notes as string) ??
                                      ""
                                    }
                                    onChange={(e) =>
                                      setAdminNotes((prev) => ({
                                        ...prev,
                                        [sub.id]: e.target.value,
                                      }))
                                    }
                                    rows={2}
                                    className="flex-1"
                                    placeholder="Add internal notes..."
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      saveNotes.mutate({
                                        id: sub.id,
                                        notes:
                                          adminNotes[sub.id] ??
                                          (sub.admin_notes as string) ??
                                          "",
                                      })
                                    }
                                    disabled={saveNotes.isPending}
                                  >
                                    {saveNotes.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
