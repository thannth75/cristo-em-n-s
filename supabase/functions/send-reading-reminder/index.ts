import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const READING_MESSAGES = [
  { title: "📖 Hora da Leitura Bíblica", message: "Reserve um momento para ler a Palavra de Deus hoje. Sua jornada espiritual depende disso!" },
  { title: "📚 Estudo da Palavra", message: "Abra sua Bíblia e mergulhe no conhecimento de Deus. Cada versículo transforma!" },
  { title: "📖 Leia a Palavra Hoje", message: "\"A tua palavra é lâmpada para os meus pés\" — Salmos 119:105. Dedique um tempo à leitura!" },
  { title: "📚 Momento de Estudo", message: "Crescer na fé exige dedicação à Palavra. Que tal estudar um capítulo agora?" },
  { title: "📖 Alimente sua Alma", message: "Assim como o corpo precisa de alimento, sua alma precisa da Palavra. Leia hoje!" },
  { title: "📚 Seu Plano de Leitura", message: "Não deixe para depois! Continue seu plano de leitura bíblica e cresça na fé." },
  { title: "📖 Hora de Ler", message: "\"Examinem as Escrituras\" — João 5:39. Deus tem algo especial para te mostrar hoje!" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Pick a random message
    const msg = READING_MESSAGES[Math.floor(Math.random() * READING_MESSAGES.length)];

    // Get all approved users
    const { data: users } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("is_approved", true);

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if reading reminder already sent today
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("type", "reading_reminder")
      .gte("created_at", `${today}T00:00:00`)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("[send-reading-reminder] Already sent today, skipping");
      return new Response(JSON.stringify({ success: true, sent: 0, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notifications = users.map((u: any) => ({
      user_id: u.user_id,
      title: msg.title,
      message: msg.message,
      type: "reading_reminder",
      action_url: "/plano-leitura",
    }));

    const { error } = await supabase.from("notifications").insert(notifications);
    if (error) throw error;

    console.log(`[send-reading-reminder] Sent to ${users.length} users`);

    return new Response(JSON.stringify({ success: true, sent: users.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[send-reading-reminder] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
