import { formatDistanceToNow } from 'date-fns';
import { BadgeCheck, User } from 'lucide-react';
import { StarRating } from './StarRating';
import type { Review } from '@/types/review';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ReviewCardProps {
    review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
    return (
        <Card className="p-4 border-border/50">
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">
                            {review.user?.full_name || 'Anonymous User'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {review.is_verified_purchase && (
                                <div className="flex items-center gap-1 text-green-600 font-medium">
                                    <BadgeCheck size={12} />
                                    Verified Purchase
                                </div>
                            )}
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mb-2">
                <StarRating rating={review.rating} size={14} />
            </div>

            {review.title && (
                <h4 className="font-semibold mb-1">{review.title}</h4>
            )}

            {review.comment && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                </p>
            )}
        </Card>
    );
}
