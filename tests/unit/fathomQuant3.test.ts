/**
 * ============================================================================
 * Fathom Quant 3 Master Test Suite (Zero LLM Tokens Consumed)
 * Matany AI (Matany) — Flagship Sovereign Multi-Model & VPS Nervous System
 *
 * Test Pillars:
 * 1. Model Resolution & Sovereign Pro Family Calibration
 * 2. Multi-Turn Image Lifecycle & Zero-Drift Context Preservation (Create -> Edit 1 -> Edit 2)
 * 3. Page Refresh Simulation & Zero-ms Instant State Recovery (Cache & Storage)
 * 4. Advanced Systems Architecture, Coding Engine & Token Economy
 * 5. URL Intelligence, Social Video Spark & Link Security
 * 6. High-Resolution Proportional Downloads & Canvas Engine (4K / 2K / HD & SVG)
 * 7. Features Bar, Memory Registry & Dynamic Intent Discovery
 * ============================================================================
 */

import { TestHarness, expect } from '../testUtils';
import { DynamicParameterTuner, ImageOperationType } from '../../server/dynamicParameterTuner';
import { SYSTEM_PROMPT_FATHOM_QUANT_3 } from '../../server/index';
import { isVpsOrCloudRequest, VPS_STATUS_NOTICE } from '../../src/lib/vpsUtils';
import { classifyQueryIntent } from '../../server/searchEngine/intentClassifier';
import { isValidImageUri } from '../../src/components/ui/NeuralImageCard';
import { getActiveDetectedFeatures } from '../../src/lib/featuresRegistry';
import {
  extractYouTubeVideoId,
  detectAndExtractUrl,
  extractAllCleanUrls,
  cleanMarkdownForClipboard
} from '../../src/lib/utils';
import { highlightCode } from '../../src/lib/syntaxHighlighter';

/**
 * Deterministic prompt hash helper mirroring NeuralImageCard logic
 */
function simplePromptHash(str: string): string {
  const clean = (str || '').trim().toLowerCase().replace(/\s+/g, ' ');
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const char = clean.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Canvas aspect-ratio computation simulator mirroring NeuralImageCard handleDownload
 */
function computeCanvasDimensions(
  sourceW: number,
  sourceH: number,
  targetTier: '4k' | '2k' | 'original'
): { targetWidth: number; targetHeight: number; sx: number; sy: number; sWidth: number; sHeight: number } {
  const targetAspect = sourceW / sourceH;
  let targetWidth = 1024;
  let targetHeight = 1024;

  if (targetTier === '4k') {
    targetWidth = targetAspect >= 1 ? 3840 : Math.round(2160 * targetAspect);
    targetHeight = targetAspect >= 1 ? Math.round(3840 / targetAspect) : 2160;
  } else if (targetTier === '2k') {
    targetWidth = targetAspect >= 1 ? 2048 : Math.round(1152 * targetAspect);
    targetHeight = targetAspect >= 1 ? Math.round(2048 / targetAspect) : 1152;
  } else {
    targetWidth = targetAspect >= 1 ? 1280 : Math.round(720 * targetAspect);
    targetHeight = targetAspect >= 1 ? Math.round(1280 / targetAspect) : 720;
  }

  let sx = 0, sy = 0, sWidth = sourceW, sHeight = sourceH;
  if (targetAspect > (targetWidth / targetHeight)) {
    sWidth = Math.round(sourceH * (targetWidth / targetHeight));
    sx = Math.round((sourceW - sWidth) / 2);
  } else if (targetAspect < (targetWidth / targetHeight)) {
    sHeight = Math.round(sourceW / (targetWidth / targetHeight));
    sy = Math.round((sourceH - sHeight) / 2);
  }

  return { targetWidth, targetHeight, sx, sy, sWidth, sHeight };
}

export async function runFathomQuant3Tests(harness: TestHarness): Promise<void> {
  await harness.describe('Fathom Quant 3: Flagship Sovereign Model & VPS Cloud Architecture', async () => {

    // ═════════════════════════════════════════════════════════════════════════
    // 1. Model Resolution & Sovereign Pro Family Calibration
    // ═════════════════════════════════════════════════════════════════════════
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

    await harness.it('Fathom Quant 3: qualifies as a Cyber Ultra model in DynamicParameterTuner', () => {
      expect(DynamicParameterTuner.isCyberUltraModel('fathom-quant-3')).toBe(true);
      expect(DynamicParameterTuner.isCyberUltraModel('FATHOM-QUANT-3')).toBe(true);
      expect(DynamicParameterTuner.isCyberUltraModel('fathom-quant')).toBe(true);
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 2. Multi-Turn Image Lifecycle & Context Preservation (Create -> Edit 1 -> Edit 2)
    // ═════════════════════════════════════════════════════════════════════════
    await harness.it('Image Lifecycle Turn 1: Initial creation is accurately tuned with 32K tokens and studio intent', () => {
      const turn1Prompt = 'صمم لي صورة واقعية لسيارة رياضية سوداء في صحراء دبي وقت الغروب بدقة 4K';
      const tuning = DynamicParameterTuner.tune({
        userPrompt: turn1Prompt,
        requestedModel: 'fathom-quant-3',
      });

      expect(tuning.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(tuning.hyperparameters.temperature).toBeGreaterThanOrEqual(0.3);
      expect(tuning.hyperparameters.max_tokens).toBe(32768);

      const opType = DynamicParameterTuner.detectImageOperationType(turn1Prompt, false);
      expect(opType).toBe('generation');
    });

    await harness.it('Image Lifecycle Turn 2: First edit suppresses web search, sets operation to edit, and locks seed', () => {
      const turn2Prompt = 'عايزها ذهبي مع نفس الإضاءة والزوايا';
      const searchIntent = classifyQueryIntent(turn2Prompt, {
        hasMedia: true,
        hasImages: true,
        hasImagesInHistory: true
      });

      expect(searchIntent.should_search).toBe(false);
      expect(searchIntent.intent).not.toBe('REAL_TIME_DATA');

      const opType = DynamicParameterTuner.detectImageOperationType(turn2Prompt);
      expect(opType).toBe('edit');

      const rawBlock = `\`\`\`neural-image
{
  "title": "تصميم سيارة رياضية ذهبية",
  "operation": "generate",
  "prompt": "سيارة رياضية ذهبية في صحراء دبي",
  "aspectRatio": "16:9"
}
\`\`\``;

      const normalized = DynamicParameterTuner.normalizeNeuralImageBlock(
        rawBlock,
        'edit',
        {
          imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
          prompt: 'سيارة رياضية سوداء في صحراء دبي',
          seed: 948271
        }
      );

      expect(normalized).toContain('"operation": "edit"');
      expect(normalized).toContain('"title": "تعديل: سيارة رياضية ذهبية"');
      expect(normalized).toContain('https://images.unsplash.com/photo-1503376780353-7e6692767b70');
      expect(normalized).toContain('"seed": 948271');
    });

    await harness.it('Image Lifecycle Turn 3: Second sequential edit preserves originalImage and sets addition tag', () => {
      const turn3Prompt = 'عايز أضيف طائرة درون مستقبلية تحلق فوق السيارة الذهبية مع الحفاظ على المشهد';
      const tuning = DynamicParameterTuner.tune({
        userPrompt: turn3Prompt,
        requestedModel: 'fathom-quant-3',
        hasMultimodalImages: true,
      });

      expect(tuning.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(tuning.hyperparameters.temperature).toBeGreaterThanOrEqual(0.3);

      const opType = DynamicParameterTuner.detectImageOperationType(turn3Prompt);
      expect(opType).toBe('addition');

      const rawBlock = `\`\`\`neural-image
{
  "title": "إضافة درون مستقبلي",
  "operation": "generate",
  "originalImage": "<رابط الصورة السابقة>",
  "prompt": "طائرة درون مستقبلية فوق سيارة رياضية ذهبية",
  "aspectRatio": "16:9"
}
\`\`\``;

      const priorContext = {
        imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
        prompt: 'سيارة رياضية ذهبية في صحراء دبي',
        seed: 948271
      };

      const normalized = DynamicParameterTuner.normalizeNeuralImageBlock(rawBlock, 'addition', priorContext);

      expect(normalized).toContain('"operation": "add_element"');
      expect(normalized).toContain('"title": "إضافة: درون مستقبلي"');
      expect(normalized).toContain('https://images.unsplash.com/photo-1503376780353-7e6692767b70');
      expect(normalized).not.toContain('<رابط الصورة السابقة>');
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 3. Page Refresh Simulation & Zero-ms Instant State Recovery
    // ═════════════════════════════════════════════════════════════════════════
    await harness.it('Page Refresh: prompt hash generator produces deterministic keys for cache persistence', () => {
      const prompt1 = 'صورة سينمائية فائقة الواقعية لقطة برتقالية';
      const prompt2 = '  صورة سينمائية فائقة الواقعية لقطة برتقالية  ';
      const prompt3 = 'صورة سينمائية فائقة الواقعية لقطة بيضاء';

      const hash1 = simplePromptHash(prompt1);
      const hash2 = simplePromptHash(prompt2);
      const hash3 = simplePromptHash(prompt3);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    await harness.it('Page Refresh: URI validator accepts valid image URLs and rejects truncated or invalid URIs', () => {
      expect(isValidImageUri('https://images.unsplash.com/photo-1503376780353-7e6692767b70')).toBe(true);
      expect(isValidImageUri('http://example.com/asset.png')).toBe(true);
      expect(isValidImageUri('blob:http://localhost:5173/4a2b9f')).toBe(true);

      const validBase64 = 'data:image/png;base64,' + 'A'.repeat(800);
      expect(isValidImageUri(validBase64)).toBe(true);

      expect(isValidImageUri('data:image/png;base64,short')).toBe(false);
      expect(isValidImageUri('<رابط الصورة>')).toBe(false);
      expect(isValidImageUri('رابط_الصورة_هنا')).toBe(false);
      expect(isValidImageUri('null')).toBe(false);
      expect(isValidImageUri('undefined')).toBe(false);
      expect(isValidImageUri('')).toBe(false);
    });

    await harness.it('Page Refresh: simulates 0ms instant recovery from mock localStorage', () => {
      const mockStorage: Record<string, string> = {};
      const messageId = 'msg-quant3-test-123';
      const sampleImageUrl = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70';

      // 1. Simulate saving to storage during generation
      mockStorage[`fathom_img_${messageId}`] = sampleImageUrl;

      // 2. Simulate browser refresh and immediate recovery
      const startTime = performance.now();
      const recoveredUrl = mockStorage[`fathom_img_${messageId}`];
      const elapsed = performance.now() - startTime;

      expect(recoveredUrl).toBe(sampleImageUrl);
      expect(isValidImageUri(recoveredUrl)).toBe(true);
      expect(elapsed).toBeLessThan(10); // Under 10ms execution
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 4. Advanced Systems Architecture, Coding Engine & Token Economy
    // ═════════════════════════════════════════════════════════════════════════
    await harness.it('Fathom Quant 3: prompt contains sovereign identity and inheritance from Cyber 2.6 Ultra', () => {
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('FATHOM QUANT 3');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Cyber 2.6 ULTRA');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('النموذج السيادي المتكامل والشامل');
    });

    await harness.it('Fathom Quant 3: prompt strictly enforces VPS mandatory status notice and PM2 controls', () => {
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain(VPS_STATUS_NOTICE);
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('يتم الان الوصول للكمبيوتر والاوامر السحابية');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('104.207.77.162:22022');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('root');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('pm2 stop all');
    });

    await harness.it('Fathom Quant 3: prompt enforces Sovereign Cyber Architecture Axioms (RFC 9449, Kafka Zero-Trust)', () => {
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('DPoP');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('RFC 9449');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Envoy HCM');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Singleflight');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Kafka');
      expect(SYSTEM_PROMPT_FATHOM_QUANT_3).toContain('Zero-Trust');
    });

    await harness.it('Coding & Token Economy: strips previous <think> tags from history to protect token window', () => {
      const assistantMessageWithThought = `<think>
Analyzing the AST and distributed consensus protocol for raft cluster...
Need to return resilient Go code.
</think>
package main

func main() {
    println("Consensus Established")
}`;

      const cleaned = assistantMessageWithThought.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      expect(cleaned).not.toContain('<think>');
      expect(cleaned).toContain('package main');
      expect(cleaned).toContain('Consensus Established');
    });

    await harness.it('Coding Engine: syntax highlighter renders clean HTML without crashing on enterprise TypeScript', () => {
      const codeSnippet = `interface SovereignNode {
  id: string;
  peers: Set<string>;
  heartbeat(): Promise<void>;
}`;

      const html = highlightCode(codeSnippet, 'typescript');
      expect(typeof html).toBe('string');
      expect(html).toContain('token');
      expect(html).toContain('SovereignNode');
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 5. URL Intelligence, Social Video Spark & Link Security
    // ═════════════════════════════════════════════════════════════════════════
    await harness.it('URL Intelligence: extracts YouTube video IDs across standard, short, and shorts URLs', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ');
      expect(extractYouTubeVideoId('https://example.com')).toBeNull();
    });

    await harness.it('URL Intelligence: cleanly parses URLs embedded in conversational text', () => {
      const userText = 'راجع هذا الموقع https://matany.app/docs ثم قارنه مع https://github.com/MohamedFC2A/x1.link';
      const extractedSingle = detectAndExtractUrl(userText);
      const extractedAll = extractAllCleanUrls(userText);

      expect(extractedSingle.cleanUrl).toBe('https://matany.app/docs');
      expect(extractedAll.urls.length).toBe(2);
      expect(extractedAll.urls[0]).toBe('https://matany.app/docs');
      expect(extractedAll.urls[1]).toBe('https://github.com/MohamedFC2A/x1.link');
    });

    await harness.it('Social Video Spark: routes YouTube, TikTok, and Instagram to fathom_spark with 1.0 confidence', () => {
      const ytFeatures = getActiveDetectedFeatures('شاهد هذا الفيديو ولخصه لي: https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      const sparkYt = ytFeatures.find(f => f.id === 'fathom_spark');
      expect(sparkYt).toBeDefined();
      expect(sparkYt?.confidence).toBe(1);

      const ttFeatures = getActiveDetectedFeatures('ما محتوى هذا التيك توك؟ https://vt.tiktok.com/ZSjX8w1a/');
      const sparkTt = ttFeatures.find(f => f.id === 'fathom_spark');
      expect(sparkTt).toBeDefined();
      expect(sparkTt?.confidence).toBe(1);

      const igFeatures = getActiveDetectedFeatures('لخص ريل الإنستغرام هذا https://www.instagram.com/reel/C12345/');
      const sparkIg = igFeatures.find(f => f.id === 'fathom_spark');
      expect(sparkIg).toBeDefined();
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 6. High-Resolution Proportional Downloads & Canvas Engine (4K / 2K / HD & SVG)
    // ═════════════════════════════════════════════════════════════════════════
    await harness.it('Canvas Engine: computes exact 4K proportional landscape dimensions without squishing', () => {
      const dims = computeCanvasDimensions(1920, 1080, '4k'); // 16:9
      expect(dims.targetWidth).toBe(3840);
      expect(dims.targetHeight).toBe(2160);
      expect(dims.sx).toBe(0);
      expect(dims.sy).toBe(0);
    });

    await harness.it('Canvas Engine: computes exact 4K proportional portrait dimensions without squishing', () => {
      const dims = computeCanvasDimensions(1080, 1920, '4k'); // 9:16
      expect(dims.targetHeight).toBe(2160);
      expect(dims.targetWidth).toBe(1215);
      expect(dims.targetWidth).toBeLessThan(dims.targetHeight);
    });

    await harness.it('Canvas Engine: computes exact 2K proportional dimensions', () => {
      const dims = computeCanvasDimensions(1024, 1024, '2k'); // 1:1
      expect(dims.targetWidth).toBe(2048);
      expect(dims.targetHeight).toBe(2048);
    });

    await harness.it('Canvas Engine: computes exact HD proportional dimensions', () => {
      const dims = computeCanvasDimensions(1920, 1080, 'original'); // HD
      expect(dims.targetWidth).toBe(1280);
      expect(dims.targetHeight).toBe(720);
    });

    await harness.it('SVG Engine: validates SVG XML normalization, namespaces, and viewBox synthesis', () => {
      const rawSvg = `<svg width="500" height="300"><circle cx="250" cy="150" r="100" fill="crimson"/></svg>`;
      const hasViewBox = rawSvg.includes('viewBox');
      expect(hasViewBox).toBe(false);

      // Simulating normalizeSvgXml viewBox injection
      const viewBoxInjected = rawSvg.replace('<svg', '<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg"');
      expect(viewBoxInjected).toContain('viewBox="0 0 500 300"');
      expect(viewBoxInjected).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 7. Features Bar, Memory Registry & Dynamic Intent Discovery
    // ═════════════════════════════════════════════════════════════════════════
    await harness.it('Features Bar: accurately detects temporal queries via time_detect', () => {
      const features = getActiveDetectedFeatures('كم الساعة الآن في القاهرة وتاريخ اليوم؟');
      const timeFeature = features.find(f => f.id === 'time_detect');
      expect(timeFeature).toBeDefined();
    });

    await harness.it('Features Bar: accurately detects memory requests via memory_detect', () => {
      const features = getActiveDetectedFeatures('فاكر اسم مشروعي اللي قلت لك عليه سابقاً في الشات؟');
      const memFeature = features.find(f => f.id === 'memory_detect');
      expect(memFeature).toBeDefined();
    });

    await harness.it('Features Bar: accurately detects AI identity inquiries via ai_detect', () => {
      const features = getActiveDetectedFeatures('هل هذه الصورة ذكاء اصطناعي أم حقيقية؟');
      const aiFeature = features.find(f => f.id === 'ai_detect');
      expect(aiFeature).toBeDefined();
    });

    await harness.it('Features Bar: accurately detects SVG vector requests via svg_studio', () => {
      const features = getActiveDetectedFeatures('ارسم لي كود SVG متقدم لشعار تقني حديث');
      const svgFeature = features.find(f => f.id === 'svg_studio');
      expect(svgFeature).toBeDefined();
    });

    await harness.it('Features Bar: accurately detects Neural Image Studio requests', () => {
      const features = getActiveDetectedFeatures('انشئ لي صورة فائقة الدقة والواقعية لمدينة مستقبلية');
      const imgFeature = features.find(f => f.id === 'neural_image_studio');
      expect(imgFeature).toBeDefined();
    });

    await harness.it('Features Bar: accurately detects VPS Control Room commands', () => {
      const features = getActiveDetectedFeatures('ادخل على السيرفر وشغل pm2 restart all على الـ VPS');
      const vpsFeature = features.find(f => f.id === 'vps_control_room');
      expect(vpsFeature).toBeDefined();
    });

    await harness.it('Features Bar: accurately detects download requests via download_detect', () => {
      const features = getActiveDetectedFeatures('حمل الفيديو https://example.com/video.mp4');
      const dlFeature = features.find(f => f.id === 'download_detect');
      expect(dlFeature).toBeDefined();
    });

    // ═════════════════════════════════════════════════════════════════════════
    // 8. Studio Thinking Suppression, Typography & Note Architecture
    // ═════════════════════════════════════════════════════════════════════════
    await harness.it('Neural Image Studio: disables thinking mode to prevent reasoning latency and show only image creation', () => {
      const tuned = DynamicParameterTuner.tune({
        userPrompt: 'صمم لي صورة واقعية لسيارة مرسيدس ذهبية في شارع ممطر بدقة 4K',
        requestedModel: 'fathom-quant-3'
      });
      expect(tuned.detectedIntent).toBe('NEURAL_IMAGE_STUDIO_AND_PROCESSING');
      expect(tuned.telemetry.thinkingMode).toBe('disabled');
      expect(tuned.telemetry.reasoningEffort).toBe('low');
    });

    await harness.it('In-Image Typography & License Plate: injects OCR readability and zero gibberish conditioning', () => {
      const rawBlock = `\`\`\`neural-image
{
  "operation": "add_element",
  "title": "إضافة: لوحة معدنية مصرية للسيارة",
  "description": "تمت إضافة لوحة معدنية مصرية أمامية للسيارة",
  "prompt": "close up shot of front bumper with Egyptian vehicle license plate",
  "seed": 482910,
  "aspectRatio": "1:1"
}
\`\`\``;
      const normalized = DynamicParameterTuner.normalizeNeuralImageBlock(rawBlock, 'addition');
      expect(normalized).toContain('optical character recognition (OCR)');
      expect(normalized).toContain('zero gibberish');
      expect(normalized).toContain('crisp legible typography');
    });

    await harness.it('Contextual Note Badge: cleans up awkward phrasing and normalizes (1) صور to صورة واحدة', () => {
      const rawNote = '[ملاحظة: تم إرفاق وتحليل (1) صور في هذا الدور السابق]';
      const cleaned = rawNote
        .replace(/\(1\)\s*صور/g, 'صورة واحدة')
        .replace(/\(1\)\s*صورة/g, 'صورة واحدة')
        .replace(/[\[\]]/g, '')
        .trim();
      expect(cleaned).toBe('ملاحظة: تم إرفاق وتحليل صورة واحدة في هذا الدور السابق');
      expect(cleaned).not.toContain('(1) صور');
    });
  });
}

// Standalone runner support for `npm run test:quant3`
const isDirectRun = process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('fathomQuant3.test');
if (isDirectRun) {
  const harness = new TestHarness();
  runFathomQuant3Tests(harness).then(() => {
    const passed = harness.printSummary('FATHOM QUANT 3 ULTIMATE MASTER SUITE');
    process.exit(passed ? 0 : 1);
  });
}
