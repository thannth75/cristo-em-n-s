import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    console.log(`[send-prayer-reminders] Successfully sent ${notifications.length} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: notifications.length,
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
