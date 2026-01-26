import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { StarRating } from '@/components/reviews/StarRating';
import { formatDistanceToNow } from 'date-fns';
import { Check, EyeOff, Trash2, BadgeCheck } from 'lucide-react';
import type { Review } from '@/types/review';
import { Skeleton } from '@/components/ui/skeleton';

export function ReviewsTable() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchReviews();
    }, []);

    async function fetchReviews() {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('reviews')
            .select('*, user:user_id(full_name)')
            .order('created_at', { ascending: false });

        if (error) {
            toast({
                title: 'Error fetching reviews',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            setReviews(data as unknown as Review[]);
        }
        setIsLoading(false);
    }

    async function updateStatus(id: string, status: 'published' | 'hidden') {
        const { error } = await supabase
            .from('reviews')
            .update({ status })
            .eq('id', id);

        if (error) {
            toast({
                title: 'Update failed',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            toast({
                title: `Review ${status === 'published' ? 'Published' : 'Hidden'}`,
            });
            fetchReviews();
        }
    }

    async function deleteReview(id: string) {
        if (!confirm('Are you sure you want to delete this review?')) return;

        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', id);

        if (error) {
            toast({
                title: 'Delete failed',
                description: error.message,
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Review deleted',
            });
            fetchReviews();
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {reviews.map((review) => (
                    <TableRow key={review.id}>
                        <TableCell className="whitespace-nowrap font-medium text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{review.user?.full_name || 'Anonymous'}</span>
                                {review.is_verified_purchase && (
                                    <span className="text-[10px] text-green-600 flex items-center gap-1">
                                        <BadgeCheck size={10} /> Verified
                                    </span>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <StarRating rating={review.rating} size={12} />
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                            <div className="font-medium text-sm truncate">{review.title}</div>
                            <div className="text-xs text-muted-foreground truncate" title={review.comment || ''}>
                                {review.comment}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={
                                review.status === 'published' ? 'default' :
                                    review.status === 'hidden' ? 'destructive' : 'secondary'
                            }>
                                {review.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                                {review.status !== 'published' && (
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => updateStatus(review.id, 'published')} title="Publish">
                                        <Check size={16} />
                                    </Button>
                                )}
                                {review.status !== 'hidden' && (
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600" onClick={() => updateStatus(review.id, 'hidden')} title="Hide">
                                        <EyeOff size={16} />
                                    </Button>
                                )}
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteReview(review.id)} title="Delete">
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
