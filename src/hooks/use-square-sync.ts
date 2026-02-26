import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

interface SyncResult {
  categories: { created: number; updated: number; removed: number };
  products: { created: number; updated: number; removed: number };
  errors: string[];
}

interface InventorySyncResult {
  updated: number;
  errors?: string[];
}

export function useSquareSync() {
  const [isSyncingCatalog, setIsSyncingCatalog] = useState(false);
  const [isSyncingInventory, setIsSyncingInventory] = useState(false);
  const [lastCatalogSync, setLastCatalogSync] = useState<Date | null>(null);
  const [lastInventorySync, setLastInventorySync] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncCatalog = async (): Promise<SyncResult | null> => {
    setIsSyncingCatalog(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("sync-square-catalog", {
        headers: session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : undefined,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data.result as SyncResult;
      setLastCatalogSync(new Date());
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });

      toast({
        title: "Catalog Synced",
        description: `Created ${result.products.created}, updated ${result.products.updated}, removed ${result.products.removed} products`,
      });

      if (result.errors.length > 0) {
        logger.warn("Sync errors:", result.errors);
        toast({
          title: "Sync Warnings",
          description: `${result.errors.length} items had issues. Check console for details.`,
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      logger.error("Catalog sync error:", error);
      toast({
        title: "Sync Failed",
        description:
          error instanceof Error ? error.message : "Failed to sync catalog",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSyncingCatalog(false);
    }
  };

  const syncInventory = async (): Promise<InventorySyncResult | null> => {
    setIsSyncingInventory(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke(
        "sync-square-inventory",
        {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : undefined,
        },
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as InventorySyncResult;
      setLastInventorySync(new Date());

      toast({
        title: "Inventory Synced",
        description: `Updated ${result.updated} products`,
      });

      if (result.errors && result.errors.length > 0) {
        logger.warn("Inventory sync errors:", result.errors);
      }

      return result;
    } catch (error) {
      logger.error("Inventory sync error:", error);
      toast({
        title: "Sync Failed",
        description:
          error instanceof Error ? error.message : "Failed to sync inventory",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSyncingInventory(false);
    }
  };

  const syncAll = async () => {
    await syncCatalog();
    await syncInventory();
  };

  return {
    syncCatalog,
    syncInventory,
    syncAll,
    isSyncingCatalog,
    isSyncingInventory,
    isSyncing: isSyncingCatalog || isSyncingInventory,
    lastCatalogSync,
    lastInventorySync,
  };
}
