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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get payload from request
    const payload: PushPayload = await req.json();
    console.log("[send-push-notification] Payload:", payload);

    // Determine target user IDs
    let targetUserIds: string[] = [];
    if (payload.user_id) {
      targetUserIds = [payload.user_id];
    } else if (payload.user_ids && payload.user_ids.length > 0) {
      targetUserIds = payload.user_ids;
    }

    if (targetUserIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No target users specified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert notifications into the notifications table
    // The frontend will receive these via Supabase Realtime
    const notifications = targetUserIds.map((userId) => ({
      user_id: userId,
      title: payload.title,
      message: payload.body,
      type: payload.type || "push",
      action_url: payload.url || "/",
    }));

    const { error: insertError, data } = await supabase
      .from("notifications")
      .insert(notifications)
      .select();

    if (insertError) {
      console.error("[send-push-notification] Error inserting notifications:", insertError);
      throw insertError;
    }

    console.log(`[send-push-notification] Created ${notifications.length} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        created: notifications.length,
        notifications: data,
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
