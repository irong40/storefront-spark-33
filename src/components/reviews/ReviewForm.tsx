import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";

interface ReviewFormProps {
    productId: string;
    productName: string;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
}

export function ReviewForm({ productId, productName, onSuccess, trigger }: ReviewFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({
                title: "Please sign in",
                description: "You must be signed in to leave a review.",
                variant: "destructive"
            });
            return;
        }

        if (rating === 0) {
            toast({
                title: "Rating required",
                description: "Please select a star rating.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    product_id: productId,
                    user_id: user.id,
                    rating,
                    title,
                    comment
                });

            if (error) throw error;

            toast({
                title: "Review submitted!",
                description: "Thank you for your feedback.",
            });

            setOpen(false);
            resetForm();
            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error('Review submission error:', error);
            toast({
                title: "Submission failed",
                description: error.message || "Could not save your review.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setRating(0);
        setTitle('');
        setComment('');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Write a Review</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Write a Review</DialogTitle>
                    <DialogDescription>
                        Share your thoughts on {productName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">

                    {/* Star Rating Input */}
                    <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-xl">
                        <Label className="mb-2 text-muted-foreground">Overall Rating</Label>
                        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        size={32}
                                        className={cn(
                                            "transition-colors",
                                            (hoverRating || rating) >= star
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-muted-foreground/30"
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Review Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Delicious and refreshing!"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="comment">Comments</Label>
                        <Textarea
                            id="comment"
                            placeholder="What did you like or dislike?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                    </div>

                </form>
            </DialogContent>
        </Dialog>
    );
}
