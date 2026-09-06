// Edge Serverless Endpoint: /api/early-access-status
// Checks Status of Early Access Request for real-time live unlock

export const config = {
  runtime: 'edge',
};

export const runtime = 'edge';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gyxlvreqwikpujzpyegm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const requestId = url.searchParams.get('id');

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (!requestId) {
    return new Response(JSON.stringify({ error: 'Missing request id' }), { status: 400, headers: corsHeaders });
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/early_access_requests?id=eq.${encodeURIComponent(requestId)}&select=id,status,approved_at,approved_by,name`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!res.ok) {
      return new Response(JSON.stringify({ status: 'unknown' }), { status: 200, headers: corsHeaders });
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return new Response(JSON.stringify(data[0]), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ status: 'not_found' }), { status: 404, headers: corsHeaders });
  } catch {
    return new Response(JSON.stringify({ status: 'unknown' }), { status: 500, headers: corsHeaders });
  }
}
