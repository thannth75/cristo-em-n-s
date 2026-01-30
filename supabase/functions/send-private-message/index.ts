import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  receiver_id: string;
  content: string;
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clamp(str: string, max: number) {
  const s = (str ?? "").trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1) Authenticate caller (end-user)
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) return json(401, { error: "Unauthorized" });

    const senderId = authData.user.id;

    // 2) Validate payload
    const body: Body = await req.json();
    const receiverId = (body.receiver_id ?? "").trim();
    const content = clamp(body.content ?? "", 1000);

    if (!receiverId) return json(400, { error: "receiver_id is required" });
    if (!isValidUUID(receiverId)) return json(400, { error: "Invalid receiver_id format" });
    if (!content) return json(400, { error: "content is required" });
    if (receiverId === senderId) return json(400, { error: "Cannot message yourself" });

    // 3) Service client for DB operations
    const service = createClient(supabaseUrl, serviceKey);

    // 4) Rate limiting - max 20 messages per minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count: recentCount } = await service
      .from("private_messages")
      .select("*", { count: "exact", head: true })
      .eq("sender_id", senderId)
      .gte("created_at", oneMinuteAgo);

    if (recentCount && recentCount > 20) {
      return json(429, { error: "Limite de mensagens: máximo 20 por minuto" });
    }

    // 5) Validate receiver exists and is approved
    const { data: receiverProfile } = await service
      .from("profiles")
      .select("is_approved")
      .eq("user_id", receiverId)
      .single();

    if (!receiverProfile) {
      return json(400, { error: "Destinatário não encontrado" });
    }

    if (!receiverProfile.is_approved) {
      return json(400, { error: "Destinatário não está aprovado" });
    }

    // 6) Insert message
    const { data: inserted, error: insertError } = await service
      .from("private_messages")
      .insert({ sender_id: senderId, receiver_id: receiverId, content })
      .select()
      .single();

    if (insertError) {
      console.error("[send-private-message] insert error", insertError);
      return json(500, { error: "Failed to send message" });
    }

    // 7) Send push to receiver
    const { data: senderProfile } = await service
      .from("profiles")
      .select("full_name")
      .eq("user_id", senderId)
      .maybeSingle();

    const senderName = (senderProfile?.full_name ?? "Alguém").split(" ")[0];

    const pushPayload = {
      user_id: receiverId,
      title: "💬 Nova mensagem",
      body: `${senderName}: ${clamp(content, 120)}`,
      url: "/mensagens",
      tag: `dm-${senderId}`,
      type: "message",
    };

    await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      body: JSON.stringify(pushPayload),
    }).catch((e) => console.error("[send-private-message] push fetch error", e));

    return json(200, { message: inserted });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[send-private-message] error", msg);
    return json(500, { error: msg });
  }
});
