import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function ProductImage({ src, alt, className, priority }: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted", className)}
        aria-label={alt}
        role="img"
      >
        <ImageOff className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
