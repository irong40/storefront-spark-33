import { Star, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number; // 0 to 5
    maxRating?: number;
    size?: number;
    className?: string;
    showText?: boolean;
}

export function StarRating({
    rating,
    maxRating = 5,
    size = 16,
    className,
    showText = false
}: StarRatingProps) {

    return (
        <div className={cn("flex items-center gap-1", className)}>
            <div className="flex">
                {[...Array(maxRating)].map((_, i) => {
                    const fill = i < Math.floor(rating);
                    const half = i === Math.floor(rating) && rating % 1 >= 0.5;

                    return (
                        <div key={i} className="relative">
                            <Star
                                size={size}
                                className={cn(
                                    "text-muted-foreground/30",
                                    fill ? "text-yellow-400 fill-yellow-400" : ""
                                )}
                            />
                            {half && (
                                <div className="absolute top-0 left-0 overflow-hidden w-1/2">
                                    <Star
                                        size={size}
                                        className="text-yellow-400 fill-yellow-400"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {showText && (
                <span className="text-sm text-muted-foreground ml-1">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
}
