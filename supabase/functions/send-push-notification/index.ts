import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  recipient_user_id?: string;
  recipient_role?: "admin";
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:info@impressivejb.com";

    if (!vapidPublic || !vapidPrivate) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const payload: PushPayload = await req.json();
    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh_key, auth_key");

    if (payload.recipient_user_id) {
      query = query.eq("user_id", payload.recipient_user_id);
    } else if (payload.recipient_role === "admin") {
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (rolesError) throw rolesError;
      const adminIds = (adminRoles || []).map((r) => r.user_id);
      if (adminIds.length === 0) {
        return new Response(
          JSON.stringify({ sent: 0, failed: 0, note: "no admins found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      query = query.in("user_id", adminIds);
    } else {
      return new Response(
        JSON.stringify({ error: "recipient_user_id or recipient_role required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: subs, error: subsError } = await query;
    if (subsError) throw subsError;

    const subscriptions = (subs || []) as SubscriptionRow[];
    if (subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, failed: 0, note: "no enrolled devices" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const notificationBody = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/admin",
      tag: payload.tag,
    });

    const deadEndpoints: string[] = [];
    const seenAtIds: string[] = [];
    let sent = 0;
    let failed = 0;

    await Promise.all(
      subscriptions.map(async (sub) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
        };
        try {
          await webpush.sendNotification(pushSub, notificationBody, { TTL: 60 });
          sent++;
          seenAtIds.push(sub.id);
        } catch (err) {
          const statusCode = (err as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            deadEndpoints.push(sub.endpoint);
          } else {
            console.error("Push error", statusCode, (err as Error).message);
          }
          failed++;
        }
      }),
    );

    if (deadEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", deadEndpoints);
      console.log(`Pruned ${deadEndpoints.length} dead subscription(s)`);
    }

    if (seenAtIds.length > 0) {
      await supabase
        .from("push_subscriptions")
        .update({ last_seen_at: new Date().toISOString() })
        .in("id", seenAtIds);
    }

    return new Response(
      JSON.stringify({ sent, failed, pruned: deadEndpoints.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-push-notification fatal:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
