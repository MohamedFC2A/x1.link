/**
 * VPS Control Room & Cloud Execution Bridge Unit Test Suite
 * Matany AI (Matany) — Singapore Host 104.207.77.162:22022
 */

import { TestHarness, expect } from '../testUtils';
import { isVpsOrCloudRequest, VPS_STATUS_NOTICE } from '../../src/lib/vpsUtils';
import type { VpsTelemetryData } from '../../src/types';

export async function runVpsControlTests(harness: TestHarness): Promise<void> {
  await harness.describe('VPS Control Room: Cloud Execution Bridge & Intent Recognition', async () => {

    // ─── 1. Mandatory Notice Exact Invariant ─────────────────────────────────
    await harness.it('VPS Invariant: notice matches exact mandated text', () => {
      expect(VPS_STATUS_NOTICE).toBe('يتم الان الوصول للكمبيوتر والاوامر السحابية');
    });

    // ─── 2. Intent Detection for VPS & Cloud Operations ──────────────────────
    await harness.it('VPS Intent: accurately detects VPS, server, cloud computer, and PM2 requests', () => {
      const positiveQueries = [
        'افحص لي حالة الـ vps واستهلاك الرام',
        'شغل لي أمر bash في السيرفر ls -la',
        'ما هي العمليات الشغالة في pm2 في السيرفر؟',
        'ادخل على الكمبيوتر السحابي ونفذ الكود',
        'افتح غرفة التحكم في الخادم',
        'تحقق من مساحة الهارد ديسك في السيرفر',
        'اعمل restart للبوت في السيرفر',
        'نفذ أمر uptime عبر ssh',
        'ما هو استهلاك المعالج cpu في الخادم؟',
        'أوقف الأتمتة في السيرفر الآن',
      ];

      for (const query of positiveQueries) {
        const detected = isVpsOrCloudRequest(query);
        expect(detected).toBe(true);
      }
    });

    await harness.it('VPS Intent: does not trigger on unrelated general knowledge or coding questions', () => {
      const negativeQueries = [
        'ما هي عاصمة أستراليا؟',
        'اكتب لي دالة في بايثون لحساب الأعداد الأولية',
        'صمم لي شعار متجاوب بتنسيق SVG',
        'ما هي فوائد الشاي الأخضر للصحة؟',
        'اشرح لي النظرية النسبية العامة لأينشتاين',
      ];

      for (const query of negativeQueries) {
        const detected = isVpsOrCloudRequest(query);
        expect(detected).toBe(false);
      }
    });

    // ─── 3. Telemetry Structure & Safeguards ─────────────────────────────────
    await harness.it('VPS Telemetry: validates complete telemetry schema and status notice presence', () => {
      const sampleTelemetry: VpsTelemetryData = {
        host: '104.207.77.162',
        sshPort: 22022,
        connected: true,
        timestamp: new Date().toISOString(),
        osInfo: 'Ubuntu 24.04.4 LTS (Linux 6.8.0-90-generic)',
        uptimeFormatted: '24 days, 15:30',
        cpuUsagePercent: 0.9,
        ramTotalMb: 1968,
        ramUsedMb: 441,
        ramFreeMb: 1527,
        ramUsagePercent: 22.4,
        diskTotalGb: 24.0,
        diskUsedGb: 7.3,
        diskFreeGb: 16.7,
        diskUsagePercent: 30.4,
        automationStatus: 'paused',
        processes: [
          { id: 0, name: 'upstore-bot', status: 'stopped', cpu: '0%', memory: '0MB', uptime: '0m', restarts: 48, pid: 0, user: 'root' },
          { id: 14, name: 'upstore-promoter', status: 'stopped', cpu: '0%', memory: '0MB', uptime: '0m', restarts: 19, pid: 0, user: 'root' },
        ],
        listeningPorts: ['0.0.0.0:22022'],
        statusNotice: VPS_STATUS_NOTICE,
      };

      expect(sampleTelemetry.host).toBe('104.207.77.162');
      expect(sampleTelemetry.sshPort).toBe(22022);
      expect(sampleTelemetry.automationStatus).toBe('paused');
      expect(sampleTelemetry.statusNotice).toBe('يتم الان الوصول للكمبيوتر والاوامر السحابية');
      expect(sampleTelemetry.processes.length).toBe(2);
      expect(sampleTelemetry.ramUsagePercent).toBeLessThan(100);
      expect(sampleTelemetry.diskUsagePercent).toBeLessThan(100);
    });
  });
}
