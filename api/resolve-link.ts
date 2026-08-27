import { resolveAndProfileUrl } from '../server/linkResolver';

export const config = {
  runtime: 'edge',
};
export const runtime = 'edge';
export const maxDuration = 60;

export default async function handler(req: Request) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  try {
    let url = '';
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      url = body?.url || '';
    } else {
      const parsed = new URL(req.url);
      url = parsed.searchParams.get('url') || '';
    }

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid url parameter' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const resolved = await resolveAndProfileUrl(url);
    return new Response(JSON.stringify(resolved), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to resolve link' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
