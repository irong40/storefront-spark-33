import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { optimizedImageSrc } from "@/lib/image-url";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}

export function ProductImage({ src, alt, className, priority, width, height }: ProductImageProps) {
  // URLs that failed to load. The WebP is tried first, then the original, then the placeholder.
  const [failed, setFailed] = useState<string[]>([]);

  const optimized = src ? optimizedImageSrc(src) : null;
  const current =
    optimized && !failed.includes(optimized)
      ? optimized
      : src && !failed.includes(src)
        ? src
        : null;

  if (!current) {
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
      src={current}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={() => setFailed((prev) => [...prev, current])}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? undefined : "async"}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
