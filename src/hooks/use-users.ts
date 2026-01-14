import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
}

export function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<UserWithRole[]> => {
      // Fetch all customer profiles (admin-only via RLS)
      const { data: profiles, error: profilesError } = await supabase
        .from('customer_profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        return [];
      }

      // Map roles to users
      return profiles.map(profile => ({
        ...profile,
        roles: roles
          .filter(r => r.user_id === profile.id)
          .map(r => r.role),
      }));
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'moderator' }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Role assigned successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      console.error('Error assigning role:', error);
      toast({ 
        title: 'Failed to assign role', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'moderator' | 'user' }) => {
      // Prevent admins from removing their own admin role
      if (userId === user?.id && role === 'admin') {
        throw new Error('You cannot remove your own admin role');
      }

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Role removed successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      console.error('Error removing role:', error);
      toast({ 
        title: 'Failed to remove role', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
}
