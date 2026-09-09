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
