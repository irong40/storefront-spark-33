export type SubscriptionStatus = 'pending' | 'active' | 'paused' | 'canceled' | 'failed';

export interface Subscription {
    id: string;
    user_id: string;
    square_subscription_id: string;
    status: SubscriptionStatus;
    product_id: string | null;
    variant_id: string | null;
    product_name: string;
    amount: number;
    interval: 'WEEKLY' | 'MONTHLY';
    current_period_start: string | null;
    current_period_end: string | null;
    canceled_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface UserPaymentProfile {
    id: string;
    user_id: string;
    square_customer_id: string;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionLog {
    id: string;
    subscription_id: string | null;
    event_type: 'created' | 'renewed' | 'paused' | 'canceled' | 'failed';
    details: any;
    created_at: string;
}
