/**
 * Standalone Search API Endpoint (Edge / Serverless)
 * Matany AI (Matany)
 */

import { executeAutonomousSearch, SearchEngineOptions } from '../server/searchEngine';

export const config = {
  runtime: 'edge',
};
export const runtime = 'edge';
export const maxDuration = 30;

export default async function handler(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    let query = '';
    let options: SearchEngineOptions = {};

    if (req.method === 'GET') {
      const url = new URL(req.url);
      query = url.searchParams.get('q') || url.searchParams.get('query') || '';
      const maxResults = parseInt(url.searchParams.get('max') || url.searchParams.get('num') || '8', 10);
      const hl = (url.searchParams.get('hl') || 'ar') as 'ar' | 'en';
      const deepSearch = url.searchParams.get('deepSearch') === 'true';

      options = {
        maxResults: isNaN(maxResults) ? 8 : maxResults,
        hl,
        explicitDeepSearch: deepSearch,
      };
    } else if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      query = body.query || body.q || '';
      options = body.options || {
        maxResults: body.maxResults || 8,
        hl: body.hl || 'ar',
        explicitDeepSearch: body.explicitDeepSearch ?? body.deepSearch ?? false,
        disableCache: body.disableCache ?? false,
      };
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    if (!query.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query parameter is required' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await executeAutonomousSearch(query, options);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[API /api/search Error]:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Search execution failed',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
