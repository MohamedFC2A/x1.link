/**
 * FATHOM Ultra Multimodal Video Vision, Temporal Memory & Cross-Modal Engine
 * -------------------------------------------------------------------------
 * Implements the complete 5-Pillar Video Intelligence Architecture:
 *   1. Video Vision & Multi-Keyframe Extraction (YouTube + TikTok)
 *   2. Frame-Level Understanding & Micro-OCR (Unspoken Visual Details, Numbers, Tools, Specs)
 *   3. Temporal Visual Memory & State Transitions (Initial State → Progression → Final State)
 *   4. Audio/Visual Cross-Referencing (Synchronizing Spoken Monologue with Visual Reality by Timestamp)
 *   5. Seamless Multimodal AI Injection & Direct Vision Model Routing
 */

import type { TimestampedBlock, YouTubeTranscriptResult } from './youtubeTranscript';

export interface VideoKeyframe {
  label: string;
  url: string;
  timestampSec: number;
  timestampFormatted: string;
}

export interface VideoVisionResult {
  videoId: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'generic';
  visualAnalysisAr: string;
  unspokenDetails: string[];
  temporalTransitions: {
    initialState: string;
    intermediateTransitions: string;
    finalState: string;
  };
  keyframes: VideoKeyframe[];
  analyzedAt: number;
  cached?: boolean;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const videoVisionCache = new Map<string, { result: VideoVisionResult; expiresAt: number }>();

function getCachedVision(key: string): VideoVisionResult | null {
  const entry = videoVisionCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    videoVisionCache.delete(key);
    return null;
  }
  return { ...entry.result, cached: true };
}

function setCachedVision(key: string, result: VideoVisionResult): void {
  videoVisionCache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS });
}

function formatSecs(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─── 1. Keyframe Extraction with Temporal Timestamps ──────────────────────────

export function extractYouTubeKeyframes(videoId: string, durationSeconds?: number): VideoKeyframe[] {
  if (!videoId) return [];
  const duration = durationSeconds && durationSeconds > 0 ? durationSeconds : 300; // default 5m if unknown

  const t1 = Math.round(duration * 0.25);
  const t2 = Math.round(duration * 0.50);
  const t3 = Math.round(duration * 0.75);

  return [
    {
      label: 'الغلاف واللقطة التقديمية (Master Poster / Thumbnail)',
      url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      timestampSec: 0,
      timestampFormatted: '00:00',
    },
    {
      label: `المشهد الأول (~25% من الفيديو)`,
      url: `https://i.ytimg.com/vi/${videoId}/hq1.jpg`,
      timestampSec: t1,
      timestampFormatted: formatSecs(t1),
    },
    {
      label: `المشهد الثاني (~50% منتصف الفيديو)`,
      url: `https://i.ytimg.com/vi/${videoId}/hq2.jpg`,
      timestampSec: t2,
      timestampFormatted: formatSecs(t2),
    },
    {
      label: `المشهد الثالث (~75% ذروة وخاتمة الفيديو)`,
      url: `https://i.ytimg.com/vi/${videoId}/hq3.jpg`,
      timestampSec: t3,
      timestampFormatted: formatSecs(t3),
    },
  ];
}

export function extractTikTokKeyframes(
  thumbnailUrl: string,
  extraFrames?: { dynamicCover?: string; originCover?: string; avatarUrl?: string },
  durationSeconds?: number
): VideoKeyframe[] {
  const frames: VideoKeyframe[] = [];
  const duration = durationSeconds || 30;

  if (thumbnailUrl) {
    frames.push({
      label: 'اللقطة البصرية الأساسية وإطار التحدي',
      url: thumbnailUrl,
      timestampSec: 0,
      timestampFormatted: '00:00',
    });
  }
  if (extraFrames?.originCover && extraFrames.originCover !== thumbnailUrl) {
    frames.push({
      label: 'اللقطة الأصلية الثانية',
      url: extraFrames.originCover,
      timestampSec: Math.round(duration * 0.5),
      timestampFormatted: formatSecs(Math.round(duration * 0.5)),
    });
  }
  if (extraFrames?.dynamicCover && extraFrames.dynamicCover !== thumbnailUrl) {
    frames.push({
      label: 'اللقطة الحركية المتسلسلة',
      url: extraFrames.dynamicCover,
      timestampSec: Math.round(duration * 0.8),
      timestampFormatted: formatSecs(Math.round(duration * 0.8)),
    });
  }
  return frames;
}

// ─── Helper: Convert Image URL to Base64 Data URI for Native DeepSeek Vision ───

async function urlToBase64DataUri(url: string, timeoutMs = 8000): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.tiktok.com/',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return '';

    const arrayBuffer = await res.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength < 100) return '';
    const buffer = Buffer.from(arrayBuffer);

    // Precise magic byte identification to ensure 100% compatibility with DeepSeek Vision
    let validMime = 'image/jpeg';
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      validMime = 'image/jpeg';
    } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      validMime = 'image/png';
    } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      validMime = 'image/gif';
    } else if (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      // If animated WebP (VP8X), skip to prevent DeepSeek vision 400 error
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x58) {
        return '';
      }
      validMime = 'image/webp';
    } else {
      validMime = 'image/jpeg';
    }

    return `data:${validMime};base64,${buffer.toString('base64')}`;
  } catch {
    return '';
  }
}

// ─── 2. Forensic Multimodal Vision & Temporal Memory Execution (deepseek-v4-flash-vision-exp) ───

export async function performVideoVisionPerception(
  videoId: string,
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'generic',
  keyframes: VideoKeyframe[],
  contextInfo: { title?: string; creator?: string; userPrompt?: string },
  apiKey: string = process.env.DEEPSEEK_API_KEY || '',
  baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  signal?: AbortSignal
): Promise<VideoVisionResult | null> {
  if (!apiKey || keyframes.length === 0) return null;

  const cacheKey = `${platform}:${videoId}`;
  const cached = getCachedVision(cacheKey);
  if (cached) {
    console.log(`[VideoVisionEngine] Cache hit for ${cacheKey}`);
    return cached;
  }

  const platformAr =
    platform === 'youtube' ? 'يوتيوب (YouTube)' :
    platform === 'tiktok' ? 'تيك توك (TikTok)' :
    platform === 'instagram' ? 'إنستغرام (Instagram Reels)' :
    platform === 'facebook' ? 'فيسبوك (Facebook Watch / Reels)' :
    platform === 'twitter' ? 'منصة إكس / تويتر (X / Twitter)' : 'الفيديو';

  // Convert frame URLs to Base64 in parallel and keep ONLY valid base64 frames
  const converted = await Promise.all(
    keyframes.map(async (frame) => {
      const b64 = await urlToBase64DataUri(frame.url);
      if (!b64 || !b64.startsWith('data:image/')) return null;
      return { ...frame, dataUri: b64 };
    })
  );

  const resolvedKeyframes = converted.filter(Boolean) as (VideoKeyframe & { dataUri: string })[];

  if (resolvedKeyframes.length === 0) {
    console.log(`[VideoVisionEngine] No valid base64 keyframes resolved for ${platform} (${videoId})`);
    return null;
  }

  console.log(`[VideoVisionEngine] 👁️ Running deepseek-v4-flash-vision-exp for ${platform} (${videoId}, ${resolvedKeyframes.length} frames)...`);

  const visionPrompt = `[نظام الإدراك البصري الفائق والذاكرة الزمنية وتحليل التفاصيل غير المنطوقة - FATHOM ULTRA TEMPORAL VIDEO VISION]:
تم استخراج عدد (${resolvedKeyframes.length}) إطارات بصرية حقيقية ملتقطة من المسار الزمني لفيديو ${platformAr}:
• عنوان / وصف الفيديو: "${contextInfo.title || 'غير محدد'}"
• صانع المحتوى / الحساب: "${contextInfo.creator || 'غير محدد'}"
• طلب وسؤال المستخدم: "${contextInfo.userPrompt || 'حلل المشاهد البصرية الظاهرة بالتفصيل.'}"

المطلوب إجراء فحص جنائي واستخباراتي وبصري فائق الدقة باللغة العربية الفصحى يركز على المحاور الجوهرية التالية:

1. 🔍 [استخراج التفاصيل غير المنطوقة والميكرو-OCR (Unspoken Visual Details & Micro-OCR)]:
   - استخرج بدقة 100% أي نصوص، أرقام موديلات، وحدات قياس (مثل 600 lines/mm، 12V، pH=7.4)، شعارات، علامات تجارية، عناوين كتب، أكواد برمجية على الشاشات، ألوان دقيقة، أو عناصر وأدوات تظهر في المشهد دون أن يذكرها المتحدث بصوته.

2. 🧠 [الذاكرة البصرية التطورية وتتبع التحولات عبر الزمن (Temporal Visual Memory & State Transitions)]:
   - تتبع تطور المشهد عبر الخط الزمني للإطارات:
     * الحالة الأولية (Initial State): كيف بدأ المشهد وما هي العناصر والمواد في البداية؟
     * التحولات والتغيرات المرحلية (Intermediate Progression & Actions): ما الذي طرأ وتغير؟
     * الحالة النهائية والنتيجة (Final State & Outcome): كيف انتهى المشهد وما النتيجة البصرية المحققة؟

3. 🎬 [التفكيك البصري الزمني لكل إطار (Frame-by-Frame Timestamped Log)]:
   - وثق كل إطار بطابعه الزمني، وما يظهر فيه من أشخاص، ملابس، تعابير وجوه، أدوات، إضاءة، وزوايا تصوير.`;

  const contentParts: any[] = [
    { type: 'text', text: visionPrompt }
  ];

  resolvedKeyframes.forEach((frame, idx) => {
    contentParts.push({
      type: 'text',
      text: `\n=== [إطار ملتقط رقم ${idx + 1}: ${frame.label} عند التوقيت [${frame.timestampFormatted}]] ===`
    });
    contentParts.push({
      type: 'image_url',
      image_url: { url: frame.dataUri }
    });
  });

  try {
    const visionController = new AbortController();
    const visionTimeout = setTimeout(() => visionController.abort(), 10000);
    if (signal) {
      signal.addEventListener('abort', () => visionController.abort(), { once: true });
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash-vision-exp',
        messages: [{ role: 'user', content: contentParts }],
        temperature: 0.2,
        max_tokens: 4096,
      }),
      signal: visionController.signal
    });
    clearTimeout(visionTimeout);

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        console.log(`[VideoVisionEngine] ✓ deepseek-v4-flash-vision-exp succeeded (${content.length} chars)`);
        const result: VideoVisionResult = {
          videoId,
          platform,
          visualAnalysisAr: content,
          unspokenDetails: [],
          temporalTransitions: {
            initialState: '',
            intermediateTransitions: '',
            finalState: '',
          },
          keyframes,
          analyzedAt: Date.now(),
          cached: false,
        };
        setCachedVision(cacheKey, result);
        return result;
      }
    } else {
      const errText = await res.text().catch(() => '');
      console.warn('[VideoVisionEngine] deepseek-v4-flash-vision-exp HTTP Error:', res.status, errText);
    }
  } catch (err: any) {
    console.warn('[VideoVisionEngine] deepseek-v4-flash-vision-exp error:', err?.message);
  }

  return null;
}

// ─── 3. Audio/Visual Cross-Referencing Matrix Generator ───────────────────────

export function buildCrossReferencedMatrix(
  transcript: YouTubeTranscriptResult | null,
  visionResult: VideoVisionResult | null
): string {
  const bar = '━'.repeat(45);
  const rows: string[] = [];

  rows.push('🔄 [مصفوفة المطابقة والربط الصوتي-البصري المتزامن — AUDIO/VISUAL CROSS-REFERENCE MATRIX]');
  rows.push(bar);

  if (transcript && transcript.timestampedBlocks && transcript.timestampedBlocks.length > 0) {
    const blocks = transcript.timestampedBlocks.slice(0, 8); // Top representative timeline segments
    for (const b of blocks) {
      rows.push(`📍 الفترة الزمنية [${b.timeRange}]:`);
      rows.push(`  🎙️ ما قيل صوتياً (Monologue): "${b.speechText.slice(0, 180)}${b.speechText.length > 180 ? '...' : ''}"`);
      
      // Find matching keyframe near this timestamp
      if (visionResult && visionResult.keyframes.length > 0) {
        const nearestFrame = visionResult.keyframes.reduce((prev, curr) => {
          return Math.abs(curr.timestampSec - b.startSeconds) < Math.abs(prev.timestampSec - b.startSeconds) ? curr : prev;
        }, visionResult.keyframes[0]);

        if (nearestFrame) {
          rows.push(`  👁️ المشهد البصري المقترن [${nearestFrame.timestampFormatted}]: ${nearestFrame.label}`);
        }
      }
      rows.push('');
    }
  }

  return rows.join('\n');
}

// ─── 4. Master AI Context Block Builder ────────────────────────────────────────

export function buildMasterVideoIntelligenceBlock(
  transcriptResult: any,
  visionResult: VideoVisionResult | null,
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'generic' = 'youtube'
): string {
  const bar = '━'.repeat(45);
  const parts: string[] = [];

  const platformName =
    platform === 'youtube' ? 'يوتيوب (YouTube)' :
    platform === 'tiktok' ? 'تيك توك (TikTok)' :
    platform === 'instagram' ? 'إنستغرام (Instagram Reels)' :
    platform === 'facebook' ? 'فيسبوك (Facebook Video)' :
    platform === 'twitter' ? 'منصة إكس / تويتر (X / Twitter)' : 'الفيديو';

  parts.push(`🎬 [استخبارات الفيديو الشاملة — الفحص البصري الفعلي، التفريغ الصوتي، والربط الزمني المتزامن]`);
  parts.push(bar);
  parts.push(`• المنصة: ${platformName}`);
  if (transcriptResult) {
    if (transcriptResult.title) parts.push(`• العنوان: ${transcriptResult.title}`);
    if (transcriptResult.channelName) parts.push(`• القناة / صانع المحتوى: ${transcriptResult.channelName}`);
    if (transcriptResult.wordCount) {
      const blockCount = Array.isArray(transcriptResult.timestampedBlocks) ? transcriptResult.timestampedBlocks.length : 0;
      parts.push(`• عدد الكلمات المنطوقة صوتياً: ${transcriptResult.wordCount} كلمة (${blockCount} فقرة زمنية)`);
    }
  }
  if (visionResult) {
    parts.push(`• عدد الإطارات المفحوصة بصرياً: ${visionResult.keyframes?.length || 0} إطارات من الخط الزمني`);
  }
  parts.push(bar);

  if (visionResult && visionResult.visualAnalysisAr) {
    parts.push(`\n👁️ [1. التحليل البصري الفعلي، الذاكرة الزمنية، والتفاصيل غير المنطوقة]:\n`);
    parts.push(visionResult.visualAnalysisAr);
  }

  if (transcriptResult && (transcriptResult.rawSpokenText || transcriptResult.formattedCaptionsWithTimestamps)) {
    parts.push(`\n${bar}`);
    parts.push(`\n🎙️ [2. التفريغ الصوتي الحرفي لكلام المتحدث بالطوابع الزمنية [MM:SS]]:\n`);
    if (Array.isArray(transcriptResult.timestampedBlocks) && transcriptResult.timestampedBlocks.length > 0) {
      const spokenPreview = transcriptResult.timestampedBlocks.slice(0, 15).map((b: any) => `[${b.timeRange}] ${b.speechText}`).join('\n\n');
      parts.push(spokenPreview);
    } else if (transcriptResult.formattedCaptionsWithTimestamps) {
      parts.push(transcriptResult.formattedCaptionsWithTimestamps);
    } else if (transcriptResult.rawSpokenText) {
      parts.push(transcriptResult.rawSpokenText);
    }

    if (transcriptResult.arabicTranslationText && transcriptResult.language !== 'ar') {
      parts.push(`\n[الترجمة العربية الفورية المعتمدة]:\n${transcriptResult.arabicTranslationText.slice(0, 1500)}...`);
    }
  }

  // Cross reference matrix
  if (transcriptResult && Array.isArray(transcriptResult.timestampedBlocks) && visionResult) {
    parts.push(`\n${bar}`);
    parts.push(buildCrossReferencedMatrix(transcriptResult, visionResult));
  }

  parts.push(bar);
  parts.push(`[توجيه استخباراتي صارم للرد — FATHOM 5-PILLAR REASONING DIRECTIVE]:`);
  parts.push(`1. أنت تمتلك التكامل الشامل: ما يُرى بصرياً (بما فيه التفاصيل غير المنطوقة والكتابات الدقيقة OCR) + ما يُقال صوتياً في كل ثانية.`);
  parts.push(`2. إذا سأل المستخدم عن شيء لم يذكره المتحدث في صوته (مثل كتابة معينة، رقم موديل، أداة ظاهرة، لون، أو حركة)، اعتمد كلياً على التحليل البصري الفعلي للإطارات أعلاه للإجابة بدقة مطلقة.`);
  parts.push(`3. تتبع التحولات الزمنية: قارن بين ما بدأ به الفيديو، التغيرات في المنتصف، والنتيجة النهائية.`);
  parts.push(`4. وثق إجابتك بالدقائق والثواني [MM:SS] وباللغة العربية الفصحى المنظمة في نقاط وجداول.`);
  parts.push(bar);

  return parts.join('\n');
}
