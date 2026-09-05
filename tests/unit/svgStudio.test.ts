/**
 * Unit Tests: SVG Vector Studio & High-Res PNG Exporter Engine
 * Matany AI (Matany) — Sovereign Multi-Model Architecture
 */

import { TestHarness, expect } from '../testUtils';
import { DynamicParameterTuner, type DynamicTuningRequest } from '../../server/dynamicParameterTuner';
import { detectIntentsMulti, routeFeatureIntent } from '../../src/lib/featuresRegistry';

export async function runSvgStudioTests(harness: TestHarness) {
  await harness.describe('SVG Vector Studio & Dynamic Model Tuning Suite', async () => {

    // 1. Arabic SVG Logo Request
    await harness.it('should detect SVG_VECTOR_STUDIO_AND_DESIGN with Arabic SVG logo query', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'صمم لي شعار تقني عصري وفاخر لشركة برمجيات بتقنية SVG مع تدرجات نيون وإضاءة ناعمة',
        requestedModel: 'deepseek-v4-pro-cyber-2.6',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('SVG_VECTOR_STUDIO_AND_DESIGN');
      expect(result.targetModelFamily).toBe('deepseek-pro');
      expect(result.hyperparameters.temperature).toBe(0.38);
      expect(result.hyperparameters.max_tokens).toBe(24576);
      expect(result.calibrationDirective).toContain('SOVEREIGN_SVG_VECTOR_STUDIO');
      expect(result.calibrationDirective).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(result.calibrationDirective).toContain('viewBox');
    });

    // 2. Arabic Vector Illustration Request
    await harness.it('should detect SVG intent with Arabic vector drawing prompt and tune flash model', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'ارسم لي رسمة فيكتور svg لمشهد فضاء وسدم كونية مع كواكب وكويكبات مضيئة بتفاصيل متناهية',
        requestedModel: 'deepseek-v4-flash',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('SVG_VECTOR_STUDIO_AND_DESIGN');
      expect(result.targetModelFamily).toBe('deepseek-flash');
      expect(result.hyperparameters.temperature).toBe(0.38);
      expect(result.hyperparameters.max_tokens).toBe(16384);
      expect(result.calibrationDirective).toContain('SOVEREIGN_SVG_VECTOR_STUDIO');
    });

    // 3. English Vector Art & Logo Request
    await harness.it('should detect SVG intent with English queries and calibrate Muse Spark', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'create modern vector art in svg format for a cybernetic owl emblem with gold and purple linear gradients',
        requestedModel: 'meta/muse-spark-1.2-contributor',
      };

      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('SVG_VECTOR_STUDIO_AND_DESIGN');
      expect(result.targetModelFamily).toBe('muse-spark');
      expect(result.hyperparameters.temperature).toBe(0.38);
      expect(result.calibrationDirective).toContain('SOVEREIGN_SVG_VECTOR_STUDIO');
    });

    // 4. Feature Registry Multi-Intent Routing for svg_studio
    await harness.it('should route svg_studio intent with high confidence when prompt asks for SVG design', () => {
      const plan = routeFeatureIntent('svg_studio', 'صمم لي أيقونة درع سيبراني بصيغة svg مع ألوان نيون', '', '');
      expect(plan.confidence).toBeGreaterThanOrEqual(0.95);
      expect(plan.category).toBe('actionable');
      expect(plan.shouldRenderWidget).toBe(true);
    });

    // 5. Feature Registry Detection when Assistant Content Contains SVG Code Block
    await harness.it('should route svg_studio when assistant content contains ```svg code block', () => {
      const assistantContent = 'إليك تصميم الشعار المطلوب:\n\n```svg\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%"><circle cx="400" cy="300" r="100" fill="#f43f5e"/></svg>\n```';
      const plan = routeFeatureIntent('svg_studio', 'كيف يبدو الشعار؟', '', assistantContent);
      expect(plan.confidence).toBe(1.0);
      expect(plan.category).toBe('actionable');
      expect(plan.shouldRenderWidget).toBe(true);
    });

    // 6. Multi-Intent Arbiter Pipeline Order
    await harness.it('should include svg_studio in active features and execution pipeline order in detectIntentsMulti', () => {
      const multi = detectIntentsMulti('صمم لي رسمة فيكتور svg لشعار تقني حديث قابل للتنزيل كـ png');
      const hasSvgStudio = multi.activeFeatures.some(f => f.id === 'svg_studio');
      expect(hasSvgStudio).toBe(true);
      expect(multi.executionPipelineOrder).toContain('svg_studio');
    });

  });
}
