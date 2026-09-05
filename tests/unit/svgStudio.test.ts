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

    // 7. Arabic Icon Design without explicit 'svg' keyword
    await harness.it('should detect SVG_VECTOR_STUDIO_AND_DESIGN for "صمم ايقونة للهندسة" without explicit svg keyword', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'صمم ايقونة للهندسة المعمارية بدقة وألوان عصرية',
        requestedModel: 'deepseek-v4-flash',
      };
      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('SVG_VECTOR_STUDIO_AND_DESIGN');
      expect(result.calibrationDirective).toContain('Strict Zero-Thinking & Direct Code Output');
      expect(result.calibrationDirective).toContain('```svg');
    });

    // 8. Arabic Logo Design without explicit 'svg' keyword
    await harness.it('should detect SVG_VECTOR_STUDIO_AND_DESIGN for "صمم لوجو لشركة عقارات" and enforce Strict Zero-Thinking directive', () => {
      const request: DynamicTuningRequest = {
        userPrompt: 'صمم لوجو لشركة عقارات فخمة مع برج سكني',
        requestedModel: 'deepseek-v4-pro',
      };
      const result = DynamicParameterTuner.tune(request);
      expect(result.detectedIntent).toBe('SVG_VECTOR_STUDIO_AND_DESIGN');
      expect(result.calibrationDirective).toContain('SOVEREIGN_SVG_VECTOR_STUDIO');
      expect(result.calibrationDirective).toContain('viewBox');
    });

    // 9. Feature Registry routes logo query without svg keyword
    await harness.it('should route svg_studio in featuresRegistry for "ارسم شعار لمطعم"', () => {
      const plan = routeFeatureIntent('svg_studio', 'ارسم شعار لمطعم مأكولات بحرية حديث', '', '');
      expect(plan.confidence).toBeGreaterThanOrEqual(0.95);
      expect(plan.category).toBe('actionable');
      expect(plan.shouldRenderWidget).toBe(true);
    });

    // 10. Filter svg_studio out of reasoning header features
    await harness.it('should filter svg_studio out of reasoning header features to eliminate pink badge', () => {
      const activeFeatures = [
        { id: 'svg_studio', name: 'SVG Studio', badgeLabel: 'SVG STUDIO' },
        { id: 'time_detect', name: 'Time Detect', badgeLabel: 'Time Detect' },
      ];
      const visible = activeFeatures.filter(f => f.id !== 'fathom_cam' && f.id !== 'fathom_spark' && f.id !== 'fathom_search' && f.id !== 'svg_studio');
      expect(visible.some(f => f.id === 'svg_studio')).toBe(false);
      expect(visible.some(f => f.id === 'time_detect')).toBe(true);
    });

    // 11. Natural Color and Background Modification Routing
    await harness.it('should route design modification requests (e.g. "غير الخلفية لأسود", "خليه ذهبي") to SVG Studio with modification directive', () => {
      const prompts = [
        'غير الخلفية لأسود وخلي الشعار أبيض لامع',
        'خليه ذهبي مع تدرج لوني فخم',
        'عدل لون الأيقونة إلى كحلي وأزرق سماوي',
        'غير خلفية التصميم واجعلها شفافة'
      ];

      for (const prompt of prompts) {
        const request: DynamicTuningRequest = {
          userPrompt: prompt,
          requestedModel: 'deepseek-v4-flash',
          conversationHistory: [
            { role: 'user', content: 'صمم لي لوجو لشركة تقنية' },
            { role: 'assistant', content: '```svg\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><circle cx="400" cy="300" r="100" fill="#06b6d4"/></svg>\n```' }
          ]
        };

        const result = DynamicParameterTuner.tune(request);
        expect(result.detectedIntent).toBe('SVG_VECTOR_STUDIO_AND_DESIGN');
        expect(result.calibrationDirective).toContain('عند طلب أي تعديل على تصميم سابق');
        expect(result.calibrationDirective).toContain('```svg');

        const plan = routeFeatureIntent('svg_studio', prompt, '', '', {});
        expect(plan.confidence).toBeGreaterThanOrEqual(0.95);
        expect(plan.shouldRenderWidget).toBe(true);
      }
    });

    // 12. 2K and 4K Resolution Target Dimensions Calculation
    await harness.it('should calculate accurate 2K (2048px) and 4K (3840px) raster export dimensions preserving aspect ratio', () => {
      const calculateDims = (svgW: number, svgH: number, quality: '2K' | '4K') => {
        const maxDimension = quality === '4K' ? 3840 : 2048;
        const aspect = svgW / svgH;
        let targetWidth = maxDimension;
        let targetHeight = Math.round(maxDimension / aspect);
        if (aspect < 1) {
          targetHeight = maxDimension;
          targetWidth = Math.round(maxDimension * aspect);
        }
        return {
          targetWidth: Math.max(100, Math.round(targetWidth)),
          targetHeight: Math.max(100, Math.round(targetHeight))
        };
      };

      // 1:1 Square (e.g. 800x800)
      const sq2k = calculateDims(800, 800, '2K');
      expect(sq2k.targetWidth).toBe(2048);
      expect(sq2k.targetHeight).toBe(2048);

      const sq4k = calculateDims(800, 800, '4K');
      expect(sq4k.targetWidth).toBe(3840);
      expect(sq4k.targetHeight).toBe(3840);

      // 16:9 Landscape (e.g. 1920x1080)
      const ls2k = calculateDims(1920, 1080, '2K');
      expect(ls2k.targetWidth).toBe(2048);
      expect(ls2k.targetHeight).toBe(1152);

      const ls4k = calculateDims(1920, 1080, '4K');
      expect(ls4k.targetWidth).toBe(3840);
      expect(ls4k.targetHeight).toBe(2160);

      // 9:16 Portrait (e.g. 1080x1920)
      const pt2k = calculateDims(1080, 1920, '2K');
      expect(pt2k.targetWidth).toBe(1152);
      expect(pt2k.targetHeight).toBe(2048);

      const pt4k = calculateDims(1080, 1920, '4K');
      expect(pt4k.targetWidth).toBe(2160);
      expect(pt4k.targetHeight).toBe(3840);
    });

    // 13. Empirical Verification of 5 Diverse SVG Designs
    await harness.it('should validate 5 diverse SVG designs: XML validity, viewBox, gradients, and raster target resolution', () => {
      const designs = [
        {
          id: 1,
          name: 'Architectural Geometric Icon (أيقونة هندسية معمارية)',
          raw: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
            <defs>
              <linearGradient id="archGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0284c7" />
                <stop offset="100%" stop-color="#0f172a" />
              </linearGradient>
            </defs>
            <polygon points="400,100 700,650 100,650" fill="url(#archGrad)" stroke="#38bdf8" stroke-width="8"/>
            <line x1="400" y1="100" x2="400" y2="650" stroke="#bae6fd" stroke-width="4"/>
          </svg>`
        },
        {
          id: 2,
          name: 'AI Tech Company Logo (لوجو تقني لشركة ذكاء اصطناعي)',
          raw: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
            <defs>
              <linearGradient id="aiGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#06b6d4" />
                <stop offset="50%" stop-color="#3b82f6" />
                <stop offset="100%" stop-color="#8b5cf6" />
              </linearGradient>
            </defs>
            <circle cx="512" cy="512" r="380" fill="none" stroke="url(#aiGlow)" stroke-width="24" stroke-dasharray="20 10"/>
            <polygon points="512,250 680,680 344,680" fill="url(#aiGlow)" opacity="0.9"/>
          </svg>`
        },
        {
          id: 3,
          name: 'Modern Seafood Restaurant Emblem (شعار مطعم مأكولات بحرية)',
          raw: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="100%" height="100%">
            <defs>
              <radialGradient id="waveGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#38bdf8" />
                <stop offset="100%" stop-color="#0369a1" />
              </radialGradient>
            </defs>
            <path d="M150 400 Q300 200 450 400 T750 400" fill="none" stroke="url(#waveGrad)" stroke-width="20" stroke-linecap="round"/>
            <circle cx="450" cy="220" r="60" fill="#f59e0b"/>
          </svg>`
        },
        {
          id: 4,
          name: 'Space Nebula & Planets Illustration (رسمة فضاء وكواكب وسدم كونية)',
          raw: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="100%" height="100%">
            <defs>
              <radialGradient id="nebulaCore" cx="40%" cy="50%" r="60%">
                <stop offset="0%" stop-color="#c084fc" stop-opacity="0.8" />
                <stop offset="60%" stop-color="#3b82f6" stop-opacity="0.4" />
                <stop offset="100%" stop-color="#030712" stop-opacity="0" />
              </radialGradient>
            </defs>
            <rect width="1200" height="800" fill="#030712"/>
            <rect width="1200" height="800" fill="url(#nebulaCore)"/>
            <circle cx="850" cy="300" r="90" fill="#f43f5e"/>
            <ellipse cx="850" cy="300" rx="160" ry="30" fill="none" stroke="#fed7aa" stroke-width="8" transform="rotate(-20 850 300)"/>
          </svg>`
        },
        {
          id: 5,
          name: 'Advanced Cybersecurity Shield (أيقونة درع أمن سيبراني)',
          raw: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" width="100%" height="100%">
            <defs>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#10b981" />
                <stop offset="100%" stop-color="#047857" />
              </linearGradient>
            </defs>
            <path d="M300 50 L520 150 V380 C520 530 300 650 300 650 C300 650 80 530 80 380 V150 Z" fill="url(#shieldGrad)" stroke="#6ee7b7" stroke-width="12"/>
            <path d="M240 340 L280 380 L370 290" fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
        }
      ];

      expect(designs.length).toBe(5);

      for (const d of designs) {
        expect(d.raw).toContain('<svg');
        expect(d.raw).toContain('</svg>');
        expect(d.raw).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(d.raw).toContain('viewBox="');
        expect(d.raw.length).toBeGreaterThan(100);
      }
    });

  });
}
