const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mapeamento robusto de abreviações PT para consultas na bible-api.com
const BOOK_MAP_PT: Record<string, string> = {
  gn: "gênesis", ex: "êxodo", lv: "levítico", nm: "números", dt: "deuteronômio",
  js: "josué", jz: "juízes", rt: "rute", "1sm": "1 samuel", "2sm": "2 samuel",
  "1rs": "1 reis", "2rs": "2 reis", "1cr": "1 crônicas", "2cr": "2 crônicas",
  ed: "esdras", ne: "neemias", et: "ester", jó: "jó", sl: "salmos",
  pv: "provérbios", ec: "eclesiastes", ct: "cânticos",
  is: "isaías", jr: "jeremias", lm: "lamentações", ez: "ezequiel", dn: "daniel",
  os: "oseias", jl: "joel", am: "amós", ob: "obadias", jn: "jonas",
  mq: "miquéias", na: "naum", hc: "habacuque", sf: "sofonias",
  ag: "ageu", zc: "zacarias", ml: "malaquias",
  mt: "mateus", mc: "marcos", lc: "lucas", jo: "joão", at: "atos",
  rm: "romanos", "1co": "1 coríntios", "2co": "2 coríntios",
  gl: "gálatas", ef: "efésios", fp: "filipenses", cl: "colossenses",
  "1ts": "1 tessalonicenses", "2ts": "2 tessalonicenses",
  "1tm": "1 timóteo", "2tm": "2 timóteo", tt: "tito", fm: "filemom",
  hb: "hebreus", tg: "tiago", "1pe": "1 pedro", "2pe": "2 pedro",
  "1jo": "1 joão", "2jo": "2 joão", "3jo": "3 joão", jd: "judas", ap: "apocalipse",
};

const BOOK_MAP_EN_FALLBACK: Record<string, string> = {
  gn: "genesis", ex: "exodus", lv: "leviticus", nm: "numbers", dt: "deuteronomy",
  js: "joshua", jz: "judges", rt: "ruth", "1sm": "1 samuel", "2sm": "2 samuel",
  "1rs": "1 kings", "2rs": "2 kings", "1cr": "1 chronicles", "2cr": "2 chronicles",
  ed: "ezra", ne: "nehemiah", et: "esther", jó: "job", sl: "psalms",
  pv: "proverbs", ec: "ecclesiastes", ct: "song of songs",
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
  "1jo": "1 john", "2jo": "2 john", "3jo": "3 john", jd: "jude", ap: "apocalypse",
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

    const key = String(abbrev).toLowerCase();
    const primaryBook = BOOK_MAP_PT[key];
    const fallbackBook = BOOK_MAP_EN_FALLBACK[key];

    if (!primaryBook && !fallbackBook) {
      return new Response(
        JSON.stringify({ success: false, error: `Unknown book abbreviation: ${abbrev}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const chapterNumber = Number(chapter);
    if (!Number.isFinite(chapterNumber) || chapterNumber < 1) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid chapter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const candidates = Array.from(new Set([primaryBook, fallbackBook].filter(Boolean))) as string[];

    let data: any = null;
    let lastStatus = 500;

    for (const candidateBook of candidates) {
      const query = encodeURIComponent(`${candidateBook} ${chapterNumber}`);
      const apiUrl = `https://bible-api.com/${query}?translation=almeida`;

      console.log(`Fetching: ${apiUrl}`);
      const response = await fetch(apiUrl, { headers: { "Accept": "application/json" } });

      if (response.ok) {
        data = await response.json();
        break;
      }

      lastStatus = response.status;
      const body = await response.text();
      console.error(`API error (${candidateBook}): ${response.status} - ${body}`);
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: `API returned ${lastStatus}` }),
        { status: lastStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
          book: { name: data.verses?.[0]?.book_name || primaryBook || fallbackBook },
          chapter: { number: chapterNumber },
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
