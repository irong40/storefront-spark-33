import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/hooks/use-categories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Wand2 } from "lucide-react";
import type { Product } from "@/hooks/use-products";

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({
  product,
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const { data: categories } = useCategories();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    short_description: product?.short_description || "",
    description: product?.description || "",
    category_id: product?.category_id || "",
    price: product?.price?.toString() || "",
    compare_at_price: product?.compare_at_price?.toString() || "",
    ingredients: product?.ingredients || "",
    features: product?.features?.join(", ") || "",
    is_featured: product?.is_featured || false,
    is_available: product?.is_available ?? true,
    active: product?.active ?? true,
    image_url: product?.image_url || "",
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !product ? generateSlug(name) : prev.slug,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const fileName = `${formData.slug || "product"}-${Date.now()}.${file.name.split(".").pop()}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.name || !formData.slug) {
      toast({
        title: "Please enter product name first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-product-image",
        {
          body: {
            productName: formData.name,
            productDescription:
              formData.short_description || formData.description,
            productSlug: formData.slug,
          },
        },
      );

      if (error) throw error;

      if (data?.imageUrl) {
        setFormData((prev) => ({ ...prev, image_url: data.imageUrl }));
        toast({ title: "Image generated successfully!" });
      }
    } catch (error) {
      console.error("Generate error:", error);
      toast({ title: "Failed to generate image", variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        short_description: formData.short_description || null,
        description: formData.description || null,
        category_id: formData.category_id || null,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price
          ? parseFloat(formData.compare_at_price)
          : null,
        ingredients: formData.ingredients || null,
        features: formData.features
          ? formData.features.split(",").map((f) => f.trim())
          : null,
        is_featured: formData.is_featured,
        is_available: formData.is_available,
        active: formData.active,
        image_url: formData.image_url || null,
      };

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);
        if (error) throw error;
        toast({ title: "Product updated successfully" });
      } else {
        const { error } = await supabase.from("products").insert(productData);
        if (error) throw error;
        toast({ title: "Product created successfully" });
      }

      onSuccess();
    } catch (error) {
      console.error("Submit error:", error);
      toast({ title: "Failed to save product", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, slug: e.target.value }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, price: e.target.value }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compare_at_price">Compare at Price</Label>
          <Input
            id="compare_at_price"
            type="number"
            step="0.01"
            value={formData.compare_at_price}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                compare_at_price: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, category_id: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="short_description">Short Description</Label>
          <Input
            id="short_description"
            value={formData.short_description}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                short_description: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Full Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ingredients">Ingredients</Label>
          <Textarea
            id="ingredients"
            value={formData.ingredients}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, ingredients: e.target.value }))
            }
            rows={2}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="features">Features (comma separated)</Label>
          <Input
            id="features"
            value={formData.features}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, features: e.target.value }))
            }
            placeholder="Cold-pressed, No added sugar, All natural"
          />
        </div>

        <div className="space-y-4 md:col-span-2">
          <Label>Product Image</Label>

          {formData.image_url && (
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
              <img
                src={formData.image_url}
                alt="Product preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex gap-2">
            <label className="cursor-pointer">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isUploadingImage}
                asChild
              >
                <span>
                  {isUploadingImage ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Image
                </span>
              </Button>
            </label>

            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || !formData.name}
            >
              {isGeneratingImage ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Generate AI Image
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_featured: checked }))
              }
            />
            <Label htmlFor="is_featured">Featured</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_available"
              checked={formData.is_available}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_available: checked }))
              }
            />
            <Label htmlFor="is_available">Available</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, active: checked }))
              }
            />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {product ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
