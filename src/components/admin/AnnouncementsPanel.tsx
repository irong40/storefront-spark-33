import { useState } from "react";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  Announcement,
} from "@/hooks/use-announcements";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Plus, Pencil, Trash2, Megaphone } from "lucide-react";
import { format } from "date-fns";

interface AnnouncementFormData {
  message: string;
  emoji: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string;
}

const defaultFormData: AnnouncementFormData = {
  message: "",
  emoji: "✨",
  is_active: true,
  starts_at: new Date().toISOString().slice(0, 16),
  ends_at: "",
};

export function AnnouncementsPanel() {
  const { data: announcements, isLoading } = useAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] =
    useState<AnnouncementFormData>(defaultFormData);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setIsFormOpen(true);
  };

  const openEditForm = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      message: announcement.message,
      emoji: announcement.emoji || "✨",
      is_active: announcement.is_active,
      starts_at: announcement.starts_at.slice(0, 16),
      ends_at: announcement.ends_at ? announcement.ends_at.slice(0, 16) : "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.message.trim()) {
      toast({ title: "Message is required", variant: "destructive" });
      return;
    }

    try {
      const payload = {
        message: formData.message,
        emoji: formData.emoji || null,
        is_active: formData.is_active,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: formData.ends_at
          ? new Date(formData.ends_at).toISOString()
          : null,
      };

      if (editingId) {
        await updateAnnouncement.mutateAsync({ id: editingId, ...payload });
        toast({ title: "Announcement updated" });
      } else {
        await createAnnouncement.mutateAsync(payload);
        toast({ title: "Announcement created" });
      }

      setIsFormOpen(false);
    } catch (error) {
      toast({ title: "Failed to save announcement", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteAnnouncement.mutateAsync(deleteId);
      toast({ title: "Announcement deleted" });
    } catch (error) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const toggleActive = async (announcement: Announcement) => {
    try {
      await updateAnnouncement.mutateAsync({
        id: announcement.id,
        is_active: !announcement.is_active,
      });
    } catch (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements ({announcements?.length || 0})
            </CardTitle>
            <CardDescription>
              Manage scrolling announcements displayed on the homepage.
            </CardDescription>
          </div>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Announcement
          </Button>
        </CardHeader>
        <CardContent>
          {!announcements || announcements.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No announcements yet. Create one to display on the homepage.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {announcement.emoji || "✨"}
                        </span>
                        <span className="max-w-xs truncate">
                          {announcement.message}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>
                        From:{" "}
                        {format(
                          new Date(announcement.starts_at),
                          "MMM d, yyyy",
                        )}
                      </div>
                      {announcement.ends_at && (
                        <div>
                          Until:{" "}
                          {format(
                            new Date(announcement.ends_at),
                            "MMM d, yyyy",
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={announcement.is_active}
                        onCheckedChange={() => toggleActive(announcement)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditForm(announcement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Announcement" : "New Announcement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-[80px_1fr] gap-4">
              <div>
                <Label htmlFor="emoji">Emoji</Label>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  onChange={(e) =>
                    setFormData({ ...formData, emoji: e.target.value })
                  }
                  className="text-center text-lg"
                  maxLength={4}
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Input
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Enter announcement message..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="starts_at">Start Date & Time</Label>
                <Input
                  id="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) =>
                    setFormData({ ...formData, starts_at: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="ends_at">End Date & Time (optional)</Label>
                <Input
                  id="ends_at"
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) =>
                    setFormData({ ...formData, ends_at: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createAnnouncement.isPending || updateAnnouncement.isPending
              }
            >
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
