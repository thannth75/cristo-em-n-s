import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AchievementCheck {
  id: string;
  name: string;
  category: string;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  attendanceCount: number;
  studyProgressCount: number;
  journalCount: number;
  prayerCount: number;
  answeredPrayerCount: number;
  isMusician: boolean;
  scaleParticipations: number;
}

const ACHIEVEMENT_CHECKS: AchievementCheck[] = [
  // Geral
  { id: "primeiro-passo", name: "Primeiro Passo", category: "geral", check: () => true }, // First login
  
  // Presença
  { id: "fiel-presenca", name: "Fiel na Presença", category: "presenca", check: (s) => s.attendanceCount >= 5 },
  { id: "assiduo", name: "Assíduo", category: "presenca", check: (s) => s.attendanceCount >= 10 },
  { id: "veterano", name: "Veterano", category: "presenca", check: (s) => s.attendanceCount >= 25 },
  
  // Estudo
  { id: "estudante", name: "Estudante da Palavra", category: "estudo", check: (s) => s.studyProgressCount >= 1 },
  { id: "dedicado", name: "Dedicado", category: "estudo", check: (s) => s.studyProgressCount >= 3 },
  { id: "mestre", name: "Mestre na Palavra", category: "estudo", check: (s) => s.studyProgressCount >= 10 },
  
  // Músico
  { id: "musico", name: "Músico", category: "musico", check: (s) => s.isMusician },
  { id: "escalado", name: "Escalado", category: "musico", check: (s) => s.scaleParticipations >= 1 },
  { id: "ministerio", name: "Ministério de Louvor", category: "musico", check: (s) => s.scaleParticipations >= 10 },
  
  // Oração
  { id: "guerreiro-oracao", name: "Guerreiro de Oração", category: "geral", check: (s) => s.prayerCount >= 3 },
  { id: "oracao-respondida", name: "Oração Respondida", category: "geral", check: (s) => s.answeredPrayerCount >= 1 },
  
  // Diário
  { id: "reflexivo", name: "Reflexivo", category: "geral", check: (s) => s.journalCount >= 5 },
  { id: "escritor", name: "Escritor Espiritual", category: "geral", check: (s) => s.journalCount >= 20 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Fetch user stats in parallel
    const [
      attendanceRes,
      studyProgressRes,
      journalRes,
      prayerRes,
      musicianRes,
      scaleRes,
      existingAchievementsRes,
      allAchievementsRes,
    ] = await Promise.all([
      supabase.from("attendance").select("id", { count: "exact" }).eq("user_id", userId),
      supabase.from("study_progress").select("id", { count: "exact" }).eq("user_id", userId),
      supabase.from("journal_entries").select("id", { count: "exact" }).eq("user_id", userId),
      supabase.from("prayer_requests").select("id, is_answered").eq("user_id", userId),
      supabase.from("musicians").select("id").eq("user_id", userId).maybeSingle(),
      supabase.from("scale_musicians").select("id, musician_id, musicians!inner(user_id)").eq("musicians.user_id", userId),
      supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
      supabase.from("achievements").select("id, name, category"),
    ]);

    const prayers = prayerRes.data || [];
    const stats: UserStats = {
      attendanceCount: attendanceRes.count || 0,
      studyProgressCount: studyProgressRes.count || 0,
      journalCount: journalRes.count || 0,
      prayerCount: prayers.length,
      answeredPrayerCount: prayers.filter((p) => p.is_answered).length,
      isMusician: !!musicianRes.data,
      scaleParticipations: scaleRes.data?.length || 0,
    };

    const existingIds = new Set((existingAchievementsRes.data || []).map((a) => a.achievement_id));
    const allAchievements = allAchievementsRes.data || [];

    // Check which achievements user qualifies for
    const newAchievements: string[] = [];

    for (const check of ACHIEVEMENT_CHECKS) {
      // Find matching achievement in DB by name/category
      const dbAchievement = allAchievements.find(
        (a) => a.name === check.name || a.category === check.category
      );
      
      if (!dbAchievement) continue;
      if (existingIds.has(dbAchievement.id)) continue;
      
      if (check.check(stats)) {
        newAchievements.push(dbAchievement.id);
      }
    }

    // Grant first login achievement to everyone who doesn't have it
    const primeiroPassoAchievement = allAchievements.find((a) => a.name === "Primeiro Passo");
    if (primeiroPassoAchievement && !existingIds.has(primeiroPassoAchievement.id)) {
      if (!newAchievements.includes(primeiroPassoAchievement.id)) {
        newAchievements.push(primeiroPassoAchievement.id);
      }
    }

    // Insert new achievements
    if (newAchievements.length > 0) {
      const insertData = newAchievements.map((achievementId) => ({
        user_id: userId,
        achievement_id: achievementId,
      }));

      const { error: insertError } = await supabase
        .from("user_achievements")
        .insert(insertData);

      if (insertError) {
        console.error("Error granting achievements:", insertError);
      }
    }

    return new Response(
      JSON.stringify({
        granted: newAchievements.length,
        stats,
        newAchievementIds: newAchievements,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
