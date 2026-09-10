// Sovereign GPAENG 3.0 Diagnostic, Health & Autonomous Remediation Endpoint
// Vercel Serverless Function supporting live telemetry, master dossier, and self-healing

import { createClient } from '@supabase/supabase-js';
import { GpaengDiagnosticEngine } from '../server/gpaengDiagnosticEngine';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gyxlvreqwikpujzpyegm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN || '';

export const config = {
  runtime: 'edge',
};
export const runtime = 'edge';
export const maxDuration = 30;

const serverSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req: Request): Promise<Response> {
  const requestId = req.headers.get('x-request-id') || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'gpaeng-' + Date.now());

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-request-id, authorization',
        'x-request-id': requestId,
      },
    });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'health';

  try {
    if (req.method === 'GET') {
      if (action === 'dossier') {
        const query = url.searchParams.get('q') || 'GPAENG';
        const dossier = await GpaengDiagnosticEngine.buildMasterDiagnosticDossier(serverSupabase, query);
        return new Response(JSON.stringify({ success: true, dossier, requestId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
        });
      }

      // Default GET: System Health & SVI Index
      const { data: analytics } = await serverSupabase.rpc('get_gpaeng_master_analytics', { p_hours: 168 });
      return new Response(JSON.stringify({
        success: true,
        engine: 'GPAENG 3.0 Sovereign Diagnostics',
        timestamp: new Date().toISOString(),
        analytics: analytics || {},
        requestId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const postAction = body.action || action;

      if (postAction === 'remediate') {
        console.log('[GPAENG 3.0 Edge] Triggering autonomous closed-loop self-healing cycle...');
        const result = await GpaengDiagnosticEngine.runAutonomousSelfHealingLoop(serverSupabase);
        return new Response(JSON.stringify({
          success: true,
          action: 'remediate',
          result,
          timestamp: new Date().toISOString(),
          requestId
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
        });
      }

      if (postAction === 'sync_github') {
        console.log('[GPAENG 3.0 Edge] Synchronizing incidents to GitHub repository MohamedFC2A/Matany...');
        const token = body.githubToken || GITHUB_TOKEN;
        if (!token) {
          return new Response(JSON.stringify({ success: false, error: 'GITHUB_TOKEN required for sync' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
          });
        }

        // Fetch top critical unresolved incident
        const { data: criticalIncidents } = await serverSupabase
          .from('matany_diagnostic_incidents')
          .select('*')
          .eq('resolved', false)
          .in('severity', ['CRITICAL', 'HIGH'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (!criticalIncidents || criticalIncidents.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            message: 'No open critical or high incidents to sync. System is healthy.',
            requestId
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
          });
        }

        const syncRes = await GpaengDiagnosticEngine.syncCriticalIncidentToGitHub(
          token,
          'MohamedFC2A',
          'Matany',
          criticalIncidents[0]
        );

        return new Response(JSON.stringify({
          success: syncRes.success,
          issueUrl: syncRes.issueUrl,
          error: syncRes.error,
          requestId
        }), {
          status: syncRes.success ? 200 : 500,
          headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
        });
      }

      return new Response(JSON.stringify({ error: `Unsupported action: ${postAction}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
      });
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'GPAENG API Internal Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'x-request-id': requestId },
    });
  }
}
