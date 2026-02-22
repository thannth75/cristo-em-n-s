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
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PushPayload {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  url?: string;
  tag?: string;
  type?: string;
}

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
 * Public key is 65 bytes: 0x04 + 32 bytes x + 32 bytes y
 * Private key is 32 bytes: d value
 */
function vapidKeysToJwk(publicKeyB64Url: string, privateKeyB64Url: string): { publicKey: JsonWebKey; privateKey: JsonWebKey } {
  // Decode public key (65 bytes for uncompressed P-256 point)
  const publicKeyBytes = base64Decode(base64UrlToBase64(publicKeyB64Url));
  
  if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04) {
    throw new Error(`Invalid public key format: expected 65 bytes starting with 0x04, got ${publicKeyBytes.length} bytes`);
  }

  // Extract x and y coordinates (32 bytes each, after the 0x04 prefix)
  const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));

  // Decode private key (32 bytes)
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
    console.error("[send-push-notification] VAPID keys not configured");
    return null;
  }

  try {
    let vapidKeys;
    
    if (vapidPublicKey.startsWith('{')) {
      // Already JWK format
      vapidKeys = await importVapidKeys({
        publicKey: JSON.parse(vapidPublicKey),
        privateKey: JSON.parse(vapidPrivateKey),
      });
    } else {
      // Base64url format - convert to JWK
      console.log("[send-push-notification] Converting VAPID keys from base64url to JWK");
      const jwkKeys = vapidKeysToJwk(vapidPublicKey, vapidPrivateKey);
      vapidKeys = await importVapidKeys({
        publicKey: jwkKeys.publicKey,
        privateKey: jwkKeys.privateKey,
      });
    }

    // Create ApplicationServer with contact info for VAPID
    appServer = await ApplicationServer.new({
      contactInformation: "mailto:suporte@vidaemcristo.app",
      vapidKeys,
    });

    console.log("[send-push-notification] ApplicationServer initialized successfully");
    return appServer;
  } catch (error) {
    console.error("[send-push-notification] Failed to initialize ApplicationServer:", error);
    return null;
  }
}

async function sendWebPushNotification(
  server: ApplicationServer,
  subscription: DbPushSubscription,
  payload: string
): Promise<{ success: boolean; error?: string; isGone?: boolean }> {
  try {
    // Convert DB subscription to PushSubscription format
    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    // Create subscriber and send notification
    const subscriber = await server.subscribe(pushSubscription);
    await subscriber.pushTextMessage(payload, {
      urgency: Urgency.High,
      ttl: 86400, // 24 hours
    });

    console.log(`[send-push-notification] Push sent to user ${subscription.user_id}`);
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[send-push-notification] Push failed for user ${subscription.user_id}:`, errorMsg);

    // Check if subscription is gone (expired/unsubscribed)
    if (error instanceof PushMessageError && error.isGone()) {
      return { success: false, error: errorMsg, isGone: true };
    }

    return { success: false, error: errorMsg };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[send-push-notification] Request received");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate the caller - accept service role key OR valid user token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("[send-push-notification] No auth header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === supabaseServiceKey;

    if (!isServiceRole) {
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: userData, error: userError } = await userClient.auth.getUser();
      if (userError || !userData?.user) {
        console.log("[send-push-notification] Auth failed:", userError?.message);
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("[send-push-notification] Authenticated user:", userData.user.id);
    } else {
      console.log("[send-push-notification] Service role auth");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get payload from request
    const requestPayload: PushPayload = await req.json();
    console.log("[send-push-notification] Payload:", JSON.stringify(requestPayload));

    // Determine target user IDs
    let targetUserIds: string[] = [];
    if (requestPayload.user_id) {
      targetUserIds = [requestPayload.user_id];
    } else if (requestPayload.user_ids && requestPayload.user_ids.length > 0) {
      targetUserIds = requestPayload.user_ids;
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No target users specified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert notifications into the notifications table (for in-app display & realtime)
    const notifications = targetUserIds.map((userId) => ({
      user_id: userId,
      title: requestPayload.title,
      message: requestPayload.body,
      type: requestPayload.type || "push",
      action_url: requestPayload.url || "/",
    }));

    const { error: insertError, data } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (insertError) {
      console.error("[send-push-notification] Error inserting notifications:", insertError);
      throw insertError;
    }

    console.log(`[send-push-notification] Created ${notifications.length} in-app notifications`);

    // Send Web Push notifications
    const pushResults = { sent: 0, failed: 0, errors: [] as string[] };
    
    const server = await getApplicationServer();
    
    if (server) {
      console.log("[send-push-notification] Attempting web push with RFC 8291 encryption");
      
      // Get push subscriptions for target users
      const { data: subscriptions, error: subError } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", targetUserIds);

      if (subError) {
        console.error("[send-push-notification] Error fetching subscriptions:", subError);
      } else if (subscriptions && subscriptions.length > 0) {
        console.log(`[send-push-notification] Found ${subscriptions.length} push subscriptions`);
        
        // Prepare push notification payload
        const pushPayload = JSON.stringify({
          title: requestPayload.title,
          body: requestPayload.body,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-96x96.png",
          tag: requestPayload.tag || `notification-${Date.now()}`,
          url: requestPayload.url || "/",
          action_url: requestPayload.url || "/",
        });

        // Send to each subscription
        const pushPromises = subscriptions.map(async (sub: DbPushSubscription) => {
          const result = await sendWebPushNotification(server, sub, pushPayload);
          
          if (result.success) {
            pushResults.sent++;
          } else {
            pushResults.failed++;
            pushResults.errors.push(`User ${sub.user_id}: ${result.error}`);
            
            // Remove invalid subscription
            if (result.isGone) {
              console.log(`[send-push-notification] Removing expired subscription for user ${sub.user_id}`);
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
            }
          }
        });

        await Promise.all(pushPromises);
      } else {
        console.log("[send-push-notification] No push subscriptions found for target users");
      }
    } else {
      console.log("[send-push-notification] VAPID keys not configured or invalid, skipping web push");
    }

    return new Response(
      JSON.stringify({
        success: true,
        inAppNotifications: data?.length || 0,
        pushNotifications: pushResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[send-push-notification] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
