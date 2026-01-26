import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Review } from '@/types/review';
import { ReviewCard } from './ReviewCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquareOff } from 'lucide-react';
import { ReviewForm } from './ReviewForm';

interface ReviewListProps {
    productId: string;
    productName: string;
}

export function ReviewList({ productId, productName }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchReviews() {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .select(`*, user:user_id(full_name)`)
                    .eq('product_id', productId)
                    .eq('status', 'published') // Only show published reviews
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setReviews(data as unknown as Review[]);
            } catch (err: any) {
                console.error('Failed to fetch reviews:', err);
                setError('Failed to load reviews.');
            } finally {
                setIsLoading(false);
            }
        }

        fetchReviews();
    }, [productId]);

    const handleReviewSuccess = () => {
        // Simple reload for now, or could refetch
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-destructive bg-destructive/5 rounded-xl">
                <p>{error}</p>
                <Button variant="link" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border/50">
                <MessageSquareOff className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium text-lg mb-1">No reviews yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                    Be the first to share your thoughts on this product!
                </p>
                <div className="flex justify-center">
                    <ReviewForm
                        productId={productId}
                        productName={productName}
                        onSuccess={handleReviewSuccess}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium hidden">Reviews</h3>
                <div className="ml-auto">
                    <ReviewForm
                        productId={productId}
                        productName={productName}
                        onSuccess={handleReviewSuccess}
                        trigger={<Button variant="outline">Write a Review</Button>}
                    />
                </div>
            </div>
            <div className="space-y-4">
                {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                ))}
            </div>
        </div>
    );
}
