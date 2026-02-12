import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ApplicationServer,
  importVapidKeys,
  PushMessageError,
  Urgency,
  type PushSubscription,
} from "jsr:@negrel/webpush@0.5.0";
import { decode as base64Decode, encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getReminderTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    manha: "🌅 Oração da Manhã",
    tarde: "☀️ Oração da Tarde",
    noite: "🌙 Oração da Noite",
    personalizado: "🙏 Momento de Oração",
  };
  return types[type] || "🙏 Momento de Oração";
};

const getReminderMessage = (type: string): string => {
  const messages: Record<string, string> = {
    manha: "Bom dia! É hora de começar o dia com Deus em oração.",
    tarde: "Pause um momento e converse com Deus nesta tarde.",
    noite: "Encerre o dia em paz. Agradeça e entregue suas preocupações a Deus.",
    personalizado: "Este é seu momento reservado para oração. Deus está esperando você!",
  };
  return messages[type] || "É hora de orar! Reserve este momento para Deus.";
};

interface DbPushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Cache for ApplicationServer instance
let appServer: ApplicationServer | null = null;

/**
 * Convert base64url string to standard base64
 */
function base64UrlToBase64(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
}

/**
 * Convert Uint8Array to base64url string
 */
function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  const base64 = base64Encode(bytes);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert base64url-encoded VAPID keys to JWK format
 */
function vapidKeysToJwk(publicKeyB64Url: string, privateKeyB64Url: string): { publicKey: JsonWebKey; privateKey: JsonWebKey } {
  const publicKeyBytes = base64Decode(base64UrlToBase64(publicKeyB64Url));
  
  if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04) {
    throw new Error(`Invalid public key format: expected 65 bytes starting with 0x04, got ${publicKeyBytes.length} bytes`);
  }

  const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));

  const privateKeyBytes = base64Decode(base64UrlToBase64(privateKeyB64Url));
  const d = uint8ArrayToBase64Url(privateKeyBytes);

  const publicKey: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    ext: true,
  };

  const privateKey: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x,
    y,
    d,
    ext: true,
  };

  return { publicKey, privateKey };
}

async function getApplicationServer(): Promise<ApplicationServer | null> {
  if (appServer) return appServer;

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("[send-prayer-reminders] VAPID keys not configured");
    return null;
  }

  try {
    let vapidKeys;
    
    if (vapidPublicKey.startsWith('{')) {
      vapidKeys = await importVapidKeys({
        publicKey: JSON.parse(vapidPublicKey),
        privateKey: JSON.parse(vapidPrivateKey),
      });
    } else {
      console.log("[send-prayer-reminders] Converting VAPID keys from base64url to JWK");
      const jwkKeys = vapidKeysToJwk(vapidPublicKey, vapidPrivateKey);
      vapidKeys = await importVapidKeys({
        publicKey: jwkKeys.publicKey,
        privateKey: jwkKeys.privateKey,
      });
    }

    appServer = await ApplicationServer.new({
      contactInformation: "mailto:suporte@vidaemcristo.app",
      vapidKeys,
    });

    console.log("[send-prayer-reminders] ApplicationServer initialized");
    return appServer;
  } catch (error) {
    console.error("[send-prayer-reminders] Failed to initialize ApplicationServer:", error);
    return null;
  }
}

// deno-lint-ignore no-explicit-any
async function sendWebPushToUser(
  server: ApplicationServer,
  supabase: any,
  userId: string,
  title: string,
  body: string,
  url: string
): Promise<boolean> {
  try {
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (!subscriptions || subscriptions.length === 0) {
      return false;
    }

    const pushPayload = JSON.stringify({
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      tag: `prayer-reminder-${Date.now()}`,
      url,
      action_url: url,
    });

    for (const sub of subscriptions as DbPushSubscription[]) {
      try {
        const pushSubscription: PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const subscriber = await server.subscribe(pushSubscription);
        await subscriber.pushTextMessage(pushPayload, {
          urgency: Urgency.High,
          ttl: 3600,
        });

        console.log(`[send-prayer-reminders] Push sent to user ${userId}`);
      } catch (error) {
        if (error instanceof PushMessageError && error.isGone()) {
          console.log(`[send-prayer-reminders] Removing expired subscription for user ${userId}`);
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error(`[send-prayer-reminders] Push failed for user ${userId}:`, error);
        }
      }
    }

    return true;
  } catch (error) {
    console.error(`[send-prayer-reminders] Error sending push to user ${userId}:`, error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate: only allow calls with service role key
    const authHeader = req.headers.get("Authorization");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (authHeader !== `Bearer ${supabaseServiceKey}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current time in HH:MM format (Brazil timezone - UTC-3)
    const now = new Date();
    const brazilOffset = -3 * 60; // UTC-3 in minutes
    const localOffset = now.getTimezoneOffset();
    const brazilTime = new Date(now.getTime() + (localOffset + brazilOffset) * 60000);
    
    const currentHour = brazilTime.getHours().toString().padStart(2, "0");
    const currentMinute = brazilTime.getMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}:00`;
    const today = brazilTime.toISOString().split("T")[0];

    console.log(`[send-prayer-reminders] Checking reminders for ${currentTime} (Brazil time)`);

    // Find all active reminders that match current time
    const { data: reminders, error: remindersError } = await supabase
      .from("prayer_reminders")
      .select("id, user_id, reminder_type, reminder_time")
      .eq("is_active", true)
      .eq("reminder_time", currentTime);

    if (remindersError) {
      console.error("[send-prayer-reminders] Error fetching reminders:", remindersError);
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      console.log("[send-prayer-reminders] No reminders to send at this time");
      return new Response(
        JSON.stringify({ success: true, sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-prayer-reminders] Found ${reminders.length} reminders to process`);

    // Check which users already received notification today (to avoid duplicates)
    const userIds = reminders.map((r) => r.user_id);
    
    const { data: existingNotifications } = await supabase
      .from("notifications")
      .select("user_id, created_at")
      .in("user_id", userIds)
      .eq("type", "prayer_reminder")
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    const alreadyNotifiedToday = new Set(
      existingNotifications?.map((n) => `${n.user_id}-${currentTime}`) || []
    );

    // Create notifications for each reminder
    const notifications = reminders
      .filter((reminder) => !alreadyNotifiedToday.has(`${reminder.user_id}-${reminder.reminder_time}`))
      .map((reminder) => ({
        user_id: reminder.user_id,
        title: getReminderTypeLabel(reminder.reminder_type),
        message: getReminderMessage(reminder.reminder_type),
        type: "prayer_reminder",
        action_url: "/lembretes-oracao",
      }));

    if (notifications.length === 0) {
      console.log("[send-prayer-reminders] All reminders already sent today");
      return new Response(
        JSON.stringify({ success: true, sent: 0, skipped: reminders.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("[send-prayer-reminders] Error inserting notifications:", insertError);
      throw insertError;
    }

    console.log(`[send-prayer-reminders] Successfully sent ${notifications.length} in-app notifications`);

    // Send Web Push notifications
    const server = await getApplicationServer();
    let pushSent = 0;

    if (server) {
      for (const notif of notifications) {
        const sent = await sendWebPushToUser(
          server,
          supabase,
          notif.user_id,
          notif.title,
          notif.message,
          notif.action_url
        );
        if (sent) pushSent++;
      }
      console.log(`[send-prayer-reminders] Sent ${pushSent} web push notifications`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: notifications.length,
        pushSent,
        time: currentTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-prayer-reminders] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
