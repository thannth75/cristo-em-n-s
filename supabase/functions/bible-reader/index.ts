const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mapeamento de abreviações PT → nomes em inglês para a bible-api.com
const BOOK_MAP: Record<string, string> = {
  gn: "genesis", ex: "exodus", lv: "leviticus", nm: "numbers", dt: "deuteronomy",
  js: "joshua", jz: "judges", rt: "ruth", "1sm": "1 samuel", "2sm": "2 samuel",
  "1rs": "1 kings", "2rs": "2 kings", "1cr": "1 chronicles", "2cr": "2 chronicles",
  ed: "ezra", ne: "nehemiah", et: "esther", jó: "job", sl: "psalms",
  pv: "proverbs", ec: "ecclesiastes", ct: "song of solomon",
  is: "isaiah", jr: "jeremiah", lm: "lamentations", ez: "ezekiel", dn: "daniel",
  os: "hosea", jl: "joel", am: "amos", ob: "obadiah", jn: "jonah",
  mq: "micah", na: "nahum", hc: "habakkuk", sf: "zephaniah",
  ag: "haggai", zc: "zechariah", ml: "malachi",
  mt: "matthew", mc: "mark", lc: "luke", jo: "john", at: "acts",
  rm: "romans", "1co": "1 corinthians", "2co": "2 corinthians",
  gl: "galatians", ef: "ephesians", fp: "philippians", cl: "colossians",
  "1ts": "1 thessalonians", "2ts": "2 thessalonians",
  "1tm": "1 timothy", "2tm": "2 timothy", tt: "titus", fm: "philemon",
  hb: "hebrews", tg: "james", "1pe": "1 peter", "2pe": "2 peter",
  "1jo": "1 john", "2jo": "2 john", "3jo": "3 john", jd: "jude", ap: "revelation",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { abbrev, chapter } = await req.json();

    if (!abbrev || !chapter) {
      return new Response(
        JSON.stringify({ success: false, error: "abbrev and chapter are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bookName = BOOK_MAP[abbrev.toLowerCase()];
    if (!bookName) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown book abbreviation: ${abbrev}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Usa bible-api.com com tradução Almeida (João Ferreira de Almeida)
    const query = encodeURIComponent(`${bookName} ${chapter}`);
    const apiUrl = `https://bible-api.com/${query}?translation=almeida`;

    console.log(`Fetching: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`API error: ${response.status} - ${body}`);
      return new Response(
        JSON.stringify({ success: false, error: `API returned ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // bible-api.com retorna: { verses: [{book_name, chapter, verse, text}], ... }
    // Transformar para o formato esperado pelo frontend
    const verses = (data.verses || []).map((v: any) => ({
      number: v.verse,
      text: (v.text || "").trim(),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          book: { name: data.verses?.[0]?.book_name || bookName },
          chapter: { number: chapter },
          verses,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
