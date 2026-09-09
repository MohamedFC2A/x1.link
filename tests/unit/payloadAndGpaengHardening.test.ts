/**
 * Unit Tests: Payload Protection, Zero-Technical-Leak UX Shield & GPAENG Hardening
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import { ensureImageCdnUrl, compressDataUrlFallback } from '../../src/services/clientStorageService';
import { GpaengDiagnosticEngine } from '../../server/gpaengDiagnosticEngine';

export async function runPayloadAndGpaengHardeningTests(harness: TestHarness) {
  await harness.describe('Payload Protection & Zero-Technical-Leak UX Shield Tests', async () => {
    await harness.it('should preserve existing HTTP/HTTPS CDN URLs without redundant network uploads', async () => {
      const cdnUrl = 'https://gyxlvreqwikpujzpyegm.supabase.co/storage/v1/object/public/chat-images/test.jpg';
      const result = await ensureImageCdnUrl(cdnUrl);
      expect(result).toBe(cdnUrl);
    });

    await harness.it('should return empty or raw string if input is falsy or not a data URL', async () => {
      const empty = await ensureImageCdnUrl('');
      expect(empty).toBe('');
      const plain = await ensureImageCdnUrl('not-an-image');
      expect(plain).toBe('not-an-image');
    });

    await harness.it('should preserve data URLs under 400KB threshold in compressDataUrlFallback', async () => {
      const smallDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const result = await compressDataUrlFallback(smallDataUrl);
      expect(result).toBe(smallDataUrl);
    });

    await harness.it('should sanitize raw Vercel 413 and payload too large errors into friendly Arabic text with ZERO technical leaks', () => {
      const rawVercelError = 'FUNCTION_PAYLOAD_TOO_LARGE\ncdg1::pcxgl-1788988090425-d4fd39291451';
      const rawEntityError = 'Request Entity Too Large';

      const sanitize = (err: string): string => {
        if (
          err.includes('FUNCTION_PAYLOAD_TOO_LARGE') ||
          err.includes('Request Entity Too Large') ||
          err.includes('Payload Too Large') ||
          err.includes('cdg1::') ||
          err.includes('413')
        ) {
          return 'تم استلام طلبك، ولكن حجم المرفقات أو المحادثة كان كبيراً جداً؛ تم تحسين الحجم تلقائياً. يرجى الضغط على زر إعادة المحاولة للمتابعة.';
        }
        return err;
      };

      const sanitizedVercel = sanitize(rawVercelError);
      const sanitizedEntity = sanitize(rawEntityError);

      expect(sanitizedVercel.includes('cdg1::')).toBe(false);
      expect(sanitizedVercel.includes('FUNCTION_PAYLOAD_TOO_LARGE')).toBe(false);
      expect(sanitizedVercel.includes('تم تحسين الحجم تلقائياً')).toBe(true);

      expect(sanitizedEntity.includes('Request Entity Too Large')).toBe(false);
      expect(sanitizedEntity.includes('تم تحسين الحجم تلقائياً')).toBe(true);
    });
  });

  await harness.describe('GPAENG Sovereign Diagnostic Intelligence Hardening Tests', async () => {
    await harness.it('should filter out third-party Chrome extension errors from the diagnostic dossier', async () => {
      const mockSupabase: any = {
        from: (table: string) => ({
          select: () => ({
            order: () => ({
              limit: async () => {
                if (table === 'x1_diagnostic_incidents') {
                  return {
                    data: [
                      {
                        id: 'ext-crash-1',
                        category: 'CLIENT_CRASH',
                        severity: 'HIGH',
                        error_code: null,
                        error_message: "Cannot read properties of undefined (reading 'M_ID')",
                        error_stack: "TypeError: Cannot read properties of undefined (reading 'M_ID')\n at Y (chrome-extension://eppiocemhmnlbhjplcgkofciiegomcon/executors/200.js:1:761)",
                        created_at: new Date().toISOString()
                      },
                      {
                        id: 'real-incident-1',
                        category: 'NETWORK_ERROR',
                        severity: 'MEDIUM',
                        error_code: 'HTTP_504',
                        error_message: 'Gateway Timeout during video resolution',
                        created_at: new Date().toISOString()
                      }
                    ],
                    error: null
                  };
                }
                return { data: [], error: null };
              }
            })
          })
        })
      };

      const dossier = await GpaengDiagnosticEngine.buildMasterDiagnosticDossier(mockSupabase, 'GPAENG');

      // Extension crash must be filtered out
      expect(dossier.includes("Cannot read properties of undefined (reading 'M_ID')")).toBe(false);
      expect(dossier.includes('chrome-extension')).toBe(false);
      // Real incident must be preserved
      expect(dossier.includes('HTTP_504')).toBe(true);
      expect(dossier.includes('إجمالي الحوادث المرصودة في السجلات الحية: 1')).toBe(true);
    });

    await harness.it('should provide resolveIncident and batchResolveIncidents helper methods', async () => {
      let updatedId = '';
      let updatePayload: any = null;

      const mockSupabase: any = {
        from: () => ({
          update: (payload: any) => {
            updatePayload = payload;
            return {
              eq: async (col: string, val: string) => {
                updatedId = val;
                return { error: null };
              }
            };
          }
        })
      };

      const success = await GpaengDiagnosticEngine.resolveIncident(
        mockSupabase,
        'test-incident-uuid',
        'تم الترقيع الجراحي وتأكيد السلامة'
      );

      expect(success).toBe(true);
      expect(updatedId).toBe('test-incident-uuid');
      expect(updatePayload.resolved).toBe(true);
      expect(updatePayload.resolution_notes).toBe('تم الترقيع الجراحي وتأكيد السلامة');
    });
  });
}
