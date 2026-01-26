import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestData {
    action: 'create_customer' | 'save_card' | 'create_subscription' | 'cancel_subscription' | 'pause_subscription' | 'resume_subscription';
    userId?: string;
    email?: string;
    sourceId?: string; // Card nonce for saving card
    customerId?: string; // Square Customer ID
    planData?: {
        name: string;
        amount: number; // in cents
        interval: 'WEEKLY' | 'EVERY_TWO_WEEKS' | 'MONTHLY';
    };
    subscriptionId?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const data: RequestData = await req.json();
        const { action } = data;

        // Configuration
        const squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
        if (!squareToken) throw new Error("Missing SQUARE_ACCESS_TOKEN");

        const isSandbox = squareToken.startsWith("EAAAl") || squareToken.startsWith("sandbox");
        const baseUrl = isSandbox
            ? "https://connect.squareupsandbox.com/v2"
            : "https://connect.squareup.com/v2";

        console.log(`Processing action: ${action} in ${isSandbox ? 'Sandbox' : 'Production'}`);

        // Helper for Square API calls
        const squareRequest = async (endpoint: string, method: string, body?: any) => {
            const res = await fetch(`${baseUrl}${endpoint}`, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${squareToken}`,
                    "Square-Version": "2024-01-18",
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            const json = await res.json();
            if (!res.ok) {
                console.error("Square API Error:", JSON.stringify(json));
                // Throw detailed error
                const detail = json.errors?.[0]?.detail || "Square API Error";
                throw new Error(detail);
            }
            return json;
        };

        let result;

        switch (action) {
            case 'create_customer': {
                const { email, userId } = data;
                if (!email || !userId) throw new Error("Missing email or userId for create_customer");

                // Search if customer exists first to avoid duplicates
                const searchRes = await squareRequest('/customers/search', 'POST', {
                    query: {
                        filter: {
                            email_address: { exact: email }
                        }
                    }
                });

                if (searchRes.customers?.[0]) {
                    console.log("Customer already exists");
                    result = { customer: searchRes.customers[0] };
                } else {
                    // Create new
                    const payload = {
                        idempotency_key: crypto.randomUUID(),
                        email_address: email,
                        reference_id: userId,
                    };
                    result = await squareRequest('/customers', 'POST', payload);
                }
                break;
            }

            case 'save_card': {
                const { customerId, sourceId } = data;
                if (!customerId || !sourceId) throw new Error("Missing customerId or sourceId for save_card");

                const payload = {
                    idempotency_key: crypto.randomUUID(),
                    source_id: sourceId,
                    card: {
                        customer_id: customerId
                    }
                };
                result = await squareRequest(`/cards`, 'POST', payload);
                break;
            }

            case 'create_subscription': {
                const { planData, customerId, sourceId } = data;
                if (!planData || !customerId || !sourceId) throw new Error("Missing required data for subscription");

                // 1. Find or Create the Subscription Plan in Catalog
                // Naming convention: "Plan [Interval] [Amount]" e.g "Plan WEEKLY 4500"
                const planName = `Plan ${planData.interval} ${planData.amount}`;

                // Search for existing plan
                const searchRes = await squareRequest('/catalog/search', 'POST', {
                    object_types: ['SUBSCRIPTION_PLAN'],
                    query: {
                        exact_query: {
                            attribute_name: 'name',
                            attribute_value: planName
                        }
                    }
                });

                let planId = searchRes.objects?.[0]?.id;

                if (!planId) {
                    console.log(`Plan not found: ${planName}. Creating new...`);
                    // Create new plan
                    const createPlanRes = await squareRequest('/catalog/object', 'POST', {
                        idempotency_key: crypto.randomUUID(),
                        object: {
                            type: 'SUBSCRIPTION_PLAN',
                            id: '#new_plan',
                            subscription_plan_data: {
                                name: planName,
                                phases: [
                                    {
                                        cadence: planData.interval, // WEEKLY, MONTHLY
                                        recurring_price_money: {
                                            amount: planData.amount, // Set the price here
                                            currency: 'USD'
                                        },
                                        ordinal: 0
                                    }
                                ]
                            }
                        }
                    });
                    planId = createPlanRes.catalog_object.id;
                }

                // 2. Create the Subscription
                const subPayload = {
                    idempotency_key: crypto.randomUUID(),
                    location_id: Deno.env.get("SQUARE_LOCATION_ID"), // Need this env var
                    plan_variation_id: planId, // This field maps to the Plan ID
                    customer_id: customerId,
                    card_id: sourceId, // The card on file to charge
                    timezone: 'America/New_York',
                };

                result = await squareRequest('/subscriptions', 'POST', subPayload);
                break;
            }

            case 'cancel_subscription': {
                const { subscriptionId } = data;
                if (!subscriptionId) throw new Error("Missing subscriptionId");
                result = await squareRequest(`/subscriptions/${subscriptionId}/cancel`, 'POST');
                break;
            }

            case 'pause_subscription': {
                const { subscriptionId } = data;
                if (!subscriptionId) throw new Error("Missing subscriptionId");
                result = await squareRequest(`/subscriptions/${subscriptionId}/pause`, 'POST');
                break;
            }

            case 'resume_subscription': {
                const { subscriptionId } = data;
                if (!subscriptionId) throw new Error("Missing subscriptionId");
                result = await squareRequest(`/subscriptions/${subscriptionId}/resume`, 'POST');
                break;
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify({ success: true, data: result }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
