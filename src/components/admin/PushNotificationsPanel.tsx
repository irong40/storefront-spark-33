import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Trash2, Smartphone } from "lucide-react";

interface SubscriptionRow {
  id: string;
  endpoint: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function summarizeUserAgent(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS device";
  if (/Android/i.test(ua)) return "Android device";
  if (/Mac OS X/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows PC";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown device";
}

export function PushNotificationsPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  useEffect(() => {
    const ok = typeof window !== "undefined"
      && "serviceWorker" in navigator
      && "PushManager" in window
      && "Notification" in window;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  const refreshSubscriptions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, user_agent, created_at, last_seen_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Could not load devices", description: error.message, variant: "destructive" });
    } else {
      setSubscriptions(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (!supported || !user) return;
    refreshSubscriptions();
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setCurrentEndpoint(sub?.endpoint || null))
      .catch(() => {});
  }, [supported, user, refreshSubscriptions]);

  const enable = async () => {
    if (!user) return;
    if (!VAPID_PUBLIC_KEY) {
      toast({
        title: "VAPID public key missing",
        description: "VITE_VAPID_PUBLIC_KEY is not set in this environment.",
        variant: "destructive",
      });
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast({
          title: "Notifications blocked",
          description: "Allow notifications in your browser settings to enable order alerts.",
          variant: "destructive",
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const subJson = sub.toJSON();
      const p256dh = subJson.keys?.p256dh
        || arrayBufferToBase64Url(sub.getKey("p256dh"));
      const auth = subJson.keys?.auth
        || arrayBufferToBase64Url(sub.getKey("auth"));

      const { error: upsertError } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            endpoint: sub.endpoint,
            p256dh_key: p256dh,
            auth_key: auth,
            user_agent: navigator.userAgent,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "endpoint" },
        );

      if (upsertError) {
        toast({ title: "Couldn't save subscription", description: upsertError.message, variant: "destructive" });
        return;
      }

      setCurrentEndpoint(sub.endpoint);
      toast({ title: "Notifications enabled", description: "This device will receive order alerts." });
      await refreshSubscriptions();
    } catch (err) {
      toast({
        title: "Failed to enable",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const disableThisDevice = async () => {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setCurrentEndpoint(null);
      toast({ title: "Notifications disabled on this device" });
      await refreshSubscriptions();
    } catch (err) {
      toast({ title: "Failed to disable", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const removeDevice = async (row: SubscriptionRow) => {
    setBusy(true);
    try {
      const { error } = await supabase.from("push_subscriptions").delete().eq("id", row.id);
      if (error) throw error;
      if (row.endpoint === currentEndpoint) {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        await sub?.unsubscribe();
        setCurrentEndpoint(null);
      }
      toast({ title: "Device removed" });
      await refreshSubscriptions();
    } catch (err) {
      toast({ title: "Failed to remove", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          title: "Test notification",
          body: "If you see this, alerts are working.",
          url: "/admin",
          tag: "test",
          recipient_user_id: user.id,
        },
      });
      if (error) throw error;
      const result = data as { sent?: number; failed?: number };
      toast({
        title: `Test sent: ${result?.sent ?? 0} delivered, ${result?.failed ?? 0} failed`,
      });
    } catch (err) {
      toast({ title: "Test failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Order Notifications</CardTitle>
          <CardDescription>
            This browser doesn't support push notifications. Try Chrome or Edge on Android,
            or install this site to your iPhone home screen first (iOS 16.4+).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const thisDeviceEnrolled = subscriptions.some((s) => s.endpoint === currentEndpoint);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Order Notifications</CardTitle>
        <CardDescription>
          Get a push notification on this device every time a new order is placed.
          Email confirmation still goes out as a backup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {thisDeviceEnrolled ? (
            <Button variant="outline" onClick={disableThisDevice} disabled={busy}>
              <BellOff className="w-4 h-4 mr-2" /> Disable on this device
            </Button>
          ) : (
            <Button onClick={enable} disabled={busy || permission === "denied"}>
              <Bell className="w-4 h-4 mr-2" />
              {permission === "denied" ? "Notifications blocked in browser" : "Enable on this device"}
            </Button>
          )}
          <Button variant="secondary" onClick={sendTest} disabled={busy || subscriptions.length === 0}>
            Send test notification
          </Button>
        </div>

        <div>
          <h4 className="font-medium mb-2">Enrolled devices</h4>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No devices enrolled yet.</p>
          ) : (
            <ul className="space-y-2">
              {subscriptions.map((sub) => (
                <li
                  key={sub.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Smartphone className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {summarizeUserAgent(sub.user_agent)}
                        {sub.endpoint === currentEndpoint && (
                          <span className="ml-2 text-xs text-emerald-600">(this device)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last active {new Date(sub.last_seen_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDevice(sub)}
                    disabled={busy}
                    aria-label="Remove device"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
