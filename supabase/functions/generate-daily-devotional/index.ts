import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SEED_VERSES = [
  { ref: "Salmos 23:1-6", text: "O Senhor é o meu pastor; nada me faltará." },
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
  { ref: "Romanos 12:2", text: "E não vos conformeis com este mundo, mas transformai-vos pela renovação do vosso entendimento." },
  { ref: "Hebreus 11:1", text: "Ora, a fé é o firme fundamento das coisas que se esperam e a prova das coisas que se não veem." },
  { ref: "Tiago 1:2-4", text: "Meus irmãos, tende grande gozo quando cairdes em várias tentações, sabendo que a prova da vossa fé produz a paciência." },
  { ref: "João 3:16", text: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna." },
  { ref: "Salmos 119:105", text: "Lâmpada para os meus pés é tua palavra e luz para o meu caminho." },
  { ref: "Mateus 6:33", text: "Mas buscai primeiro o Reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas." },
  { ref: "Isaías 41:10", text: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus." },
  { ref: "Salmos 37:5", text: "Entrega o teu caminho ao Senhor; confia nele e ele tudo fará." },
  { ref: "Colossenses 3:23", text: "Tudo quanto fizerdes, fazei-o de todo o coração, como para o Senhor e não para homens." },
  { ref: "2 Timóteo 1:7", text: "Porque Deus não nos deu o espírito de temor, mas de fortaleza, de amor e de moderação." },
  { ref: "Salmos 27:1", text: "O Senhor é a minha luz e a minha salvação; a quem temerei?" },
  { ref: "Provérbios 16:3", text: "Confia ao Senhor as tuas obras e teus pensamentos serão estabelecidos." },
  { ref: "1 Coríntios 10:13", text: "Não veio sobre vós tentação, senão humana; mas fiel é Deus, que vos não deixará tentar acima do que podeis." },
  { ref: "João 15:5", text: "Eu sou a videira, vós as varas; quem está em mim, e eu nele, este dá muito fruto." },
  { ref: "Romanos 8:37", text: "Mas em todas estas coisas somos mais do que vencedores, por aquele que nos amou." },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${supabaseServiceKey}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Get recently used verses (last 30 days) to avoid repetition
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const { data: recentDevotionals } = await supabase
      .from("daily_devotionals")
      .select("bible_reference")
      .gte("devotional_date", thirtyDaysAgo);

    const recentRefs = new Set((recentDevotionals || []).map(d => d.bible_reference));
    
    // Filter out recently used verses
    const availableVerses = SEED_VERSES.filter(v => !recentRefs.has(v.ref));
    const versePool = availableVerses.length > 0 ? availableVerses : SEED_VERSES;
    const seedVerse = versePool[Math.floor(Math.random() * versePool.length)];

    const dayOfWeek = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"][new Date().getDay()];

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

    if (lovableApiKey) {
      try {
        const prompt = `Você é um pastor cristão profundo e experiente, escrevendo um devocional que TRANSFORMA VIDAS para jovens cristãos da Obra em Restauração.

CONTEXTO: Hoje é ${dayOfWeek}, ${today}.

Baseado no versículo "${seedVerse.text}" (${seedVerse.ref}), crie um devocional PODEROSO e TRANSFORMADOR:

REQUISITOS OBRIGATÓRIOS:
1. TÍTULO: Criativo, impactante, máximo 50 caracteres. PROIBIDO usar: "Meditando em...", "Reflexão sobre...", "O poder de..."
2. REFLEXÃO (350-450 palavras, 4-5 parágrafos):
   - Primeiro parágrafo: Uma pergunta ou situação que TODO jovem se identifica
   - Segundo parágrafo: Contexto bíblico-histórico do versículo (quem escreveu, por quê, para quem)
   - Terceiro parágrafo: Aplicação PRÁTICA e ESPECÍFICA para o dia a dia (redes sociais, relacionamentos, estudos, trabalho, ansiedade)
   - Quarto parágrafo: Uma ilustração ou história real que toque o coração
   - Quinto parágrafo: Chamado à ação - algo concreto para fazer HOJE
   - Tom: Íntimo como um amigo sábio, não religioso. Use linguagem natural.
   - PROIBIDO: clichês como "querido jovem", "amado irmão", generalidades vagas
3. PERGUNTAS DE REFLEXÃO: 3 perguntas profundas que levem ao autoexame genuíno
4. FOCO DE ORAÇÃO: Uma oração guiada de 3-4 frases, pessoal e específica

Responda APENAS em JSON válido:
{
  "title": "...",
  "content": "...",
  "reflection_questions": ["...", "...", "..."],
  "prayer_focus": "..."
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
              { role: "system", content: "Você é um pastor e escritor cristão reconhecido por devocionais que transformam vidas. Sua escrita é profunda mas acessível, pessoal mas universal." },
              { role: "user", content: prompt }
            ],
            temperature: 0.85,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const content = aiResponse.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            devotionalContent = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Could not parse AI response");
          }
        } else {
          const errText = await response.text();
          console.error(`AI API error: ${response.status} - ${errText}`);
          throw new Error(`AI API error: ${response.status}`);
        }
      } catch (aiError) {
        console.error("AI generation failed, using fallback:", aiError);
        devotionalContent = generateFallbackDevotional(seedVerse);
      }
    } else {
      devotionalContent = generateFallbackDevotional(seedVerse);
    }

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

    if (insertError) throw insertError;

    await supabase.from("auto_devotional_log").insert({
      devotional_id: newDevotional.id,
      model_used: lovableApiKey ? "google/gemini-2.5-flash" : "fallback-template",
      prompt_used: `Seed verse: ${seedVerse.ref}`,
    });

    console.log(`Devotional created: ${newDevotional.id} - ${newDevotional.title}`);

    return new Response(
      JSON.stringify({ success: true, message: "Devocional gerado com sucesso!", devotional: newDevotional }),
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
  return {
    title: `Palavra Viva: ${seedVerse.ref.split(" ")[0]}`,
    content: `Hoje refletimos sobre as preciosas palavras de ${seedVerse.ref}: "${seedVerse.text}"\n\nEste versículo nos lembra que Deus está presente em cada momento de nossa jornada. Em meio às pressões do dia a dia, às cobranças e às incertezas que enfrentamos, podemos encontrar paz e direção na Palavra de Deus.\n\nOs jovens de hoje enfrentam desafios únicos: a pressão das redes sociais, as expectativas acadêmicas e profissionais, e a busca por propósito. Mas a mensagem deste versículo permanece atual e poderosa.\n\nQue hoje você possa experimentar a presença de Deus de forma real e transformadora. Que Sua Palavra seja lâmpada para os seus pés e luz para o seu caminho.`,
    reflection_questions: [
      "Como este versículo se aplica à sua situação atual?",
      "De que forma você pode praticar esta verdade hoje?",
      "Há algo que precisa entregar a Deus neste momento?"
    ],
    prayer_focus: "Senhor, ajuda-me a aplicar Tua Palavra no meu cotidiano. Dá-me sabedoria para viver de acordo com Teus princípios e força para enfrentar os desafios de hoje com fé e confiança em Ti. Amém."
  };
}
