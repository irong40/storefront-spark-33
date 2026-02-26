import { useState } from "react";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Validation schemas for the three variant forms
// ---------------------------------------------------------------------------
const sizeFormSchema = z.object({
  name: z.string().min(1, "Size name is required"),
  // size_oz is optional — null means "no size listed", but when provided must be > 0
  size_oz: z
    .number()
    .positive("Size (oz) must be a positive number")
    .nullable()
    .optional()
    .refine((v) => v == null || (typeof v === "number" && v > 0), {
      message: "Size (oz) must be a positive number",
    }),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .nonnegative("Price must be 0 or greater"),
});

const addonFormSchema = z.object({
  name: z.string().min(1, "Internal name is required"),
  display_name: z.string().min(1, "Display name is required"),
  price: z.number().nonnegative("Price must be 0 or greater"),
});

const overrideFormSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  size_name: z.string().min(1, "Size name is required"),
  // size_oz is optional — null means "no size listed", but when provided must be > 0
  size_oz: z
    .number()
    .positive("Size (oz) must be a positive number")
    .nullable()
    .optional()
    .refine((v) => v == null || (typeof v === "number" && v > 0), {
      message: "Size (oz) must be a positive number",
    }),
  price: z
    .number({ invalid_type_error: "Price must be a number" })
    .positive("Price must be greater than 0"),
});
import {
  useProductSizes,
  useProductAddons,
  ProductSize,
  ProductAddon,
} from "@/hooks/use-product-variants";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Ruler,
  Sparkles,
  Package,
} from "lucide-react";

interface SizeFormData {
  name: string;
  size_oz: number | null;
  price: number;
  sort_order: number;
  active: boolean;
}

interface AddonFormData {
  name: string;
  display_name: string;
  price: number;
  sort_order: number;
  active: boolean;
}

interface ProductSizeOverride {
  id: string;
  product_id: string;
  size_name: string;
  size_oz: number | null;
  price: number;
  is_subscription: boolean;
  subscription_interval: string | null;
  sort_order: number;
  active: boolean;
}

interface OverrideFormData {
  product_id: string;
  size_name: string;
  size_oz: number | null;
  price: number;
  is_subscription: boolean;
  subscription_interval: string | null;
  sort_order: number;
  active: boolean;
}

export function ProductVariantsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: sizes, isLoading: sizesLoading } = useProductSizes();
  const { data: addons, isLoading: addonsLoading } = useProductAddons();
  const { data: productsData } = useProducts();
  const products = productsData?.products;

  // Size state
  const [sizeDialogOpen, setSizeDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<ProductSize | null>(null);
  const [sizeForm, setSizeForm] = useState<SizeFormData>({
    name: "",
    size_oz: null,
    price: 0,
    sort_order: 0,
    active: true,
  });
  const [savingSize, setSavingSize] = useState(false);
  const [sizeErrors, setSizeErrors] = useState<Record<string, string>>({});

  // Addon state
  const [addonDialogOpen, setAddonDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<ProductAddon | null>(null);
  const [addonForm, setAddonForm] = useState<AddonFormData>({
    name: "",
    display_name: "",
    price: 0,
    sort_order: 0,
    active: true,
  });
  const [savingAddon, setSavingAddon] = useState(false);
  const [addonErrors, setAddonErrors] = useState<Record<string, string>>({});

  // Override state
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrides, setOverrides] = useState<ProductSizeOverride[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(false);
  const [editingOverride, setEditingOverride] =
    useState<ProductSizeOverride | null>(null);
  const [overrideForm, setOverrideForm] = useState<OverrideFormData>({
    product_id: "",
    size_name: "",
    size_oz: null,
    price: 0,
    is_subscription: false,
    subscription_interval: null,
    sort_order: 0,
    active: true,
  });
  const [savingOverride, setSavingOverride] = useState(false);
  const [overrideErrors, setOverrideErrors] = useState<Record<string, string>>({});

  // Load overrides
  const loadOverrides = async () => {
    setOverridesLoading(true);
    const { data, error } = await supabase
      .from("product_size_overrides")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setOverrides(data);
    }
    setOverridesLoading(false);
  };

  // Size handlers
  const openSizeDialog = (size?: ProductSize) => {
    setSizeErrors({});
    if (size) {
      setEditingSize(size);
      setSizeForm({
        name: size.name,
        size_oz: size.size_oz,
        price: size.price,
        sort_order: size.sort_order,
        active: size.active,
      });
    } else {
      setEditingSize(null);
      setSizeForm({
        name: "",
        size_oz: null,
        price: 0,
        sort_order: (sizes?.length || 0) + 1,
        active: true,
      });
    }
    setSizeDialogOpen(true);
  };

  const saveSize = async () => {
    const validation = sizeFormSchema.safeParse({
      name: sizeForm.name,
      size_oz: sizeForm.size_oz,
      price: sizeForm.price,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field && !fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setSizeErrors(fieldErrors);
      return;
    }

    setSizeErrors({});
    setSavingSize(true);
    try {
      if (editingSize) {
        const { error } = await supabase
          .from("product_sizes")
          .update(sizeForm)
          .eq("id", editingSize.id);
        if (error) throw error;
        toast({ title: "Size updated" });
      } else {
        const { error } = await supabase.from("product_sizes").insert(sizeForm);
        if (error) throw error;
        toast({ title: "Size created" });
      }
      queryClient.invalidateQueries({ queryKey: ["product-sizes"] });
      setSizeDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Failed to save size",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingSize(false);
    }
  };

  const deleteSize = async (id: string) => {
    const { error } = await supabase
      .from("product_sizes")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Failed to delete size", variant: "destructive" });
    } else {
      toast({ title: "Size deleted" });
      queryClient.invalidateQueries({ queryKey: ["product-sizes"] });
    }
  };

  // Addon handlers
  const openAddonDialog = (addon?: ProductAddon) => {
    setAddonErrors({});
    if (addon) {
      setEditingAddon(addon);
      setAddonForm({
        name: addon.name,
        display_name: addon.display_name,
        price: addon.price,
        sort_order: addon.sort_order,
        active: addon.active,
      });
    } else {
      setEditingAddon(null);
      setAddonForm({
        name: "",
        display_name: "",
        price: 0,
        sort_order: (addons?.length || 0) + 1,
        active: true,
      });
    }
    setAddonDialogOpen(true);
  };

  const saveAddon = async () => {
    const validation = addonFormSchema.safeParse({
      name: addonForm.name,
      display_name: addonForm.display_name,
      price: addonForm.price,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field && !fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setAddonErrors(fieldErrors);
      return;
    }

    setAddonErrors({});
    setSavingAddon(true);
    try {
      if (editingAddon) {
        const { error } = await supabase
          .from("product_addons")
          .update(addonForm)
          .eq("id", editingAddon.id);
        if (error) throw error;
        toast({ title: "Add-on updated" });
      } else {
        const { error } = await supabase
          .from("product_addons")
          .insert(addonForm);
        if (error) throw error;
        toast({ title: "Add-on created" });
      }
      queryClient.invalidateQueries({ queryKey: ["product-addons"] });
      setAddonDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Failed to save add-on",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingAddon(false);
    }
  };

  const deleteAddon = async (id: string) => {
    const { error } = await supabase
      .from("product_addons")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Failed to delete add-on", variant: "destructive" });
    } else {
      toast({ title: "Add-on deleted" });
      queryClient.invalidateQueries({ queryKey: ["product-addons"] });
    }
  };

  // Override handlers
  const openOverrideDialog = (override?: ProductSizeOverride) => {
    setOverrideErrors({});
    if (override) {
      setEditingOverride(override);
      setOverrideForm({
        product_id: override.product_id,
        size_name: override.size_name,
        size_oz: override.size_oz,
        price: override.price,
        is_subscription: override.is_subscription,
        subscription_interval: override.subscription_interval,
        sort_order: override.sort_order,
        active: override.active,
      });
    } else {
      setEditingOverride(null);
      setOverrideForm({
        product_id: "",
        size_name: "",
        size_oz: null,
        price: 0,
        is_subscription: false,
        subscription_interval: null,
        sort_order: overrides.length + 1,
        active: true,
      });
    }
    setOverrideDialogOpen(true);
  };

  const saveOverride = async () => {
    const validation = overrideFormSchema.safeParse({
      product_id: overrideForm.product_id,
      size_name: overrideForm.size_name,
      size_oz: overrideForm.size_oz,
      price: overrideForm.price,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field && !fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setOverrideErrors(fieldErrors);
      return;
    }

    setOverrideErrors({});
    setSavingOverride(true);
    try {
      if (editingOverride) {
        const { error } = await supabase
          .from("product_size_overrides")
          .update(overrideForm)
          .eq("id", editingOverride.id);
        if (error) throw error;
        toast({ title: "Override updated" });
      } else {
        const { error } = await supabase
          .from("product_size_overrides")
          .insert(overrideForm);
        if (error) throw error;
        toast({ title: "Override created" });
      }
      loadOverrides();
      setOverrideDialogOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Failed to save override",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSavingOverride(false);
    }
  };

  const deleteOverride = async (id: string) => {
    const { error } = await supabase
      .from("product_size_overrides")
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Failed to delete override", variant: "destructive" });
    } else {
      toast({ title: "Override deleted" });
      loadOverrides();
    }
  };

  // Load overrides on mount
  useState(() => {
    loadOverrides();
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="sizes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sizes" className="gap-2">
            <Ruler className="h-4 w-4" />
            Sizes
          </TabsTrigger>
          <TabsTrigger value="addons" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Add-ons
          </TabsTrigger>
          <TabsTrigger value="overrides" className="gap-2">
            <Package className="h-4 w-4" />
            Product Overrides
          </TabsTrigger>
        </TabsList>

        {/* Sizes Tab */}
        <TabsContent value="sizes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Global Sizes</CardTitle>
                <CardDescription>
                  Default size options available for all products
                </CardDescription>
              </div>
              <Button onClick={() => openSizeDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Size
              </Button>
            </CardHeader>
            <CardContent>
              {sizesLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Size (oz)</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sizes?.map((size) => (
                      <TableRow key={size.id}>
                        <TableCell className="font-medium">
                          {size.name}
                        </TableCell>
                        <TableCell>{size.size_oz || "-"}</TableCell>
                        <TableCell>${size.price.toFixed(2)}</TableCell>
                        <TableCell>{size.sort_order}</TableCell>
                        <TableCell>
                          <span
                            className={
                              size.active
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {size.active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openSizeDialog(size)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteSize(size.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add-ons Tab */}
        <TabsContent value="addons">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Add-ons</CardTitle>
                <CardDescription>
                  Extra ingredients customers can add to products
                </CardDescription>
              </div>
              <Button onClick={() => openAddonDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Add-on
              </Button>
            </CardHeader>
            <CardContent>
              {addonsLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Display Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {addons?.map((addon) => (
                      <TableRow key={addon.id}>
                        <TableCell className="font-medium">
                          {addon.name}
                        </TableCell>
                        <TableCell>{addon.display_name}</TableCell>
                        <TableCell>+${addon.price.toFixed(2)}</TableCell>
                        <TableCell>{addon.sort_order}</TableCell>
                        <TableCell>
                          <span
                            className={
                              addon.active
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {addon.active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openAddonDialog(addon)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteAddon(addon.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Overrides Tab */}
        <TabsContent value="overrides">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Size Overrides</CardTitle>
                <CardDescription>
                  Custom sizes for specific products (e.g., subscriptions,
                  special packs)
                </CardDescription>
              </div>
              <Button onClick={() => openOverrideDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Override
              </Button>
            </CardHeader>
            <CardContent>
              {overridesLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Size Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overrides.map((override) => (
                      <TableRow key={override.id}>
                        <TableCell className="font-medium">
                          {products?.find((p) => p.id === override.product_id)
                            ?.name || override.product_id}
                        </TableCell>
                        <TableCell>{override.size_name}</TableCell>
                        <TableCell>${override.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {override.is_subscription ? (
                            <span className="text-primary">
                              {override.subscription_interval}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              override.active
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {override.active ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openOverrideDialog(override)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteOverride(override.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Size Dialog */}
      <Dialog open={sizeDialogOpen} onOpenChange={setSizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSize ? "Edit Size" : "Add Size"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="size-name">Name</Label>
              <Input
                id="size-name"
                value={sizeForm.name}
                onChange={(e) => {
                  setSizeForm({ ...sizeForm, name: e.target.value });
                  if (sizeErrors.name) setSizeErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="e.g., Small, Medium, Large"
                aria-invalid={!!sizeErrors.name}
              />
              {sizeErrors.name && (
                <p className="text-sm text-destructive mt-1">{sizeErrors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="size-oz">Size (oz)</Label>
              <Input
                id="size-oz"
                type="number"
                value={sizeForm.size_oz || ""}
                onChange={(e) => {
                  setSizeForm({
                    ...sizeForm,
                    size_oz: e.target.value ? Number(e.target.value) : null,
                  });
                  if (sizeErrors.size_oz) setSizeErrors((prev) => ({ ...prev, size_oz: "" }));
                }}
                placeholder="e.g., 16"
                aria-invalid={!!sizeErrors.size_oz}
              />
              {sizeErrors.size_oz && (
                <p className="text-sm text-destructive mt-1">{sizeErrors.size_oz}</p>
              )}
            </div>
            <div>
              <Label htmlFor="size-price">Price</Label>
              <Input
                id="size-price"
                type="number"
                step="0.01"
                value={sizeForm.price}
                onChange={(e) => {
                  setSizeForm({ ...sizeForm, price: Number(e.target.value) });
                  if (sizeErrors.price) setSizeErrors((prev) => ({ ...prev, price: "" }));
                }}
                aria-invalid={!!sizeErrors.price}
              />
              {sizeErrors.price && (
                <p className="text-sm text-destructive mt-1">{sizeErrors.price}</p>
              )}
            </div>
            <div>
              <Label htmlFor="size-order">Sort Order</Label>
              <Input
                id="size-order"
                type="number"
                value={sizeForm.sort_order}
                onChange={(e) =>
                  setSizeForm({
                    ...sizeForm,
                    sort_order: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="size-active"
                checked={sizeForm.active}
                onCheckedChange={(checked) =>
                  setSizeForm({ ...sizeForm, active: checked })
                }
              />
              <Label htmlFor="size-active">Active</Label>
            </div>
            <Button onClick={saveSize} disabled={savingSize} className="w-full">
              {savingSize && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingSize ? "Update Size" : "Create Size"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Addon Dialog */}
      <Dialog open={addonDialogOpen} onOpenChange={setAddonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddon ? "Edit Add-on" : "Add Add-on"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="addon-name">Internal Name</Label>
              <Input
                id="addon-name"
                value={addonForm.name}
                onChange={(e) => {
                  setAddonForm({ ...addonForm, name: e.target.value });
                  if (addonErrors.name) setAddonErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="e.g., extra_ginger"
                aria-invalid={!!addonErrors.name}
              />
              {addonErrors.name && (
                <p className="text-sm text-destructive mt-1">{addonErrors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="addon-display">Display Name</Label>
              <Input
                id="addon-display"
                value={addonForm.display_name}
                onChange={(e) => {
                  setAddonForm({ ...addonForm, display_name: e.target.value });
                  if (addonErrors.display_name) setAddonErrors((prev) => ({ ...prev, display_name: "" }));
                }}
                placeholder="e.g., Extra Ginger"
                aria-invalid={!!addonErrors.display_name}
              />
              {addonErrors.display_name && (
                <p className="text-sm text-destructive mt-1">{addonErrors.display_name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="addon-price">Price</Label>
              <Input
                id="addon-price"
                type="number"
                step="0.01"
                value={addonForm.price}
                onChange={(e) => {
                  setAddonForm({ ...addonForm, price: Number(e.target.value) });
                  if (addonErrors.price) setAddonErrors((prev) => ({ ...prev, price: "" }));
                }}
                aria-invalid={!!addonErrors.price}
              />
              {addonErrors.price && (
                <p className="text-sm text-destructive mt-1">{addonErrors.price}</p>
              )}
            </div>
            <div>
              <Label htmlFor="addon-order">Sort Order</Label>
              <Input
                id="addon-order"
                type="number"
                value={addonForm.sort_order}
                onChange={(e) =>
                  setAddonForm({
                    ...addonForm,
                    sort_order: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="addon-active"
                checked={addonForm.active}
                onCheckedChange={(checked) =>
                  setAddonForm({ ...addonForm, active: checked })
                }
              />
              <Label htmlFor="addon-active">Active</Label>
            </div>
            <Button
              onClick={saveAddon}
              disabled={savingAddon}
              className="w-full"
            >
              {savingAddon && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingAddon ? "Update Add-on" : "Create Add-on"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOverride ? "Edit Override" : "Add Override"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="override-product">Product</Label>
              <Select
                value={overrideForm.product_id}
                onValueChange={(value) => {
                  setOverrideForm({ ...overrideForm, product_id: value });
                  if (overrideErrors.product_id) setOverrideErrors((prev) => ({ ...prev, product_id: "" }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {overrideErrors.product_id && (
                <p className="text-sm text-destructive mt-1">{overrideErrors.product_id}</p>
              )}
            </div>
            <div>
              <Label htmlFor="override-size-name">Size Name</Label>
              <Input
                id="override-size-name"
                value={overrideForm.size_name}
                onChange={(e) => {
                  setOverrideForm({ ...overrideForm, size_name: e.target.value });
                  if (overrideErrors.size_name) setOverrideErrors((prev) => ({ ...prev, size_name: "" }));
                }}
                placeholder="e.g., Weekly Pack, Monthly Subscription"
                aria-invalid={!!overrideErrors.size_name}
              />
              {overrideErrors.size_name && (
                <p className="text-sm text-destructive mt-1">{overrideErrors.size_name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="override-oz">Size (oz)</Label>
              <Input
                id="override-oz"
                type="number"
                value={overrideForm.size_oz || ""}
                onChange={(e) => {
                  setOverrideForm({
                    ...overrideForm,
                    size_oz: e.target.value ? Number(e.target.value) : null,
                  });
                  if (overrideErrors.size_oz) setOverrideErrors((prev) => ({ ...prev, size_oz: "" }));
                }}
                aria-invalid={!!overrideErrors.size_oz}
              />
              {overrideErrors.size_oz && (
                <p className="text-sm text-destructive mt-1">{overrideErrors.size_oz}</p>
              )}
            </div>
            <div>
              <Label htmlFor="override-price">Price</Label>
              <Input
                id="override-price"
                type="number"
                step="0.01"
                value={overrideForm.price}
                onChange={(e) => {
                  setOverrideForm({ ...overrideForm, price: Number(e.target.value) });
                  if (overrideErrors.price) setOverrideErrors((prev) => ({ ...prev, price: "" }));
                }}
                aria-invalid={!!overrideErrors.price}
              />
              {overrideErrors.price && (
                <p className="text-sm text-destructive mt-1">{overrideErrors.price}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="override-subscription"
                checked={overrideForm.is_subscription}
                onCheckedChange={(checked) =>
                  setOverrideForm({ ...overrideForm, is_subscription: checked })
                }
              />
              <Label htmlFor="override-subscription">Is Subscription</Label>
            </div>
            {overrideForm.is_subscription && (
              <div>
                <Label htmlFor="override-interval">Subscription Interval</Label>
                <Select
                  value={overrideForm.subscription_interval || ""}
                  onValueChange={(value) =>
                    setOverrideForm({
                      ...overrideForm,
                      subscription_interval: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="override-order">Sort Order</Label>
              <Input
                id="override-order"
                type="number"
                value={overrideForm.sort_order}
                onChange={(e) =>
                  setOverrideForm({
                    ...overrideForm,
                    sort_order: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="override-active"
                checked={overrideForm.active}
                onCheckedChange={(checked) =>
                  setOverrideForm({ ...overrideForm, active: checked })
                }
              />
              <Label htmlFor="override-active">Active</Label>
            </div>
            <Button
              onClick={saveOverride}
              disabled={savingOverride}
              className="w-full"
            >
              {savingOverride && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingOverride ? "Update Override" : "Create Override"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
