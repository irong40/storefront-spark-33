import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const productFormSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Name must be 255 characters or less"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255, "Slug must be 255 characters or less")
    .regex(
      slugRegex,
      "Slug must be lowercase letters, numbers, and hyphens only (no leading/trailing hyphens)",
    ),
  short_description: z
    .string()
    .max(500, "Short description must be 500 characters or less")
    .optional()
    .or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  category_id: z.string().optional().or(z.literal("")),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Price must be a positive number",
    }),
  compare_at_price: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) > 0),
      { message: "Compare-at price must be a positive number" },
    ),
  ingredients: z.string().optional().or(z.literal("")),
  features: z.string().optional().or(z.literal("")),
  image_url: z
    .string()
    .optional()
    .refine(
      (v) => {
        if (!v) return true;
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Image URL must be a valid URL" },
    ),
  is_featured: z.boolean(),
  is_available: z.boolean(),
  active: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
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

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
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
    },
  });

  const watchedName = watch("name");
  const watchedSlug = watch("slug");
  const watchedImageUrl = watch("image_url");
  const watchedIsFeatured = watch("is_featured");
  const watchedIsAvailable = watch("is_available");
  const watchedActive = watch("active");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setValue("name", name, { shouldValidate: true });
    if (!product) {
      setValue("slug", generateSlug(name), { shouldValidate: true });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, WebP, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Image must be under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const safeSlug = (watchedSlug || "product").replace(/[^a-z0-9-]/g, "");
      const fileName = `${safeSlug}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setValue("image_url", urlData.publicUrl, { shouldValidate: true });
      toast({ title: "Image uploaded successfully" });
    } catch (error) {
      logger.error("Upload error:", error);
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!watchedName || !watchedSlug) {
      toast({
        title: "Please enter product name first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const shortDesc = watch("short_description");
      const desc = watch("description");
      const { data, error } = await supabase.functions.invoke(
        "generate-product-image",
        {
          body: {
            productName: watchedName,
            productDescription: shortDesc || desc,
            productSlug: watchedSlug,
          },
        },
      );

      if (error) throw error;

      if (data?.imageUrl) {
        setValue("image_url", data.imageUrl, { shouldValidate: true });
        toast({ title: "Image generated successfully!" });
      }
    } catch (error) {
      logger.error("Generate error:", error);
      toast({ title: "Failed to generate image", variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);

    try {
      const productData = {
        name: values.name,
        slug: values.slug,
        short_description: values.short_description || null,
        description: values.description || null,
        category_id: values.category_id || null,
        price: parseFloat(values.price),
        compare_at_price: values.compare_at_price
          ? parseFloat(values.compare_at_price)
          : null,
        ingredients: values.ingredients || null,
        features: values.features
          ? values.features.split(",").map((f) => f.trim())
          : null,
        is_featured: values.is_featured,
        is_available: values.is_available,
        active: values.active,
        image_url: values.image_url || null,
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
      logger.error("Submit error:", error);
      toast({ title: "Failed to save product", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            value={watchedName}
            onChange={(e) => handleNameChange(e.target.value)}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            {...register("slug")}
            aria-invalid={!!errors.slug}
          />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register("price")}
            aria-invalid={!!errors.price}
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="compare_at_price">Compare at Price</Label>
          <Input
            id="compare_at_price"
            type="number"
            step="0.01"
            {...register("compare_at_price")}
            aria-invalid={!!errors.compare_at_price}
          />
          {errors.compare_at_price && (
            <p className="text-sm text-destructive">
              {errors.compare_at_price.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="category">Category</Label>
          <Controller
            name="category_id"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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
            )}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="short_description">Short Description</Label>
          <Input
            id="short_description"
            {...register("short_description")}
            aria-invalid={!!errors.short_description}
          />
          {errors.short_description && (
            <p className="text-sm text-destructive">
              {errors.short_description.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Full Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            rows={3}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ingredients">Ingredients</Label>
          <Textarea
            id="ingredients"
            {...register("ingredients")}
            rows={2}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="features">Features (comma separated)</Label>
          <Input
            id="features"
            {...register("features")}
            placeholder="Cold-pressed, No added sugar, All natural"
          />
        </div>

        <div className="space-y-4 md:col-span-2">
          <Label>Product Image</Label>

          {watchedImageUrl && (
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted">
              <img
                src={watchedImageUrl}
                alt="Product preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {errors.image_url && (
            <p className="text-sm text-destructive">
              {errors.image_url.message}
            </p>
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
              disabled={isGeneratingImage || !watchedName}
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
              checked={watchedIsFeatured}
              onCheckedChange={(checked) =>
                setValue("is_featured", checked)
              }
            />
            <Label htmlFor="is_featured">Featured</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_available"
              checked={watchedIsAvailable}
              onCheckedChange={(checked) =>
                setValue("is_available", checked)
              }
            />
            <Label htmlFor="is_available">Available</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="active"
              checked={watchedActive}
              onCheckedChange={(checked) => setValue("active", checked)}
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
