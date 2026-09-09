/**
 * Unit Tests: GPAENG Sovereign Autonomous Diagnostic & Remediation Engine
 * Matany AI (Matany)
 */

import { TestHarness, expect } from '../testUtils';
import { GpaengDiagnosticEngine } from '../../server/gpaengDiagnosticEngine';
import { DynamicParameterTuner } from '../../server/dynamicParameterTuner';

export async function runGpaengDiagnosticTests(harness: TestHarness) {
  await harness.describe('GPAENG Sovereign Diagnostic Engine Tests', async () => {
    await harness.it('should accurately detect GPAENG trigger keyword across case variations and contextual sentences', () => {
      expect(GpaengDiagnosticEngine.isGpaengTrigger('GPAENG')).toBe(true);
      expect(GpaengDiagnosticEngine.isGpaengTrigger('gpaeng')).toBe(true);
      expect(GpaengDiagnosticEngine.isGpaengTrigger('Gpaeng')).toBe(true);
      expect(GpaengDiagnosticEngine.isGpaengTrigger('شخص المشاكل كاملة الآن GPAENG')).toBe(true);
      expect(GpaengDiagnosticEngine.isGpaengTrigger('ابحث واعمل تقرير تشخيصي gpaeng فوراً')).toBe(true);
      expect(GpaengDiagnosticEngine.isGpaengTrigger('Give me an RCA report for GPAENG')).toBe(true);
    });

    await harness.it('should reject unrelated words and sub-strings to prevent false positives', () => {
      expect(GpaengDiagnosticEngine.isGpaengTrigger('PENGUIN')).toBe(false);
      expect(GpaengDiagnosticEngine.isGpaengTrigger('ENGINEERING')).toBe(false);
      expect(GpaengDiagnosticEngine.isGpaengTrigger('GAP')).toBe(false);
      expect(GpaengDiagnosticEngine.isGpaengTrigger('ENG')).toBe(false);
      expect(GpaengDiagnosticEngine.isGpaengTrigger('صباح الخير كيف حالك')).toBe(false);
    });

    await harness.it('should classify GPAENG as SYSTEM_DIAGNOSTIC_GPAENG with absolute priority and calibrated hyperparameters', () => {
      const prompt = 'شخص المشاكل بتاعت المستخدم كاملة واعمل خطة علاجية GPAENG';
      const result = DynamicParameterTuner.tune({
        userPrompt: prompt,
        requestedModel: 'deepseek-v4-flash',
        conversationHistory: []
      });

      expect(result.detectedIntent).toBe('SYSTEM_DIAGNOSTIC_GPAENG');
      expect(result.intentConfidence).toBe(1.0);
      expect(result.complexityLevel).toBe('EXHAUSTIVE_ARCHITECTURAL');
      expect(result.hyperparameters.temperature).toBe(0.15);
      expect(result.hyperparameters.max_tokens).toBe(32768);
      expect(result.calibrationDirective.includes('GPAENG')).toBe(true);
    });

    await harness.it('should generate a structured master diagnostic dossier from incident data', async () => {
      // Mock Supabase client simulating real incident extraction
      const mockSupabase: any = {
        from: (table: string) => ({
          select: () => ({
            order: () => ({
              limit: async () => {
                if (table === 'x1_diagnostic_incidents') {
                  return {
                    data: [
                      {
                        id: 'test-inc-1',
                        category: 'TOOL_FAILURE',
                        severity: 'HIGH',
                        error_code: 'YOUTUBE_FETCH_TIMEOUT',
                        error_message: 'Transcript request exceeded timeout limit',
                        user_prompt: 'لخص لي هذا الفيديو الطويل',
                        model_used: 'deepseek-v4-flash',
                        endpoint: '/api/chat',
                        device_info: { os: 'iOS', browser: 'Safari' },
                        created_at: new Date().toISOString()
                      },
                      {
                        id: 'test-inc-2',
                        category: 'USER_FRICTION_REPROMPT',
                        severity: 'MEDIUM',
                        error_code: 'INCOMPLETE_SVG',
                        error_message: 'User complained about truncated SVG tags',
                        user_prompt: 'كود الـ SVG مش كامل طلعه كامل',
                        model_used: 'deepseek-v4-flash',
                        endpoint: '/api/chat',
                        device_info: { os: 'Windows', browser: 'Chrome' },
                        created_at: new Date().toISOString()
                      }
                    ],
                    error: null
                  };
                }
                if (table === 'x1_system_lessons') {
                  return {
                    data: [
                      {
                        id: 'lesson-1',
                        incident_category: 'TOOL_FAILURE',
                        trigger_signature: 'long_youtube_video',
                        distilled_rule: 'Use fast chunk parser when video exceeds 30 minutes',
                        remediation_action: 'TOOL_FALLBACK',
                        times_triggered: 3
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

      expect(dossier.includes('GPAENG SOVEREIGN SYSTEM DIAGNOSTIC DOSSIER')).toBe(true);
      expect(dossier.includes('إجمالي الحوادث المرصودة في السجلات الحية: 2')).toBe(true);
      expect(dossier.includes('YOUTUBE_FETCH_TIMEOUT')).toBe(true);
      expect(dossier.includes('INCOMPLETE_SVG')).toBe(true);
      expect(dossier.includes('القسم الأول: التقرير الإحصائي العام لحالة المنظومة')).toBe(true);
      expect(dossier.includes('القسم الثاني: التحليل الجذري الفني العميق')).toBe(true);
      expect(dossier.includes('القسم الثالث: مصفوفة تقييم الأثر وحجم المخاطر')).toBe(true);
      expect(dossier.includes('القسم الرابع: خطة العمل الهندسية الاحترافية الشاملة')).toBe(true);
      expect(dossier.includes('القسم الخامس: الترقيعات البرمجية والأكواد الجراحية المقترحة')).toBe(true);
    });

    await harness.it('should safely record an incident without throwing exceptions', async () => {
      let insertedRow: any = null;
      const mockSupabase: any = {
        from: () => ({
          insert: async (data: any) => {
            insertedRow = data;
            return { error: null };
          }
        })
      };

      const success = await GpaengDiagnosticEngine.recordIncident(mockSupabase, {
        category: 'NETWORK_ERROR',
        severity: 'HIGH',
        errorMessage: 'Connection reset by peer',
        endpoint: '/api/chat',
        user_prompt: 'اختبر النظام'
      });

      expect(success).toBe(true);
      expect(insertedRow.category).toBe('NETWORK_ERROR');
      expect(insertedRow.severity).toBe('HIGH');
      expect(insertedRow.error_message).toBe('Connection reset by peer');
    });
  });
}
