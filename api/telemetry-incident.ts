// Sovereign Diagnostic Incident Telemetry Ingestion Endpoint for Matany.one (Vercel Edge)
// Receives passive client error reports, unhandled exceptions, and user friction signals

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gyxlvreqwikpujzpyegm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';

export const config = {
  runtime: 'edge',
};
export const runtime = 'edge';
export const maxDuration = 15;

const serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: Request): Promise<Response> {
  const requestId = req.headers.get('x-request-id') || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'inc-' + Date.now());

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-request-id',
        'x-request-id': requestId,
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
    });
  }

  try {
    const body = await req.json();

    const incident = {
      session_id: body.sessionId || null,
      visitor_id: body.visitorId || null,
      user_id: body.userId || null,
      category: body.category || 'SYSTEM_ERROR',
      severity: body.severity || 'MEDIUM',
      user_prompt: body.userPrompt ? String(body.userPrompt).slice(0, 1000) : null,
      model_used: body.modelUsed || null,
      error_code: body.errorCode || null,
      error_message: body.errorMessage ? String(body.errorMessage).slice(0, 2000) : 'Unknown incident',
      error_stack: body.errorStack ? String(body.errorStack).slice(0, 3000) : null,
      endpoint: body.endpoint || null,
      device_info: body.deviceInfo || {},
      metadata: body.metadata || {},
      resolved: false,
    };

    const { error } = await serverSupabase.from('x1_diagnostic_incidents').insert(incident);

    if (error) {
      console.warn('[Vercel Edge Incident] Error saving to Supabase:', error.message);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'x-request-id': requestId },
      });
    }

    return new Response(JSON.stringify({ success: true, status: 'incident_recorded' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'x-request-id': requestId },
    });
  } catch (err: any) {
    console.warn('[Vercel Edge Incident] Ingestion exception:', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Invalid payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'x-request-id': requestId },
    });
  }
}
