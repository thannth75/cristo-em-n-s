import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KLIPY_API_KEY = Deno.env.get('KLIPY_API_KEY');
    if (!KLIPY_API_KEY) {
      throw new Error('KLIPY_API_KEY not configured');
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') || 'gifs'; // gifs, stickers
    const limit = url.searchParams.get('limit') || '20';
    const locale = url.searchParams.get('locale') || 'pt_BR';
    const action = url.searchParams.get('action') || 'trending'; // trending, search

    let apiUrl: string;

    if (action === 'search' && query) {
      apiUrl = `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/${type}/search?q=${encodeURIComponent(query)}&limit=${limit}&locale=${locale}`;
    } else {
      apiUrl = `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/${type}/trending?limit=${limit}&locale=${locale}`;
    }

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Klipy API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Klipy search error:', error);
    return new Response(
      JSON.stringify({ error: error.message, results: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
