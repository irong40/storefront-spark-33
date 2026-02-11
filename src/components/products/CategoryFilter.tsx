import { useCategories } from "@/hooks/use-categories";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? "default" : "outline"}
        className={cn(
          "rounded-full transition-all",
          selectedCategory === null
            ? "bg-brand-berry text-white hover:bg-brand-berry/90"
            : "border-brand-terracotta/30 text-brand-olive hover:bg-brand-olive hover:text-white hover:border-brand-olive",
        )}
        onClick={() => onSelectCategory(null)}
      >
        All Products
      </Button>
      {categories?.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.slug ? "default" : "outline"}
          className={cn(
            "rounded-full transition-all",
            selectedCategory === category.slug
              ? "bg-brand-berry text-white hover:bg-brand-berry/90"
              : "border-brand-terracotta/30 text-brand-olive hover:bg-brand-olive hover:text-white hover:border-brand-olive",
          )}
          onClick={() => onSelectCategory(category.slug)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
}
