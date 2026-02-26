import { useState } from "react";
import { useProducts, Product } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useSquareSync } from "@/hooks/use-square-sync";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductForm } from "@/components/admin/ProductForm";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Wand2,
  Loader2,
  Image,
  RefreshCw,
} from "lucide-react";

export function AdminProductsTab() {
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    syncCatalog,
    syncInventory,
    isSyncingCatalog,
    isSyncingInventory,
    lastCatalogSync,
  } = useSquareSync();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingProductId, setGeneratingProductId] = useState<string | null>(
    null,
  );
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const handleSyncFromSquare = async () => {
    await syncCatalog();
    await syncInventory();
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const handleDelete = async (product: Product) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      toast({ title: "Failed to delete product", variant: "destructive" });
    } else {
      toast({ title: "Product deleted" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
    setProductToDelete(null);
  };

  const handleGenerateImage = async (product: Product) => {
    setGeneratingProductId(product.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-product-image",
        {
          body: {
            productName: product.name,
            productDescription:
              product.short_description || product.description,
            productSlug: product.slug,
          },
        },
      );

      if (error) throw error;
      toast({ title: `Image generated for ${product.name}` });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      logger.error("Generate error:", error);
      toast({ title: "Failed to generate image", variant: "destructive" });
    } finally {
      setGeneratingProductId(null);
    }
  };

  const handleGenerateAllImages = async () => {
    const productsWithoutImages = products?.filter((p) => !p.image_url) || [];
    if (productsWithoutImages.length === 0) {
      toast({ title: "All products already have images" });
      return;
    }

    setGeneratingAll(true);
    let successCount = 0;

    for (const product of productsWithoutImages) {
      try {
        const { error } = await supabase.functions.invoke(
          "generate-product-image",
          {
            body: {
              productName: product.name,
              productDescription:
                product.short_description || product.description,
              productSlug: product.slug,
            },
          },
        );

        if (!error) successCount++;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Failed to generate image for ${product.name}:`, error);
      }
    }

    toast({
      title: `Generated ${successCount} of ${productsWithoutImages.length} images`,
    });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    setGeneratingAll(false);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const productsWithoutImages =
    products?.filter((p) => !p.image_url).length || 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {lastCatalogSync && (
            <span>
              Last synced: {lastCatalogSync.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleSyncFromSquare}
            disabled={isSyncingCatalog || isSyncingInventory}
          >
            {isSyncingCatalog || isSyncingInventory ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Sync from Square
          </Button>
          {productsWithoutImages > 0 && (
            <Button
              variant="outline"
              onClick={handleGenerateAllImages}
              disabled={generatingAll}
            >
              {generatingAll ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Generate All Images ({productsWithoutImages})
            </Button>
          )}
          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products ({products?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Image className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      {categories?.find(
                        (c) => c.id === product.category_id,
                      )?.name || "-"}
                    </TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {product.is_featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                        {!product.is_available && (
                          <Badge variant="destructive">Unavailable</Badge>
                        )}
                        {!product.active && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleGenerateImage(product)}
                          disabled={generatingProductId === product.id}
                          title="Generate AI image"
                        >
                          {generatingProductId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingProduct(product);
                            setIsFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setProductToDelete(product)}
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={() => setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => productToDelete && handleDelete(productToDelete)}
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
