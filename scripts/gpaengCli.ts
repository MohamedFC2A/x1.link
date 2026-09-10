/**
 * Sovereign GPAENG 3.0 CLI Diagnostic & Remediation Tool
 * Matany AI (Matany)
 *
 * Usage:
 *   npx tsx scripts/gpaengCli.ts diagnose
 *   npx tsx scripts/gpaengCli.ts remediate
 *   npx tsx scripts/gpaengCli.ts sync-github
 */

import { createClient } from '@supabase/supabase-js';
import { GpaengDiagnosticEngine } from '../server/gpaengDiagnosticEngine';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gyxlvreqwikpujzpyegm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const mode = process.argv[2] || 'diagnose';

  console.log(`\n======================================================`);
  console.log(`🛡️  GPAENG 3.0 Sovereign Autonomous Diagnostics & Self-Healing`);
  console.log(`Mode: ${mode.toUpperCase()} | Project: Matany (gyxlvreqwikpujzpyegm)`);
  console.log(`======================================================\n`);

  if (mode === 'diagnose') {
    console.log('⚡ Generating master diagnostic dossier...');
    const dossier = await GpaengDiagnosticEngine.buildMasterDiagnosticDossier(supabase, 'GPAENG');
    console.log(dossier);
    process.exit(0);
  }

  if (mode === 'remediate') {
    console.log('⚡ Executing autonomous closed-loop self-healing cycle...');
    const result = await GpaengDiagnosticEngine.runAutonomousSelfHealingLoop(supabase);
    console.log('\n[REMEDIATION COMPLETED]');
    console.log(`✓ Mitigated Incidents: ${result.mitigatedCount}`);
    console.log(`✓ New Lessons Learned: ${result.newLessonsCount}`);
    console.log(`✓ Updated SVI Score: ${result.sviScore}% [Status: ${result.healthStatus}]`);
    process.exit(0);
  }

  if (mode === 'sync-github') {
    console.log('⚡ Synchronizing critical unresolved incidents to GitHub (MohamedFC2A/Matany)...');
    if (!GITHUB_TOKEN) {
      console.warn('⚠️ GITHUB_TOKEN environment variable not found. Please export GITHUB_TOKEN.');
      process.exit(1);
    }

    const { data: openCritical } = await supabase
      .from('matany_diagnostic_incidents')
      .select('*')
      .eq('resolved', false)
      .in('severity', ['CRITICAL', 'HIGH'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (!openCritical || openCritical.length === 0) {
      console.log('✓ No open critical incidents requiring GitHub sync. System is healthy.');
      process.exit(0);
    }

    const res = await GpaengDiagnosticEngine.syncCriticalIncidentToGitHub(
      GITHUB_TOKEN,
      'MohamedFC2A',
      'Matany',
      openCritical[0]
    );

    if (res.success) {
      console.log(`✓ Successfully synced incident to GitHub Issue: ${res.issueUrl}`);
    } else {
      console.error(`✗ GitHub sync failed: ${res.error}`);
    }
    process.exit(res.success ? 0 : 1);
  }

  console.error(`Unknown command mode "${mode}". Supported: diagnose, remediate, sync-github`);
  process.exit(1);
}

run().catch((err) => {
  console.error('GPAENG CLI Fatal Exception:', err);
  process.exit(1);
});
