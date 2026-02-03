import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Temas para quizzes automáticos
const QUIZ_THEMES = [
  { book: "Gênesis", title: "Criação e Patriarcas", difficulty: "facil" },
  { book: "Êxodo", title: "A Libertação de Israel", difficulty: "medio" },
  { book: "Salmos", title: "Louvores e Orações", difficulty: "facil" },
  { book: "Provérbios", title: "Sabedoria Prática", difficulty: "medio" },
  { book: "Mateus", title: "O Evangelho de Jesus", difficulty: "facil" },
  { book: "João", title: "Jesus, o Verbo de Deus", difficulty: "medio" },
  { book: "Romanos", title: "Justificação pela Fé", difficulty: "dificil" },
  { book: "Apocalipse", title: "Visões do Futuro", difficulty: "dificil" },
];

// Sample questions for fallback
const SAMPLE_QUESTIONS = {
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Select random theme
    const theme = QUIZ_THEMES[Math.floor(Math.random() * QUIZ_THEMES.length)];

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

    // Try AI generation
    if (lovableApiKey) {
      try {
        const prompt = `Crie um quiz bíblico sobre ${theme.book} (${theme.title}) com 5 perguntas de nível ${theme.difficulty}.

Para cada pergunta:
- Faça uma pergunta clara sobre o livro
- Ofereça 4 opções de resposta
- Indique qual é a resposta correta (0-3)
- Adicione uma breve explicação

Responda em JSON válido:
{
  "title": "Quiz: ${theme.title}",
  "description": "Teste seus conhecimentos sobre ${theme.book}",
  "questions": [
    {
      "question": "Pergunta aqui?",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correct_answer": 0,
      "explanation": "Explicação breve"
    }
  ]
}`;

        const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Você é um especialista em teologia e cria quizzes bíblicos educativos." },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const content = aiResponse.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            quizData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Could not parse AI response");
          }
        } else {
          throw new Error(`AI API error`);
        }
      } catch (aiError) {
        console.error("AI generation failed, using fallback:", aiError);
        quizData = generateFallbackQuiz(theme);
      }
    } else {
      quizData = generateFallbackQuiz(theme);
    }

    // Insert quiz
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
      })
      .select()
      .single();

    if (quizError) throw quizError;

    // Insert questions
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
  const questions = SAMPLE_QUESTIONS[theme.book as keyof typeof SAMPLE_QUESTIONS] || [
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
