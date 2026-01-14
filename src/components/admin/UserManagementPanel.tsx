import { useState } from 'react';
import { useUsers, useAssignRole, useRemoveRole, UserWithRole } from '@/hooks/use-users';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, UserPlus, X, Shield, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export function UserManagementPanel() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();

  const [searchQuery, setSearchQuery] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'moderator'>('admin');
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<{ user: UserWithRole; role: 'admin' | 'moderator' | 'user' } | null>(null);

  const filteredUsers = users?.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      (user.full_name?.toLowerCase() || '').includes(query)
    );
  });

  const handleAssignRole = () => {
    if (!selectedUser) return;
    assignRole.mutate(
      { userId: selectedUser.id, role: selectedRole },
      {
        onSuccess: () => {
          setAssignDialogOpen(false);
          setSelectedUser(null);
        },
      }
    );
  };

  const handleRemoveRole = () => {
    if (!roleToRemove) return;
    removeRole.mutate(
      { userId: roleToRemove.user.id, role: roleToRemove.role },
      {
        onSuccess: () => {
          setRemoveDialogOpen(false);
          setRoleToRemove(null);
        },
      }
    );
  };

  const openAssignDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setSelectedRole('admin');
    setAssignDialogOpen(true);
  };

  const openRemoveDialog = (user: UserWithRole, role: 'admin' | 'moderator' | 'user') => {
    setRoleToRemove({ user, role });
    setRemoveDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const canRemoveRole = (user: UserWithRole, role: string) => {
    // Prevent current admin from removing their own admin role
    if (user.id === currentUser?.id && role === 'admin') {
      return false;
    }
    return true;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{user.full_name || 'No name'}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <Badge
                        key={role}
                        variant={getRoleBadgeVariant(role)}
                        className="flex items-center gap-1"
                      >
                        {role === 'admin' ? (
                          <ShieldCheck className="h-3 w-3" />
                        ) : (
                          <Shield className="h-3 w-3" />
                        )}
                        {role}
                        {canRemoveRole(user, role) && (
                          <button
                            onClick={() => openRemoveDialog(user, role as 'admin' | 'moderator' | 'user')}
                            className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline">User</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(user.created_at), 'MMM d, yyyy')}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openAssignDialog(user)}
                  disabled={user.roles.includes('admin') && user.roles.includes('moderator')}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Assign Role
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filteredUsers?.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Assign Role Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Assign a role to {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={selectedRole}
              onValueChange={(value: 'admin' | 'moderator') => setSelectedRole(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {!selectedUser?.roles.includes('admin') && (
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                )}
                {!selectedUser?.roles.includes('moderator') && (
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Moderator
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={assignRole.isPending}>
              {assignRole.isPending ? 'Assigning...' : 'Assign Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Role Confirmation */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the "{roleToRemove?.role}" role from{' '}
              {roleToRemove?.user.full_name || roleToRemove?.user.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeRole.isPending ? 'Removing...' : 'Remove Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
