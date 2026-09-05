/**
 * Fathom Quant 3 Unit Test Suite (Zero LLM Tokens Consumed)
 * Matany AI (Matany) — Flagship Sovereign Multi-Model & VPS Nervous System
 */

import { TestHarness, expect } from '../testUtils';
import { DynamicParameterTuner } from '../../server/dynamicParameterTuner';
import { SYSTEM_PROMPT_FATHOM_QUANT_3 } from '../../server/index';
import { isVpsOrCloudRequest, VPS_STATUS_NOTICE } from '../../src/lib/vpsUtils';

export async function runFathomQuant3Tests(harness: TestHarness): Promise<void> {
  await harness.describe('Fathom Quant 3: Flagship Sovereign Model & VPS Cloud Architecture', async () => {

    // ─── 1. Model Resolution & Sovereign Pro Family ─────────────────────────
    await harness.it('Fathom Quant 3: resolves family as deepseek-pro and provisions full 32K token budget', () => {
      const family = DynamicParameterTuner.resolveModelFamily('fathom-quant-3');
      expect(family).toBe('deepseek-pro');

      const tuning = DynamicParameterTuner.tune({
        userPrompt: 'صمم لي بنية معمارية متكاملة لشبكة عصبية مع تحكم كامل بالخادم',
        requestedModel: 'fathom-quant-3',
      });

      expect(tuning.targetModelFamily).toBe('deepseek-pro');
      expect(tuning.hyperparameters.max_tokens).toBe(32768);
    });

    await harness.it('Fathom Quant 3: variants like quant-3 or fathom-quant map to deepseek-pro', () => {
      expect(DynamicParameterTuner.resolveModelFamily('quant-3')).toBe('deepseek-pro');
      expect(DynamicParameterTuner.resolveModelFamily('fathom-quant')).toBe('deepseek-pro');
    });

    // ─── 2. System Instruction & Core Directives Invariants ─────────────────
    await harness.it('Fathom Quant 3: prompt contains sovereign identity and inheritance from Cyber 2.6 Ultra', () => {
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('FATHOM QUANT 3');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Cyber 2.6 ULTRA');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('النموذج السيادي المتكامل والشامل');
    });

    await harness.it('Fathom Quant 3: prompt strictly enforces VPS mandatory status notice', () => {
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain(VPS_STATUS_NOTICE);
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('يتم الان الوصول للكمبيوتر والاوامر السحابية');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('104.207.77.162:22022');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('root');
    });

    await harness.it('Fathom Quant 3: prompt reflects paused automation state (pm2 stop all)', () => {
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('pm2 stop all');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('تم إيقاف كافة برمجيات الأتمتة السابقة مؤقتاً');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('[VPS_CONTROL_ROOM: live]');
    });

    await harness.it('Fathom Quant 3: prompt contains Photorealistic Synthesis and Surgical Contextual Image Editing', () => {
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Photorealistic Image Synthesis');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Surgical Contextual Image Editing');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('استوديو SVG السيادي');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('100%');
    });

    await harness.it('Fathom Quant 3: prompt enforces Sovereign Cyber Architecture Axioms (RFC 9449, Kafka Zero-Trust)', () => {
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('DPoP');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('RFC 9449');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Envoy HCM');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Singleflight');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Kafka');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Zero-Trust');
    });

    // ─── 3. Dynamic Tuning for Visual and SVG Tasks under Fathom Quant 3 ──────
    await harness.it('Fathom Quant 3: tunes parameters for photorealistic image prompts', () => {
      const result = DynamicParameterTuner.tune({
        userPrompt: 'صمم لي صورة فائقة الواقعية من الصفر لرجل فضاء على كوكب المريخ بدقة سينمائية',
        requestedModel: 'fathom-quant-3',
      });

      expect(result.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(result.hyperparameters.temperature).toBeGreaterThanOrEqual(0.3);
      expect(result.hyperparameters.max_tokens).toBe(32768);
    });

    await harness.it('Fathom Quant 3: tunes parameters for surgical contextual image editing', () => {
      const result = DynamicParameterTuner.tune({
        userPrompt: 'عدل لي هذه الصورة واستبدل الخلفية بشاطئ استوائي مع الإبقاء على الشخص بدقة 100%',
        requestedModel: 'fathom-quant-3',
        hasMultimodalImages: true,
      });

      expect(result.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(result.hyperparameters.temperature).toBeGreaterThanOrEqual(0.3);
      expect(result.hyperparameters.max_tokens).toBe(32768);
    });
  });
}
