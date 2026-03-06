import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_VERSES = [
  { verse: "Buscai primeiro o Reino de Deus e a sua justiça, e todas as coisas vos serão acrescentadas.", reference: "Mateus 6:33" },
  { verse: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", reference: "Salmos 37:5" },
  { verse: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1" },
  { verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito.", reference: "João 3:16" },
  { verse: "Sede fortes e corajosos. Não temais, nem vos espanteis, pois o Senhor estará convosco.", reference: "Josué 1:9" },
  { verse: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13" },
  { verse: "Não andeis ansiosos por coisa alguma; em tudo, porém, sejam conhecidas as vossas petições.", reference: "Filipenses 4:6" },
  { verse: "Porque eu sei os planos que tenho para vocês, planos de fazê-los prosperar.", reference: "Jeremias 29:11" },
  { verse: "O Senhor é a minha luz e a minha salvação; a quem temerei?", reference: "Salmos 27:1" },
  { verse: "Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos!", reference: "Filipenses 4:4" },
  { verse: "Lança sobre o Senhor o teu fardo, e ele te sustentará.", reference: "Salmos 55:22" },
  { verse: "Aquietai-vos e sabei que eu sou Deus.", reference: "Salmos 46:10" },
  { verse: "Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.", reference: "Mateus 11:28" },
  { verse: "Buscar-me-eis e me achareis quando me buscardes de todo o vosso coração.", reference: "Jeremias 29:13" },
  { verse: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.", reference: "1 Coríntios 13:4" },
  { verse: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.", reference: "Provérbios 3:5" },
  { verse: "Porque para Deus nada é impossível.", reference: "Lucas 1:37" },
  { verse: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações.", reference: "Filipenses 4:7" },
  { verse: "Eu sou a videira, vós sois os ramos. Quem permanece em mim e eu nele, esse dá muito fruto.", reference: "João 15:5" },
  { verse: "O Senhor é bom, um refúgio em tempos de tribulação.", reference: "Naum 1:7" },
  { verse: "Clama a mim, e eu te responderei, e te mostrarei coisas grandes e ocultas.", reference: "Jeremias 33:3" },
  { verse: "O justo viverá pela fé.", reference: "Romanos 1:17" },
  { verse: "Tudo tem o seu tempo determinado, e há tempo para todo propósito debaixo do céu.", reference: "Eclesiastes 3:1" },
  { verse: "Mas os que esperam no Senhor renovarão as suas forças.", reference: "Isaías 40:31" },
  { verse: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", reference: "Salmos 46:1" },
  { verse: "O Senhor pelejará por vós, e vós vos calareis.", reference: "Êxodo 14:14" },
  { verse: "Sabemos que todas as coisas cooperam para o bem daqueles que amam a Deus.", reference: "Romanos 8:28" },
  { verse: "Bem-aventurados os pacificadores, porque eles serão chamados filhos de Deus.", reference: "Mateus 5:9" },
  { verse: "Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus.", reference: "Isaías 41:10" },
  { verse: "A tua palavra é lâmpada para os meus pés e luz para o meu caminho.", reference: "Salmos 119:105" },
  { verse: "Ainda que eu ande pelo vale da sombra da morte, não temerei mal algum, porque tu estás comigo.", reference: "Salmos 23:4" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Pick verse based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];

    // Create notification for all approved users
    const { data: approvedUsers } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("is_approved", true);

    if (approvedUsers && approvedUsers.length > 0) {
      const notifications = approvedUsers.map((u: any) => ({
        user_id: u.user_id,
        title: "📖 Versículo do Dia",
        message: `"${verse.verse}" — ${verse.reference}`,
        type: "devotional",
        action_url: "/versiculos",
      }));

      await supabase.from("notifications").insert(notifications);
      console.log(`Daily verse sent to ${approvedUsers.length} users`);
    }

    return new Response(JSON.stringify({ success: true, verse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending daily verse:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
