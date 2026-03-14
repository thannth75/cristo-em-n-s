const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    // Usa a API ABibliaDigital - versão ACF (Almeida Corrigida Fiel)
    const apiUrl = `https://www.abibliadigital.com.br/api/verses/acf/${encodeURIComponent(abbrev)}/${chapter}`;

    console.log(`Fetching: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`API error: ${response.status}`);
      return new Response(
        JSON.stringify({ success: false, error: `API returned ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // A API retorna: { book: {...}, chapter: {...}, verses: [{number, text}] }
    return new Response(
      JSON.stringify({ success: true, data }),
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
