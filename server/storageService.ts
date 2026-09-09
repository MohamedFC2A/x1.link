import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://gyxlvreqwikpujzpyegm.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';

export const serverSupabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKET_NAME = 'chat-images';

/**
 * Universal base64 / binary decoder compatible with Node.js and Vercel Edge Runtime.
 */
function toUint8Array(data: string | Buffer | Uint8Array): { bytes: Uint8Array; mimeType: string; extension: string } {
  let mimeType = 'image/png';
  let extension = 'png';

  if (typeof data === 'string') {
    const dataUriMatch = data.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/s);
    let base64String = data;
    if (dataUriMatch) {
      extension = dataUriMatch[1] === 'jpeg' ? 'jpg' : dataUriMatch[1];
      mimeType = `image/${dataUriMatch[1]}`;
      base64String = dataUriMatch[2];
    }

    if (typeof Buffer !== 'undefined') {
      const buf = Buffer.from(base64String, 'base64');
      return { bytes: new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength), mimeType, extension };
    } else {
      const binaryString = atob(base64String);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return { bytes, mimeType, extension };
    }
  } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
    return { bytes: new Uint8Array(data.buffer, data.byteOffset, data.byteLength), mimeType, extension };
  } else {
    return { bytes: data as Uint8Array, mimeType, extension };
  }
}

/**
 * Uploads a base64 string or binary buffer to Supabase Storage bucket 'chat-images'.
 * Returns the public CDN URL (<90 chars) or falls back to the original string if storage fails.
 */
export async function uploadImageToSupabaseStorage(
  rawOrBase64Data: string | Buffer | Uint8Array,
  prefix: string = 'gen'
): Promise<string> {
  if (!rawOrBase64Data) return '';

  // If already a public HTTP/HTTPS URL, return directly
  if (typeof rawOrBase64Data === 'string' && rawOrBase64Data.startsWith('http')) {
    return rawOrBase64Data;
  }

  try {
    const { bytes, mimeType, extension } = toUint8Array(rawOrBase64Data);
    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 10);
    const fileName = `${prefix}-${timestamp}-${randomHex}.${extension}`;

    const { data, error } = await serverSupabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, bytes, {
        contentType: mimeType,
        cacheControl: '31536000',
        upsert: true
      });

    if (error) {
      console.warn('[storageService] Supabase upload warning:', error.message);
      return typeof rawOrBase64Data === 'string' ? rawOrBase64Data : '';
    }

    const { data: publicUrlData } = serverSupabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.warn('[storageService] Exception during storage upload:', err?.message || err);
    return typeof rawOrBase64Data === 'string' ? rawOrBase64Data : '';
  }
}

/**
 * Normalizes input references: converts any base64 reference images to Supabase CDN URLs
 * to prevent payload explosions and OpenRouter 400 Bad Request errors.
 */
export async function normalizeReferenceImages(
  rawRefs: any[]
): Promise<Array<{ type: string; image_url: { url: string } }>> {
  const result: Array<{ type: string; image_url: { url: string } }> = [];
  if (!Array.isArray(rawRefs) || rawRefs.length === 0) return result;

  for (const item of rawRefs) {
    let candidateUrl = '';
    if (typeof item === 'string' && item.trim()) {
      candidateUrl = item.trim();
    } else if (item && typeof item === 'object') {
      if (item.type === 'image_url' && item.image_url?.url) {
        candidateUrl = item.image_url.url;
      } else if (item.url) {
        candidateUrl = item.url;
      }
    }

    if (!candidateUrl) continue;

    // If candidate is a base64 data URI, upload to Supabase CDN first
    if (candidateUrl.startsWith('data:image')) {
      try {
        const cdnUrl = await uploadImageToSupabaseStorage(candidateUrl, 'ref-upload');
        if (cdnUrl && cdnUrl.startsWith('http')) {
          candidateUrl = cdnUrl;
        }
      } catch (err) {
        console.warn('[storageService] Failed to upload reference image to CDN:', err);
      }
    }

    result.push({
      type: 'image_url',
      image_url: { url: candidateUrl }
    });
  }

  return result.slice(0, 5);
}

export interface ResilientImageOptions {
  prompt: string;
  aspectRatio?: string;
  inputReferences?: any[];
  openRouterApiKey: string;
  openRouterBaseUrl?: string;
}

export interface ResilientImageResult {
  imageUrl?: string;
  model?: string;
  provider?: string;
  error?: string;
  status?: number;
  details?: string;
}

const CANDIDATE_IMAGE_MODELS = [
  'meta/muse-image',
  'google/gemini-2.5-flash-image',
  'bytedance-seed/seedream-4.5',
  'openai/gpt-image-1-mini'
];

/**
 * Executes zero-failure image generation and editing via OpenRouter with automatic multi-model failover.
 */
export async function executeResilientImageGeneration(
  options: ResilientImageOptions
): Promise<ResilientImageResult> {
  const apiKey = options.openRouterApiKey;
  if (!apiKey) {
    return { error: 'OPENROUTER_API_KEY is not configured', status: 500 };
  }

  const baseUrl = options.openRouterBaseUrl || 'https://openrouter.ai/api/v1';
  let finalPrompt = (options.prompt || '').trim();
  if (!finalPrompt) {
    return { error: 'Prompt is required', status: 400 };
  }

  // 1. Autonomous Prompt Translation & Enhancement for Arabic
  const hasArabicCharacters = /[\u0600-\u06FF]/.test(finalPrompt);
  if (hasArabicCharacters) {
    try {
      const transRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://matany.one',
          'X-Title': 'Matany AI'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are an elite visual prompt engineer for photorealistic image generation and image modification. Translate and expand the following user image description or modification instruction into a single, detailed, photorealistic visual prompt in English. Output ONLY the raw English prompt, nothing else.'
            },
            {
              role: 'user',
              content: finalPrompt
            }
          ],
          max_tokens: 300,
          temperature: 0.2
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (transRes.ok) {
        const transData = await transRes.json();
        const translatedText = transData?.choices?.[0]?.message?.content?.trim();
        if (translatedText && !/[\u0600-\u06FF]/.test(translatedText)) {
          console.log(`[resilient-image] Translated prompt: "${finalPrompt.slice(0, 50)}..." -> "${translatedText.slice(0, 80)}..."`);
          finalPrompt = translatedText;
        }
      }
    } catch (transErr) {
      console.warn('[resilient-image] Translation fallback bypassed:', transErr);
    }
  }

  // 2. Defensive Typography Enhancement
  const hasTextOrPlateRequest = /(?:plate|license|sign|text|letters?|numbers?|logo|billboard|label|typography|words?|لوحة|نمرة|كتابة|نص|حروف|أرقام)/i.test(finalPrompt);
  if (hasTextOrPlateRequest && !finalPrompt.includes('readable by OCR')) {
    finalPrompt = `${finalPrompt}, crisp legible typography, authentic official vehicle plate format, perfectly formed characters, razor-sharp edges, high contrast, zero gibberish, zero scrambled letters, fully legible by optical character recognition (OCR) and humans`;
  }

  // 3. Normalize References
  const formattedReferences = await normalizeReferenceImages(options.inputReferences || []);

  let lastError = 'Image generation failed';
  let lastStatus = 500;
  let lastDetails = '';

  for (const candidateModel of CANDIDATE_IMAGE_MODELS) {
    const isPrimary = candidateModel === 'meta/muse-image';
    const timeoutMs = isPrimary ? 22000 : 18000;

    const attemptGeneration = async (includeRefs: boolean): Promise<any> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const payload: any = {
          model: candidateModel,
          prompt: finalPrompt
        };

        if (options.aspectRatio && ['1:1', '16:9', '9:16', '4:3'].includes(options.aspectRatio)) {
          payload.aspect_ratio = options.aspectRatio;
        }

        if (includeRefs && formattedReferences.length > 0) {
          payload.input_references = formattedReferences.slice(0, 5);
        }

        const res = await fetch(`${baseUrl}/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://matany.one',
            'X-Title': 'Matany AI'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errBody = await res.text();
          // If 400 occurred with input_references, retry once on this model without references
          if (res.status === 400 && includeRefs && formattedReferences.length > 0) {
            console.warn(`[resilient-image] ${candidateModel} 400 with references, retrying without refs:`, errBody.slice(0, 120));
            return attemptGeneration(false);
          }
          return { error: `Model ${candidateModel} failed`, status: res.status, details: errBody };
        }

        return { data: await res.json() };
      } catch (err: any) {
        clearTimeout(timeoutId);
        return { error: err.message || 'Fetch error', status: 504, details: err.name };
      }
    };

    console.log(`[resilient-image] Attempting image generation with model: ${candidateModel}...`);
    const resp = await attemptGeneration(true);

    if (resp?.data) {
      const item = resp.data.data?.[0];
      if (item) {
        let finalUrl = '';
        if (item.b64_json) {
          const cdnUrl = await uploadImageToSupabaseStorage(item.b64_json, 'generated');
          if (cdnUrl && cdnUrl.startsWith('http')) {
            finalUrl = cdnUrl;
          } else {
            const mediaType = item.media_type || 'image/png';
            finalUrl = `data:${mediaType};base64,${item.b64_json}`;
          }
        } else if (item.url) {
          finalUrl = item.url;
        }

        if (finalUrl) {
          console.log(`[resilient-image] ✓ Successfully generated image via ${candidateModel}`);
          return {
            imageUrl: finalUrl,
            model: candidateModel,
            provider: 'openrouter'
          };
        }
      }
    }

    lastError = resp?.error || lastError;
    lastStatus = resp?.status || lastStatus;
    lastDetails = resp?.details || lastDetails;
    console.warn(`[resilient-image] ⚠️ Model ${candidateModel} failed (${lastStatus}). Cascading to next candidate...`);
  }

  return { error: lastError, status: lastStatus, details: lastDetails };
}
