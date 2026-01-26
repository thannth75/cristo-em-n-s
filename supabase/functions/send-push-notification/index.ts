import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Convert base64 URL-safe to standard base64
function base64UrlToBase64(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
}

// Decode base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Create JWT for VAPID authentication
async function createVapidJWT(
  endpoint: string,
  vapidPrivateKey: string,
  vapidPublicKey: string
): Promise<string> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;
  
  // JWT header
  const header = {
    typ: "JWT",
    alg: "ES256",
  };
  
  // JWT payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: "mailto:suporte@vidaemcristo.app",
  };
  
  // Encode header and payload
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  // Import VAPID private key
  const privateKeyBytes = base64ToUint8Array(base64UrlToBase64(vapidPrivateKey));
  
  // Create proper PKCS8 format for EC private key
  const pkcs8Header = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48,
    0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  
  const pkcs8Key = new Uint8Array(pkcs8Header.length + privateKeyBytes.length);
  pkcs8Key.set(pkcs8Header);
  pkcs8Key.set(privateKeyBytes, pkcs8Header.length);
  
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8Key,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  
  // Sign
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    encoder.encode(unsignedToken)
  );
  
  // Convert DER signature to raw format for JWT
  const signatureArray = new Uint8Array(signature);
  let signatureB64: string;
  
  if (signatureArray.length === 64) {
    signatureB64 = btoa(String.fromCharCode(...signatureArray))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  } else {
    // DER encoded signature - need to extract r and s values
    const r = signatureArray.slice(4, 4 + signatureArray[3]);
    const sOffset = 4 + signatureArray[3] + 2;
    const s = signatureArray.slice(sOffset, sOffset + signatureArray[sOffset - 1]);
    
    const rawSignature = new Uint8Array(64);
    rawSignature.set(r.length > 32 ? r.slice(-32) : r, 32 - Math.min(r.length, 32));
    rawSignature.set(s.length > 32 ? s.slice(-32) : s, 64 - Math.min(s.length, 32));
    
    signatureB64 = btoa(String.fromCharCode(...rawSignature))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
  
  return `${unsignedToken}.${signatureB64}`;
}

// Send Web Push notification using Web Crypto API
async function sendWebPush(
  subscription: PushSubscription,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<void> {
  const jwt = await createVapidJWT(subscription.endpoint, vapidPrivateKey, vapidPublicKey);
  
  // Create authorization header
  const publicKeyBytes = base64ToUint8Array(base64UrlToBase64(vapidPublicKey));
  const publicKeyB64 = btoa(String.fromCharCode(...publicKeyBytes))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const headers: HeadersInit = {
    "Authorization": `vapid t=${jwt}, k=${publicKeyB64}`,
    "Content-Type": "application/octet-stream",
    "TTL": "86400",
    "Urgency": "normal",
  };

  // For now, send unencrypted payload - browser will handle
  // Full encryption requires complex ECDH + AES-GCM implementation
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers,
    body: payload,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Push failed: ${response.status} - ${errorText}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

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

    // Send Web Push notifications if VAPID keys are configured
    let pushResults = { sent: 0, failed: 0, errors: [] as string[] };
    
    if (vapidPublicKey && vapidPrivateKey) {
      console.log("[send-push-notification] VAPID keys configured, attempting web push");
      
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
        for (const sub of subscriptions as PushSubscription[]) {
          try {
            await sendWebPush(sub, pushPayload, vapidPublicKey, vapidPrivateKey);
            pushResults.sent++;
            console.log(`[send-push-notification] Sent push to user ${sub.user_id}`);
          } catch (pushError: unknown) {
            pushResults.failed++;
            const errorMsg = pushError instanceof Error ? pushError.message : String(pushError);
            pushResults.errors.push(`User ${sub.user_id}: ${errorMsg}`);
            console.error(`[send-push-notification] Push failed for user ${sub.user_id}:`, errorMsg);
            
            // If subscription is invalid (410 Gone or 404), remove it
            if (errorMsg.includes("410") || errorMsg.includes("404")) {
              console.log(`[send-push-notification] Removing invalid subscription for user ${sub.user_id}`);
              await supabase
                .from("push_subscriptions")
                .delete()
                .eq("id", sub.id);
            }
          }
        }
      } else {
        console.log("[send-push-notification] No push subscriptions found for target users");
      }
    } else {
      console.log("[send-push-notification] VAPID keys not configured, skipping web push");
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
