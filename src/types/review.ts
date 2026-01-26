export type ReviewStatus = 'published' | 'pending' | 'hidden';

export interface Review {
    id: string;
    user_id: string;
    product_id: string;
    rating: number; // 1-5
    title: string | null;
    comment: string | null;
    is_verified_purchase: boolean;
    status: ReviewStatus;
    created_at: string;
    updated_at: string;
    user?: {
        full_name: string | null;
    };
}
