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
  const visitorId = url.searchParams.get('visitorId');
  const masterHash = url.searchParams.get('masterHash');

  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (!requestId && !visitorId && !masterHash) {
    return new Response(JSON.stringify({ error: 'Missing identifier' }), { status: 400, headers: corsHeaders });
  }

  try {
    let query = '';
    if (requestId) {
      query = `id=eq.${encodeURIComponent(requestId)}`;
    } else {
      const orFilters: string[] = [];
      if (visitorId && visitorId.length >= 8 && visitorId !== 'anon') {
        orFilters.push(`visitor_id.eq.${encodeURIComponent(visitorId)}`);
      }
      if (masterHash && masterHash.length >= 6 && masterHash !== 'N/A') {
        orFilters.push(`master_hash.eq.${encodeURIComponent(masterHash)}`);
      }
      if (orFilters.length === 0) {
        return new Response(JSON.stringify({ status: 'not_found' }), { status: 200, headers: corsHeaders });
      }
      query = `or=(${orFilters.join(',')})&order=created_at.desc&limit=1`;
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/early_access_requests?${query}&select=id,status,approved_at,approved_by,name,created_at`,
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
      const record = data[0];
      // Defensive validation: A request is ONLY legitimately approved if approved_at AND approved_by exist
      if (record.status === 'approved' && (!record.approved_at || !record.approved_by)) {
        record.status = 'pending';
      }
      return new Response(JSON.stringify(record), { status: 200, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ status: 'not_found' }), { status: 200, headers: corsHeaders });
  } catch {
    return new Response(JSON.stringify({ status: 'unknown' }), { status: 500, headers: corsHeaders });
  }
}
