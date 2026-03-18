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
  "1jo": "1 john", "2jo": "2 john", "3jo": "3 john", jd: "jude", ap: "revelation",
};

// Strong's concordance - mini dicionário embutido das palavras mais comuns
const STRONG_DICT: Record<string, { original: string; transliteration: string; meaning: string; lang: string }> = {
  "H430": { original: "אֱלֹהִים", transliteration: "Elohim", meaning: "Deus, deuses; o Deus supremo, majestade divina", lang: "Hebraico" },
  "H3068": { original: "יְהוָה", transliteration: "YHWH / Yahweh", meaning: "O SENHOR, o Deus eterno de Israel, o auto-existente", lang: "Hebraico" },
  "H1": { original: "אָב", transliteration: "Ab", meaning: "Pai, ancestral, originador", lang: "Hebraico" },
  "H7307": { original: "רוּחַ", transliteration: "Ruach", meaning: "Espírito, vento, sopro, fôlego de vida", lang: "Hebraico" },
  "H1697": { original: "דָּבָר", transliteration: "Dabar", meaning: "Palavra, coisa, assunto, mensagem divina", lang: "Hebraico" },
  "H2617": { original: "חֶסֶד", transliteration: "Chesed", meaning: "Amor leal, bondade, misericórdia, graça", lang: "Hebraico" },
  "H8451": { original: "תּוֹרָה", transliteration: "Torah", meaning: "Lei, instrução, ensinamento divino", lang: "Hebraico" },
  "H6662": { original: "צַדִּיק", transliteration: "Tsaddiq", meaning: "Justo, reto, íntegro diante de Deus", lang: "Hebraico" },
  "H3444": { original: "יְשׁוּעָה", transliteration: "Yeshu'ah", meaning: "Salvação, livramento, vitória", lang: "Hebraico" },
  "H1285": { original: "בְּרִית", transliteration: "Berit", meaning: "Aliança, pacto, concerto", lang: "Hebraico" },
  "H4899": { original: "מָשִׁיחַ", transliteration: "Mashiach", meaning: "Ungido, Messias, o escolhido de Deus", lang: "Hebraico" },
  "H3519": { original: "כָּבוֹד", transliteration: "Kavod", meaning: "Glória, honra, esplendor, peso", lang: "Hebraico" },
  "H7965": { original: "שָׁלוֹם", transliteration: "Shalom", meaning: "Paz, inteireza, bem-estar, prosperidade", lang: "Hebraico" },
  "H539": { original: "אָמַן", transliteration: "Aman", meaning: "Crer, confiar, ser fiel, amém", lang: "Hebraico" },
  "H6918": { original: "קָדוֹשׁ", transliteration: "Qadosh", meaning: "Santo, sagrado, separado, puro", lang: "Hebraico" },
  "G2316": { original: "θεός", transliteration: "Theos", meaning: "Deus, a divindade suprema", lang: "Grego" },
  "G2424": { original: "Ἰησοῦς", transliteration: "Iesous", meaning: "Jesus — 'YHWH salva'", lang: "Grego" },
  "G5547": { original: "Χριστός", transliteration: "Christos", meaning: "Cristo, Ungido, Messias", lang: "Grego" },
  "G4151": { original: "πνεῦμα", transliteration: "Pneuma", meaning: "Espírito, sopro, vento, espírito santo", lang: "Grego" },
  "G26": { original: "ἀγάπη", transliteration: "Agape", meaning: "Amor incondicional, amor divino sacrificial", lang: "Grego" },
  "G4102": { original: "πίστις", transliteration: "Pistis", meaning: "Fé, confiança, fidelidade, convicção", lang: "Grego" },
  "G5485": { original: "χάρις", transliteration: "Charis", meaning: "Graça, favor imerecido, benção divina", lang: "Grego" },
  "G1680": { original: "ἐλπίς", transliteration: "Elpis", meaning: "Esperança, expectativa confiante", lang: "Grego" },
  "G1515": { original: "εἰρήνη", transliteration: "Eirene", meaning: "Paz, harmonia, tranquilidade", lang: "Grego" },
  "G1343": { original: "δικαιοσύνη", transliteration: "Dikaiosyne", meaning: "Justiça, retidão, condição justa diante de Deus", lang: "Grego" },
  "G4991": { original: "σωτηρία", transliteration: "Soteria", meaning: "Salvação, livramento, preservação", lang: "Grego" },
  "G932": { original: "βασιλεία", transliteration: "Basileia", meaning: "Reino, reinado, domínio soberano", lang: "Grego" },
  "G2222": { original: "ζωή", transliteration: "Zoe", meaning: "Vida, vida eterna, vida abundante", lang: "Grego" },
  "G3056": { original: "λόγος", transliteration: "Logos", meaning: "Palavra, Verbo, razão, discurso divino", lang: "Grego" },
  "G40": { original: "ἅγιος", transliteration: "Hagios", meaning: "Santo, sagrado, consagrado, puro", lang: "Grego" },
  "G3962": { original: "πατήρ", transliteration: "Pater", meaning: "Pai, Deus Pai, antepassado", lang: "Grego" },
  "G1242": { original: "διαθήκη", transliteration: "Diatheke", meaning: "Aliança, testamento, pacto", lang: "Grego" },
  "G266": { original: "ἁμαρτία", transliteration: "Hamartia", meaning: "Pecado, errar o alvo, transgressão", lang: "Grego" },
  "G3341": { original: "μετάνοια", transliteration: "Metanoia", meaning: "Arrependimento, mudança de mente e coração", lang: "Grego" },
  "G907": { original: "βαπτίζω", transliteration: "Baptizo", meaning: "Batizar, imergir, mergulhar", lang: "Grego" },
  "G2098": { original: "εὐαγγέλιον", transliteration: "Euangelion", meaning: "Evangelho, boas novas, boa notícia", lang: "Grego" },
  "G1577": { original: "ἐκκλησία", transliteration: "Ekklesia", meaning: "Igreja, assembleia, comunidade dos chamados", lang: "Grego" },
  "G4396": { original: "προφήτης", transliteration: "Prophetes", meaning: "Profeta, porta-voz de Deus", lang: "Grego" },
  "G652": { original: "ἀπόστολος", transliteration: "Apostolos", meaning: "Apóstolo, enviado, mensageiro", lang: "Grego" },
  "G1391": { original: "δόξα", transliteration: "Doxa", meaning: "Glória, esplendor, honra, louvor", lang: "Grego" },
  "G3739": { original: "ἀμήν", transliteration: "Amen", meaning: "Amém, assim seja, verdadeiramente", lang: "Grego" },
};

// Palavras-chave para lookup rápido (PT → Strong ID)
const WORD_TO_STRONG: Record<string, string[]> = {
  "deus": ["H430", "G2316"], "senhor": ["H3068"], "pai": ["H1", "G3962"],
  "espírito": ["H7307", "G4151"], "palavra": ["H1697", "G3056"], "amor": ["G26"],
  "fé": ["G4102"], "graça": ["G5485"], "esperança": ["G1680"], "paz": ["H7965", "G1515"],
  "justiça": ["H6662", "G1343"], "salvação": ["H3444", "G4991"], "aliança": ["H1285", "G1242"],
  "messias": ["H4899"], "cristo": ["G5547"], "jesus": ["G2424"],
  "glória": ["H3519", "G1391"], "santo": ["H6918", "G40"], "lei": ["H8451"],
  "misericórdia": ["H2617"], "reino": ["G932"], "vida": ["G2222"],
  "verbo": ["G3056"], "pecado": ["G266"], "arrependimento": ["G3341"],
  "batismo": ["G907"], "evangelho": ["G2098"], "igreja": ["G1577"],
  "profeta": ["G4396"], "apóstolo": ["G652"], "amém": ["G3739"],
  "torah": ["H8451"], "shalom": ["H7965"], "chesed": ["H2617"],
  "ungido": ["H4899", "G5547"], "justo": ["H6662"],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { abbrev, chapter, strongLookup } = body;

    // Strong's lookup mode
    if (strongLookup) {
      const word = String(strongLookup).toLowerCase().trim();
      const strongIds = WORD_TO_STRONG[word];
      if (!strongIds) {
        return new Response(
          JSON.stringify({ success: true, data: { results: [], word } }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const results = strongIds.map(id => ({ id, ...STRONG_DICT[id] })).filter(r => r.original);
      return new Response(
        JSON.stringify({ success: true, data: { results, word } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Bible reading mode
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
      const respBody = await response.text();
      console.error(`API error (${candidateBook}): ${response.status} - ${respBody}`);
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: `API returned ${lastStatus}` }),
        { status: lastStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
