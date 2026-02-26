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
    const perPage = url.searchParams.get('limit') || '20';
    const locale = url.searchParams.get('locale') || 'br';
    const action = url.searchParams.get('action') || 'trending';

    // Map type to Klipy API path
    const apiType = type === 'stickers' ? 'stickers' : 'gifs';

    let apiUrl: string;
    if (action === 'search' && query) {
      apiUrl = `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/${apiType}/search?q=${encodeURIComponent(query)}&per_page=${perPage}&locale=${locale}&page=1`;
    } else {
      apiUrl = `https://api.klipy.com/api/v1/${KLIPY_API_KEY}/${apiType}/trending?per_page=${perPage}&locale=${locale}&page=1`;
    }

    console.log('Fetching Klipy:', apiUrl.replace(KLIPY_API_KEY, '***'));

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const text = await response.text();
      console.error('Klipy API error:', response.status, text);
      throw new Error(`Klipy API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform Klipy response to a simpler format for the frontend
    const items = data?.data?.data || data?.data || [];
    const results = Array.isArray(items) ? items.map((item: any) => ({
      id: String(item.id || item.slug),
      title: item.title || '',
      // Provide URLs in order of preference: small gif > medium gif > hd gif
      preview_url: item.file?.sm?.gif?.url || item.file?.sm?.webp?.url || item.file?.md?.gif?.url || '',
      full_url: item.file?.md?.gif?.url || item.file?.hd?.gif?.url || item.file?.sm?.gif?.url || '',
    })).filter((r: any) => r.preview_url) : [];

    return new Response(JSON.stringify({ results }), {
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
