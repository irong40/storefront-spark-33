import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string | null;
  roles: string[];
}

export function useUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<UserWithRole[]> => {
      // Fetch all customer profiles (admin-only via RLS)
      const { data: profiles, error: profilesError } = await supabase
        .from("customer_profiles")
        .select("id, email, full_name, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) {
        logger.error("Error fetching profiles:", profilesError);
        return [];
      }

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        logger.error("Error fetching roles:", rolesError);
        return [];
      }

      // Map roles to users
      return profiles.map((profile) => ({
        ...profile,
        roles: roles.filter((r) => r.user_id === profile.id).map((r) => r.role),
      }));
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      email,
      full_name,
      role,
    }: {
      email: string;
      full_name?: string;
      role?: "admin" | "moderator";
    }) => {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: { email, full_name, role },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "User created successfully", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      logger.error("Error creating user:", error);
      toast({
        title: "Failed to create user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "moderator";
    }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Role assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      logger.error("Error assigning role:", error);
      toast({
        title: "Failed to assign role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "moderator" | "user";
    }) => {
      // Prevent admins from removing their own admin role
      if (userId === user?.id && role === "admin") {
        throw new Error("You cannot remove your own admin role");
      }

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Role removed successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      logger.error("Error removing role:", error);
      toast({
        title: "Failed to remove role",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      if (userId === user?.id) {
        throw new Error("You cannot delete your own account");
      }
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast({ title: "User deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-members-admin"] });
    },
    onError: (error: Error) => {
      logger.error("Error deleting user:", error);
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useResetUserPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const { data, error } = await supabase.functions.invoke(
        "reset-user-password",
        {
          body: { email },
        },
      );

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Password reset email sent", description: data.message });
    },
    onError: (error: Error) => {
      logger.error("Error resetting password:", error);
      toast({
        title: "Failed to send password reset",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
