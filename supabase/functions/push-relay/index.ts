import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  ApplicationServer,
  importVapidKeys,
  PushMessageError,
  Urgency,
  type PushSubscription,
} from "jsr:@negrel/webpush@0.5.0";
import { decode as base64Decode, encode as base64Encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

/**
 * Internal-only edge function called by DB triggers via pg_net.
 * Sends web push notifications without inserting into notifications table.
 * This prevents double-insertion when used alongside DB triggers.
 */

interface RelayPayload {
  user_id: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

interface DbPushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

let appServer: ApplicationServer | null = null;

function base64UrlToBase64(base64Url: string): string {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return base64;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  const base64 = base64Encode(bytes);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function vapidKeysToJwk(publicKeyB64Url: string, privateKeyB64Url: string) {
  const publicKeyBytes = base64Decode(base64UrlToBase64(publicKeyB64Url));
  if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04) {
    throw new Error(`Invalid public key format`);
  }
  const x = uint8ArrayToBase64Url(publicKeyBytes.slice(1, 33));
  const y = uint8ArrayToBase64Url(publicKeyBytes.slice(33, 65));
  const privateKeyBytes = base64Decode(base64UrlToBase64(privateKeyB64Url));
  const d = uint8ArrayToBase64Url(privateKeyBytes);

  return {
    publicKey: { kty: "EC", crv: "P-256", x, y, ext: true } as JsonWebKey,
    privateKey: { kty: "EC", crv: "P-256", x, y, d, ext: true } as JsonWebKey,
  };
}

async function getAppServer(): Promise<ApplicationServer | null> {
  if (appServer) return appServer;
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!vapidPublicKey || !vapidPrivateKey) return null;

  try {
    let vapidKeys;
    if (vapidPublicKey.startsWith('{')) {
      vapidKeys = await importVapidKeys({
        publicKey: JSON.parse(vapidPublicKey),
        privateKey: JSON.parse(vapidPrivateKey),
      });
    } else {
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
    return appServer;
  } catch (error) {
    console.error("[push-relay] Failed to init VAPID:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  try {
    const payload: RelayPayload = await req.json();
    if (!payload.user_id || !payload.title) {
      return new Response(JSON.stringify({ error: "Missing user_id or title" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const server = await getAppServer();
    if (!server) {
      console.log("[push-relay] VAPID not configured, skipping");
      return new Response(JSON.stringify({ success: false, reason: "no_vapid" }));
    }

    // Fetch subscriptions
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", payload.user_id);

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }));
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      tag: payload.tag || `notif-${Date.now()}`,
      url: payload.url || "/",
      action_url: payload.url || "/",
    });

    let sent = 0;
    for (const sub of subs as DbPushSubscription[]) {
      try {
        const pushSub: PushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        };
        const subscriber = await server.subscribe(pushSub);
        await subscriber.pushTextMessage(pushPayload, { urgency: Urgency.High, ttl: 86400 });
        sent++;
      } catch (error) {
        console.error(`[push-relay] Failed for ${sub.user_id}:`, error);
        if (error instanceof PushMessageError && error.isGone()) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    // Mark notification as push delivered
    await supabase
      .from("notifications")
      .update({ push_delivered: true })
      .eq("user_id", payload.user_id)
      .eq("title", payload.title)
      .eq("push_delivered", false)
      .order("created_at", { ascending: false })
      .limit(1);

    return new Response(JSON.stringify({ success: true, sent }));
  } catch (error) {
    console.error("[push-relay] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
