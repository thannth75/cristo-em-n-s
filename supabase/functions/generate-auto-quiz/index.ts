import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Temas expandidos e únicos para quizzes automáticos
const QUIZ_THEMES = [
  { book: "Gênesis", title: "Criação e Patriarcas", difficulty: "facil", keywords: ["Adão", "Eva", "Noé", "Abraão", "Isaque", "Jacó", "José"] },
  { book: "Gênesis", title: "José no Egito", difficulty: "medio", keywords: ["sonhos", "escravidão", "Faraó", "irmãos", "perdão"] },
  { book: "Êxodo", title: "A Libertação de Israel", difficulty: "medio", keywords: ["Moisés", "pragas", "Páscoa", "Mar Vermelho"] },
  { book: "Êxodo", title: "Os Dez Mandamentos", difficulty: "facil", keywords: ["Sinai", "tábuas", "lei", "aliança"] },
  { book: "Levítico", title: "Leis e Sacrifícios", difficulty: "dificil", keywords: ["ofertas", "sacerdotes", "pureza", "santidade"] },
  { book: "Números", title: "A Jornada no Deserto", difficulty: "medio", keywords: ["espias", "12 tribos", "rebelião", "serpente"] },
  { book: "Deuteronômio", title: "A Segunda Lei", difficulty: "medio", keywords: ["aliança", "bênçãos", "maldições", "Canaã"] },
  { book: "Josué", title: "A Conquista de Canaã", difficulty: "medio", keywords: ["Jericó", "Raabe", "Jordão", "herança"] },
  { book: "Juízes", title: "Os Libertadores de Israel", difficulty: "medio", keywords: ["Gideão", "Sansão", "Débora", "ciclos"] },
  { book: "Rute", title: "Amor e Redenção", difficulty: "facil", keywords: ["Noemi", "Boaz", "lealdade", "resgatador"] },
  { book: "1 Samuel", title: "Samuel, Saul e Davi", difficulty: "medio", keywords: ["unção", "Golias", "profeta", "rei"] },
  { book: "2 Samuel", title: "O Reino de Davi", difficulty: "medio", keywords: ["Jerusalém", "Bate-Seba", "Absalão", "aliança"] },
  { book: "1 Reis", title: "Salomão e o Templo", difficulty: "medio", keywords: ["sabedoria", "Templo", "Rainha de Sabá", "divisão"] },
  { book: "2 Reis", title: "Os Profetas e o Exílio", difficulty: "dificil", keywords: ["Elias", "Eliseu", "Babilônia", "Assíria"] },
  { book: "Esdras", title: "O Retorno do Exílio", difficulty: "dificil", keywords: ["reconstrução", "decreto", "Templo", "lei"] },
  { book: "Neemias", title: "Reconstruindo os Muros", difficulty: "medio", keywords: ["Jerusalém", "oposição", "reforma", "oração"] },
  { book: "Ester", title: "Coragem na Corte", difficulty: "facil", keywords: ["Hamã", "Mordecai", "Purim", "rainha"] },
  { book: "Jó", title: "Sofrimento e Fé", difficulty: "dificil", keywords: ["Satanás", "amigos", "restauração", "paciência"] },
  { book: "Salmos", title: "Louvores e Orações", difficulty: "facil", keywords: ["Davi", "adoração", "Senhor é meu pastor", "louvor"] },
  { book: "Salmos", title: "Salmos de Confiança", difficulty: "medio", keywords: ["refúgio", "proteção", "livramento", "Salmo 91"] },
  { book: "Provérbios", title: "Sabedoria Prática", difficulty: "medio", keywords: ["Salomão", "temor do Senhor", "prudência", "conselho"] },
  { book: "Eclesiastes", title: "Vaidade das Vaidades", difficulty: "dificil", keywords: ["Salomão", "tempo", "propósito", "sentido"] },
  { book: "Cantares", title: "O Amor em Poesia", difficulty: "medio", keywords: ["noiva", "noivo", "amor", "Salomão"] },
  { book: "Isaías", title: "O Profeta Messiânico", difficulty: "dificil", keywords: ["Emanuel", "servo sofredor", "redenção", "julgamento"] },
  { book: "Jeremias", title: "O Profeta Chorão", difficulty: "dificil", keywords: ["cativeiro", "nova aliança", "Babilônia", "lamentação"] },
  { book: "Ezequiel", title: "Visões do Exílio", difficulty: "dificil", keywords: ["vale dos ossos", "querubins", "glória", "restauração"] },
  { book: "Daniel", title: "Fé na Babilônia", difficulty: "medio", keywords: ["sonhos", "fornalha", "leões", "profecia"] },
  { book: "Oséias", title: "Amor Redentor", difficulty: "medio", keywords: ["Gômer", "infidelidade", "restauração", "misericórdia"] },
  { book: "Jonas", title: "O Profeta Fugitivo", difficulty: "facil", keywords: ["Nínive", "peixe", "arrependimento", "compaixão"] },
  { book: "Miquéias", title: "Justiça e Misericórdia", difficulty: "medio", keywords: ["Belém", "Messias", "humildade", "perdão"] },
  { book: "Mateus", title: "O Evangelho de Jesus", difficulty: "facil", keywords: ["Sermão da Montanha", "parábolas", "Reino dos Céus"] },
  { book: "Mateus", title: "Parábolas de Jesus", difficulty: "medio", keywords: ["semeador", "joio", "tesouro", "talentos"] },
  { book: "Marcos", title: "Jesus, o Servo", difficulty: "facil", keywords: ["milagres", "ação", "discípulos", "cruz"] },
  { book: "Lucas", title: "Jesus para Todos", difficulty: "medio", keywords: ["nascimento", "parábolas", "cura", "salvação"] },
  { book: "João", title: "Jesus, o Verbo de Deus", difficulty: "medio", keywords: ["Eu Sou", "vida eterna", "luz", "verdade"] },
  { book: "João", title: "Os Milagres de Jesus", difficulty: "facil", keywords: ["água em vinho", "Lázaro", "cego", "pães e peixes"] },
  { book: "Atos", title: "A Igreja Primitiva", difficulty: "medio", keywords: ["Pentecostes", "Paulo", "Pedro", "missões"] },
  { book: "Atos", title: "As Viagens de Paulo", difficulty: "dificil", keywords: ["Antioquia", "Roma", "perseguição", "conversão"] },
  { book: "Romanos", title: "Justificação pela Fé", difficulty: "dificil", keywords: ["graça", "lei", "pecado", "salvação"] },
  { book: "1 Coríntios", title: "A Igreja em Corinto", difficulty: "medio", keywords: ["divisões", "amor", "dons", "ressurreição"] },
  { book: "Gálatas", title: "Liberdade em Cristo", difficulty: "medio", keywords: ["lei", "graça", "fruto do Espírito", "circuncisão"] },
  { book: "Efésios", title: "A Igreja, Corpo de Cristo", difficulty: "medio", keywords: ["unidade", "armadura", "mistério", "bênçãos"] },
  { book: "Filipenses", title: "Alegria em Cristo", difficulty: "facil", keywords: ["contentamento", "humildade", "prêmio", "paz"] },
  { book: "Colossenses", title: "Supremacia de Cristo", difficulty: "medio", keywords: ["plenitude", "filosofias", "nova vida", "Cristo"] },
  { book: "1 Tessalonicenses", title: "A Volta de Cristo", difficulty: "medio", keywords: ["arrebatamento", "santificação", "esperança", "dia do Senhor"] },
  { book: "1 Timóteo", title: "Liderança na Igreja", difficulty: "medio", keywords: ["presbíteros", "diáconos", "jovem líder", "doutrina"] },
  { book: "2 Timóteo", title: "Perseverança na Fé", difficulty: "medio", keywords: ["soldado", "bom combate", "Escrituras", "coroa"] },
  { book: "Hebreus", title: "Cristo, Superior a Tudo", difficulty: "dificil", keywords: ["sacerdócio", "aliança", "fé", "Melquisedeque"] },
  { book: "Tiago", title: "Fé e Obras", difficulty: "medio", keywords: ["provação", "língua", "sabedoria", "oração"] },
  { book: "1 Pedro", title: "Sofrimento e Esperança", difficulty: "medio", keywords: ["estrangeiros", "submissão", "glória", "provação"] },
  { book: "1 João", title: "Comunhão com Deus", difficulty: "facil", keywords: ["amor", "luz", "pecado", "vida eterna"] },
  { book: "Apocalipse", title: "Visões do Futuro", difficulty: "dificil", keywords: ["sete igrejas", "cordeiro", "nova Jerusalém", "trono"] },
  { book: "Apocalipse", title: "As Sete Igrejas", difficulty: "medio", keywords: ["Éfeso", "Esmirna", "Laodiceia", "vencedor"] },
];

const SAMPLE_QUESTIONS: Record<string, Array<{ question: string; options: string[]; correct: number }>> = {
  "Gênesis": [
    { question: "Quantos dias Deus levou para criar o mundo?", options: ["5 dias", "6 dias", "7 dias", "8 dias"], correct: 1 },
    { question: "Qual foi o primeiro mandamento dado a Adão e Eva?", options: ["Não comer do fruto", "Dominar a terra", "Multiplicar-se", "Nomear os animais"], correct: 1 },
    { question: "Quem foi o primeiro filho de Adão e Eva?", options: ["Abel", "Sete", "Caim", "Enoque"], correct: 2 },
  ],
  "Salmos": [
    { question: "Qual Salmo começa com 'O Senhor é meu pastor'?", options: ["Salmo 1", "Salmo 23", "Salmo 91", "Salmo 100"], correct: 1 },
    { question: "Quem escreveu a maioria dos Salmos?", options: ["Moisés", "Salomão", "Davi", "Asafe"], correct: 2 },
    { question: "Quantos Salmos existem na Bíblia?", options: ["100", "120", "150", "200"], correct: 2 },
  ],
  "Mateus": [
    { question: "Onde Jesus nasceu?", options: ["Nazaré", "Jerusalém", "Belém", "Cafarnaum"], correct: 2 },
    { question: "Quantos discípulos Jesus escolheu?", options: ["7", "10", "12", "70"], correct: 2 },
    { question: "Qual foi o primeiro milagre de Jesus registrado em Mateus?", options: ["Andar sobre as águas", "Multiplicar pães", "Curar um leproso", "Acalmar a tempestade"], correct: 2 },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Accept both service role key and anon key (for cron jobs)
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check which themes already have quizzes created recently (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: recentQuizzes } = await supabase
      .from("bible_quizzes")
      .select("book, title")
      .gte("created_at", sevenDaysAgo.toISOString());

    const recentKeys = new Set(
      (recentQuizzes || []).map((q: any) => `${q.book}::${q.title}`)
    );

    const availableThemes = QUIZ_THEMES.filter(
      (t) => !recentKeys.has(`${t.book}::Quiz: ${t.title}`)
    );

    const themePool = availableThemes.length > 0 ? availableThemes : QUIZ_THEMES;
    const theme = themePool[Math.floor(Math.random() * themePool.length)];
    
    console.log(`Selected theme: ${theme.book} - ${theme.title}`);

    // Get admin user
    const { data: adminUser } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    const createdBy = adminUser?.user_id || "00000000-0000-0000-0000-000000000000";

    let quizData: {
      title: string;
      description: string;
      questions: Array<{
        question: string;
        options: string[];
        correct_answer: number;
        explanation?: string;
      }>;
    };

    if (lovableApiKey) {
      try {
        const keywordHint = theme.keywords ? `Palavras-chave: ${theme.keywords.join(", ")}.` : "";
        
        const prompt = `Crie um quiz bíblico ORIGINAL e ÚNICO sobre o livro "${theme.book}" com foco específico no tema "${theme.title}".
${keywordHint}

REGRAS IMPORTANTES:
1. Todas as 5 perguntas devem ser EXCLUSIVAMENTE sobre ${theme.book} e o tema ${theme.title}
2. NÃO repita perguntas genéricas como "Quantos capítulos tem o livro?"
3. Perguntas devem ser sobre EVENTOS, PERSONAGENS, VERSÍCULOS ou CONCEITOS específicos do tema
4. Nível de dificuldade: ${theme.difficulty === "facil" ? "fácil (perguntas diretas)" : theme.difficulty === "medio" ? "médio (requer conhecimento moderado)" : "difícil (requer estudo aprofundado)"}
5. Cada pergunta deve ter uma explicação bíblica com referência ao versículo quando possível

Responda APENAS em JSON válido:
{
  "title": "Quiz: ${theme.title}",
  "description": "Teste seus conhecimentos sobre ${theme.title} em ${theme.book}",
  "questions": [
    {
      "question": "Pergunta específica sobre o tema?",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correct_answer": 0,
      "explanation": "Explicação com referência bíblica"
    }
  ]
}`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "Você é um especialista em teologia e cria quizzes bíblicos educativos. Responda APENAS em JSON válido." },
              { role: "user", content: prompt }
            ],
            temperature: 0.8,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const content = aiResponse.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            quizData = JSON.parse(jsonMatch[0]);
            console.log("AI generated quiz successfully");
          } else {
            throw new Error("Could not parse AI response");
          }
        } else {
          const errText = await response.text();
          console.error(`AI API error: ${response.status} - ${errText}`);
          throw new Error(`AI API error`);
        }
      } catch (aiError) {
        console.error("AI generation failed, using fallback:", aiError);
        quizData = generateFallbackQuiz(theme);
      }
    } else {
      quizData = generateFallbackQuiz(theme);
    }

    // Insert quiz - NO city filter so it's available to ALL users
    const { data: newQuiz, error: quizError } = await supabase
      .from("bible_quizzes")
      .insert({
        title: quizData.title,
        description: quizData.description,
        book: theme.book,
        difficulty: theme.difficulty,
        points_reward: theme.difficulty === "facil" ? 10 : theme.difficulty === "medio" ? 20 : 30,
        is_active: true,
        created_by: createdBy,
        city: null, // Available to ALL users
      })
      .select()
      .single();

    if (quizError) throw quizError;

    const questionsToInsert = quizData.questions.map((q, idx) => ({
      quiz_id: newQuiz.id,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation || null,
      order_position: idx + 1,
      points: theme.difficulty === "facil" ? 2 : theme.difficulty === "medio" ? 4 : 6,
    }));

    const { error: questionsError } = await supabase
      .from("quiz_questions")
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    console.log(`Quiz created: ${newQuiz.id} - ${newQuiz.title}`);

    return new Response(
      JSON.stringify({ success: true, quiz: newQuiz }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error generating quiz:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateFallbackQuiz(theme: { book: string; title: string; difficulty: string }) {
  const questions = SAMPLE_QUESTIONS[theme.book] || [
    { question: "Qual é o tema principal deste livro?", options: ["Amor", "Fé", "Esperança", "Todos acima"], correct: 3 },
  ];

  return {
    title: `Quiz: ${theme.title}`,
    description: `Teste seus conhecimentos sobre ${theme.book}`,
    questions: questions.map(q => ({
      question: q.question,
      options: q.options,
      correct_answer: q.correct,
      explanation: "Estude mais sobre este tema na Bíblia!"
    })),
  };
}
