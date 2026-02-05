import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Versículos-chave para inspiração dos devocionais
const SEED_VERSES = [
  { ref: "Salmos 23:1", text: "O Senhor é o meu pastor; nada me faltará." },
  { ref: "Filipenses 4:13", text: "Tudo posso naquele que me fortalece." },
  { ref: "Isaías 40:31", text: "Mas os que esperam no Senhor renovarão as suas forças." },
  { ref: "Provérbios 3:5-6", text: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento." },
  { ref: "Romanos 8:28", text: "E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus." },
  { ref: "Josué 1:9", text: "Não temas, nem te espantes, porque o Senhor teu Deus está contigo por onde quer que andares." },
  { ref: "João 14:27", text: "Deixo-vos a paz, a minha paz vos dou; não vo-la dou como o mundo a dá." },
  { ref: "Jeremias 29:11", text: "Porque eu bem sei os pensamentos que penso a vosso respeito, diz o Senhor; pensamentos de paz e não de mal." },
  { ref: "Mateus 11:28", text: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei." },
  { ref: "Salmos 46:10", text: "Aquietai-vos e sabei que eu sou Deus." },
  { ref: "2 Coríntios 5:17", text: "Assim que, se alguém está em Cristo, nova criatura é: as coisas velhas já passaram; eis que tudo se fez novo." },
  { ref: "Gálatas 5:22-23", text: "Mas o fruto do Espírito é: amor, gozo, paz, longanimidade, benignidade, bondade, fé, mansidão, temperança." },
  { ref: "Efésios 6:10", text: "No demais, irmãos meus, fortalecei-vos no Senhor e na força do seu poder." },
  { ref: "1 Pedro 5:7", text: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós." },
  { ref: "Salmos 91:1", text: "Aquele que habita no esconderijo do Altíssimo, à sombra do Onipotente descansará." },
];

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if today's devotional already exists
    const today = new Date().toISOString().split("T")[0];
    
    const { data: existingDevotional } = await supabase
      .from("daily_devotionals")
      .select("id")
      .eq("devotional_date", today)
      .maybeSingle();

    if (existingDevotional) {
      return new Response(
        JSON.stringify({ message: "Devocional de hoje já existe", id: existingDevotional.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Select a random seed verse
    const seedVerse = SEED_VERSES[Math.floor(Math.random() * SEED_VERSES.length)];
    
     // Get day of week for context
     const dayOfWeek = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][new Date().getDay()];
 
    // Get admin user to set as creator
    const { data: adminUser } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    const createdBy = adminUser?.user_id || "00000000-0000-0000-0000-000000000000";

    let devotionalContent: {
      title: string;
      content: string;
      reflection_questions: string[];
      prayer_focus: string;
    };

    // Try to use Lovable AI if available
    if (lovableApiKey) {
      try {
         const prompt = `Você é um pastor cristão experiente escrevendo um devocional diário para jovens cristãos.
 
 CONTEXTO: Hoje é ${dayOfWeek}, ${today}. 
 
 Baseado no versículo "${seedVerse.text}" (${seedVerse.ref}), crie um devocional inspirador e ORIGINAL com:

 1. Um título criativo e cativante (máximo 60 caracteres) - NÃO use "Meditando em..."
 2. Uma reflexão espiritual de 3-4 parágrafos (aproximadamente 250 palavras) que:
    - Conecte o versículo com a vida cotidiana dos jovens de hoje
    - Traga exemplos práticos e aplicáveis
    - Ofereça encorajamento genuíno e profundo
    - Mantenha linguagem acessível mas teologicamente sólida
    - Inclua pelo menos uma história ou ilustração
3. 3 perguntas de reflexão pessoal
4. Um foco de oração para o dia

 IMPORTANTE: Seja criativo e original. Evite clichês religiosos.
 
Responda APENAS em JSON válido no formato:
{
   "title": "Título criativo do devocional",
   "content": "Texto completo da reflexão com parágrafos separados por \\n\\n",
  "reflection_questions": ["Pergunta 1?", "Pergunta 2?", "Pergunta 3?"],
   "prayer_focus": "Foco de oração específico..."
}`;

         const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Você é um pastor cristão que escreve devocionais edificantes para jovens." },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const content = aiResponse.choices?.[0]?.message?.content || "";
          
          // Parse JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            devotionalContent = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Could not parse AI response");
          }
        } else {
          throw new Error(`AI API error: ${response.status}`);
        }
      } catch (aiError) {
        console.error("AI generation failed, using fallback:", aiError);
        // Fallback to template-based content
        devotionalContent = generateFallbackDevotional(seedVerse);
      }
    } else {
      // Use fallback without AI
      devotionalContent = generateFallbackDevotional(seedVerse);
    }

    // Insert the devotional
    const { data: newDevotional, error: insertError } = await supabase
      .from("daily_devotionals")
      .insert({
        devotional_date: today,
        title: devotionalContent.title,
        content: devotionalContent.content,
        bible_reference: seedVerse.ref,
        bible_verse: seedVerse.text,
        reflection_questions: devotionalContent.reflection_questions,
        prayer_focus: devotionalContent.prayer_focus,
        created_by: createdBy,
        is_auto_generated: true,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Log the generation
    await supabase.from("auto_devotional_log").insert({
      devotional_id: newDevotional.id,
      model_used: lovableApiKey ? "google/gemini-2.5-flash" : "fallback-template",
      prompt_used: `Seed verse: ${seedVerse.ref}`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Devocional gerado com sucesso!",
        devotional: newDevotional 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating devotional:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFallbackDevotional(seedVerse: { ref: string; text: string }) {
  const templates = [
    {
      title: `Meditando em ${seedVerse.ref.split(" ")[0]}`,
      content: `Hoje refletimos sobre as preciosas palavras de ${seedVerse.ref}: "${seedVerse.text}"

Este versículo nos lembra que Deus está presente em cada momento de nossa jornada. Em meio às pressões do dia a dia, às cobranças e às incertezas que enfrentamos, podemos encontrar paz e direção na Palavra de Deus.

Os jovens de hoje enfrentam desafios únicos: a pressão das redes sociais, as expectativas acadêmicas e profissionais, e a busca por propósito. Mas a mensagem deste versículo permanece atual e poderosa.

Que hoje você possa experimentar a presença de Deus de forma real e transformadora. Que Sua Palavra seja lâmpada para os seus pés e luz para o seu caminho.`,
      reflection_questions: [
        "Como este versículo se aplica à sua situação atual?",
        "De que forma você pode praticar esta verdade hoje?",
        "Há algo que precisa entregar a Deus neste momento?"
      ],
      prayer_focus: "Peça a Deus sabedoria para aplicar Sua Palavra no seu cotidiano e força para viver de acordo com Seus princípios."
    },
  ];

  return templates[0];
}
