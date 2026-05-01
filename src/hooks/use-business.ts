import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessSettings {
  id: string;
  business_name: string;
  tagline: string | null;
  description: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  hours: Record<string, string> | null;
  social_links: Record<string, string> | null;
  logo_url: string | null;
  favicon_url: string | null;
  tax_rate: number;
  created_at: string;
}

export function useBusinessSettings() {
  return useQuery({
    queryKey: ["business-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data as BusinessSettings;
    },
  });
}
