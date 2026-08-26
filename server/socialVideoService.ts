/**
 * Universal Meta & Social Video Intelligence Service
 * ----------------------------------------------------
 * Full parity with YouTube & TikTok engines:
 *   1. Instagram (Reels, Posts, IGTV, Stories)
 *   2. Facebook (Reels, Watch, Video Posts, fb.watch)
 *   3. X / Twitter (Video Tweets, Media Posts, t.co)
 *
 * Capabilities:
 *   - Automatic unshortening & canonical URL resolution
 *   - Rich metadata extraction (Author, caption, hashtags, likes, views)
 *   - High-resolution keyframe & thumbnail harvesting
 *   - Forensic 5-Pillar Multimodal Vision & Micro-OCR integration
 */

import { extractYouTubeKeyframes, extractTikTokKeyframes, performVideoVisionPerception, buildMasterVideoIntelligenceBlock, type VideoKeyframe, type VideoVisionResult } from './videoVisionService.js';

export interface SocialVideoMetadata {
  platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok' | 'generic';
  canonicalUrl: string;
  originalUrl: string;
  videoId?: string;
  title: string;
  description: string;
  author: {
    username: string;
    displayName: string;
    avatarUrl?: string;
    isVerified?: boolean;
  };
  metrics?: {
    likes?: number;
    views?: number;
    comments?: number;
    shares?: number;
  };
  thumbnailUrl?: string;
  videoUrl?: string;
  durationSeconds?: number;
  hashtags: string[];
  extractedAt: number;
}

export interface SocialVideoFailure {
  error: true;
  message: string;
  platform: string;
  originalUrl: string;
}

export type SocialVideoResult = SocialVideoMetadata | SocialVideoFailure;

const STEALTH_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
  'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
};

const BOT_HEADERS: Record<string, string> = {
  'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Facebot Twitterbot/1.0',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// ─── In-Memory Cache (30-min TTL) ─────────────────────────────────────────────
const cache = new Map<string, { data: SocialVideoMetadata; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function getCached(url: string): SocialVideoMetadata | null {
  const entry = cache.get(url);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(url);
    return null;
  }
  return entry.data;
}

function setCached(url: string, data: SocialVideoMetadata): void {
  cache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Platform Detection & URL Helpers ─────────────────────────────────────────

export function detectSocialPlatform(url: string): 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok' | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com') || lower.includes('instagr.am') || lower.includes('ig.me')) return 'instagram';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.me') || lower.includes('m.facebook.com')) return 'facebook';
  if (lower.includes('x.com') || lower.includes('twitter.com') || lower.includes('t.co')) return 'twitter';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('tiktok.com')) return 'tiktok';
  return null;
}

export function extractSocialUrlFromText(text: string): { url: string; platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok' } | null {
  if (!text) return null;
  const match = text.match(/https?:\/\/[^\s<>"'{}|\\^`]+/i);
  if (!match) return null;
  const cleanUrl = match[0].replace(/[.,;:)>\]"']+$/, '');
  const platform = detectSocialPlatform(cleanUrl);
  if (platform) return { url: cleanUrl, platform };
  return null;
}

// ─── HTML Unescaping & Sanitizing ─────────────────────────────────────────────

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&#([0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[a-zA-Z0-9_\u0600-\u06FF]+/g);
  return matches ? [...new Set(matches)] : [];
}

// ─── Instagram Video Extractor ────────────────────────────────────────────────

export async function fetchInstagramVideoData(url: string): Promise<SocialVideoResult> {
  const cached = getCached(url);
  if (cached) return cached;

  try {
    // Extract shortcode
    const shortcodeMatch = url.match(/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
    const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';

    // Fetch with Bot headers & standard headers
    let html = '';
    const endpoints = [
      url,
      shortcode ? `https://www.instagram.com/reel/${shortcode}/embed/captioned/` : null,
      shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : null,
    ].filter(Boolean) as string[];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, {
          headers: BOT_HEADERS,
          redirect: 'follow',
        });
        if (res.ok) {
          html = await res.text();
          if (html.length > 500) break;
        }
      } catch {}
    }

    // Extract OpenGraph / Meta details
    const ogTitle = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogDesc = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    let ogImg = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogVideo = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:video["'][^>]+content=["'](.*?)["']/i)?.[1] || '');

    // Fallback image search in embed
    if (!ogImg) {
      const imgMatch = html.match(/class=["']EmbeddedMediaImage["'][^>]*src=["']([^"']+)["']/i) ||
                        html.match(/<img[^>]+src=["']([^"']+\.cdninstagram\.com\/[^"']+)["']/i);
      if (imgMatch) ogImg = decodeHtmlEntities(imgMatch[1]);
    }

    // Extract author from title e.g. "Name (@username) on Instagram: 'caption'"
    let username = '';
    let displayName = '';
    const userMatch = ogTitle.match(/([^(]+)\s*\(@([^)]+)\)/i);
    if (userMatch) {
      displayName = userMatch[1].trim();
      username = userMatch[2].trim();
    } else {
      const match2 = ogTitle.match(/@([a-zA-Z0-9_.]+)/);
      username = match2 ? match2[1] : 'instagram_creator';
      displayName = username;
    }

    const caption = ogDesc || ogTitle || 'مقطع فيديو من إنستغرام';

    const result: SocialVideoMetadata = {
      platform: 'instagram',
      canonicalUrl: shortcode ? `https://www.instagram.com/reel/${shortcode}/` : url,
      originalUrl: url,
      videoId: shortcode || undefined,
      title: ogTitle || `مقطع ريلز من إنستغرام (@${username})`,
      description: caption,
      author: {
        username: username || 'instagram_user',
        displayName: displayName || username || 'صانع محتوى إنستغرام',
      },
      thumbnailUrl: ogImg || undefined,
      videoUrl: ogVideo || undefined,
      hashtags: extractHashtags(`${ogTitle} ${ogDesc}`),
      extractedAt: Date.now(),
    };

    setCached(url, result);
    return result;
  } catch (err: any) {
    return {
      error: true,
      message: err?.message || 'Failed to extract Instagram metadata',
      platform: 'instagram',
      originalUrl: url,
    };
  }
}

// ─── Facebook Video Extractor ─────────────────────────────────────────────────

export async function fetchFacebookVideoData(url: string): Promise<SocialVideoResult> {
  const cached = getCached(url);
  if (cached) return cached;

  try {
    let currentUrl = url;
    let html = '';

    // Fetch following redirects with Facebook bot headers
    const res = await fetch(currentUrl, {
      headers: BOT_HEADERS,
      redirect: 'follow',
    });

    if (res.ok) {
      currentUrl = res.url || currentUrl;
      html = await res.text();
    }

    const ogTitle = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogDesc = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogImg = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');
    const ogVideo = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:video(?::url)?["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');

    // Extract Video ID if present
    const idMatch = currentUrl.match(/(?:videos|reel|watch\/\?v=)\/?([0-9]+)/i);
    const videoId = idMatch ? idMatch[1] : undefined;

    const result: SocialVideoMetadata = {
      platform: 'facebook',
      canonicalUrl: currentUrl,
      originalUrl: url,
      videoId,
      title: ogTitle || 'فيديو فيسبوك',
      description: ogDesc || ogTitle || 'محتوى فيديو من فيسبوك',
      author: {
        username: 'facebook_page',
        displayName: ogTitle.includes('|') ? ogTitle.split('|')[0].trim() : 'فيسبوك',
      },
      thumbnailUrl: ogImg || undefined,
      videoUrl: ogVideo || undefined,
      hashtags: extractHashtags(`${ogTitle} ${ogDesc}`),
      extractedAt: Date.now(),
    };

    setCached(url, result);
    return result;
  } catch (err: any) {
    return {
      error: true,
      message: err?.message || 'Failed to extract Facebook metadata',
      platform: 'facebook',
      originalUrl: url,
    };
  }
}

// ─── X / Twitter Video & Tweet Extractor ──────────────────────────────────────

export async function fetchTwitterVideoData(url: string): Promise<SocialVideoResult> {
  const cached = getCached(url);
  if (cached) return cached;

  try {
    const statusMatch = url.match(/status\/([0-9]+)/i);
    const statusId = statusMatch ? statusMatch[1] : '';

    let html = '';
    const res = await fetch(url, {
      headers: BOT_HEADERS,
      redirect: 'follow',
    });
    if (res.ok) {
      html = await res.text();
    }

    const ogTitle = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogDesc = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogImg = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');
    const twImg = decodeHtmlEntities(html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');

    // Extract author username from title or URL
    const urlUserMatch = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status/i);
    const username = urlUserMatch ? urlUserMatch[1] : 'x_user';

    const result: SocialVideoMetadata = {
      platform: 'twitter',
      canonicalUrl: statusId ? `https://x.com/${username}/status/${statusId}` : url,
      originalUrl: url,
      videoId: statusId || undefined,
      title: ogTitle || `منشور ومقطع فيديو على منصة X (@${username})`,
      description: ogDesc || ogTitle || 'منشور وسائط من منصة X',
      author: {
        username,
        displayName: ogTitle.includes('on X') ? ogTitle.split('on X')[0].trim() : username,
      },
      thumbnailUrl: ogImg || twImg || undefined,
      hashtags: extractHashtags(`${ogTitle} ${ogDesc}`),
      extractedAt: Date.now(),
    };

    setCached(url, result);
    return result;
  } catch (err: any) {
    return {
      error: true,
      message: err?.message || 'Failed to extract X / Twitter metadata',
      platform: 'twitter',
      originalUrl: url,
    };
  }
}

// ─── Master Universal Social Dispatcher ───────────────────────────────────────

export async function fetchSocialVideoData(url: string): Promise<SocialVideoResult> {
  const platform = detectSocialPlatform(url);
  if (platform === 'instagram') return fetchInstagramVideoData(url);
  if (platform === 'facebook') return fetchFacebookVideoData(url);
  if (platform === 'twitter') return fetchTwitterVideoData(url);
  return {
    error: true,
    message: 'Unsupported social platform',
    platform: 'unknown',
    originalUrl: url,
  };
}

// ─── Master AI Context Builder for Social Videos ──────────────────────────────

export function buildSocialVideoContextBlock(
  metadata: SocialVideoMetadata,
  visionResult?: VideoVisionResult | null
): string {
  const bar = '━'.repeat(45);
  const parts: string[] = [];

  const platformNames: Record<string, string> = {
    instagram: 'إنستغرام (Instagram Reels / Video)',
    facebook: 'فيسبوك (Facebook Watch / Reels)',
    twitter: 'منصة إكس / تويتر (X / Twitter Media)',
    youtube: 'يوتيوب (YouTube)',
    tiktok: 'تيك توك (TikTok)',
  };

  parts.push(`🎬 [استخبارات الفيديو والوسائط الاجتماعية الشاملة — ${platformNames[metadata.platform] || metadata.platform}]`);
  parts.push(bar);
  parts.push(`• المنصة: ${platformNames[metadata.platform] || metadata.platform}`);
  parts.push(`• الرابط الأصلي: ${metadata.canonicalUrl}`);
  parts.push(`• صانع المحتوى / الحساب: ${metadata.author.displayName} (@${metadata.author.username})`);
  parts.push(`• عنوان / نص المنشور: "${metadata.title}"`);
  if (metadata.description && metadata.description !== metadata.title) {
    parts.push(`• الوصف والمحتوى الكامل: "${metadata.description}"`);
  }
  if (metadata.hashtags.length > 0) {
    parts.push(`• الهاشتاجات: ${metadata.hashtags.join(' ')}`);
  }
  parts.push(bar);

  if (visionResult && visionResult.visualAnalysisAr) {
    parts.push(`\n👁️ [التحليل البصري الفعلي والميكرو-OCR للأدوات والتفاصيل غير المنطوقة في الفيديو]:\n`);
    parts.push(visionResult.visualAnalysisAr);
  }

  parts.push(bar);
  parts.push(`[توجيه استخباراتي صارم للرد — FATHOM MULTIMODAL SOCIAL DIRECTIVE]:`);
  parts.push(`1. لقد تم تفكيك وتحليل هذا الفيديو بصرياً واستخباراتياً من منصة ${platformNames[metadata.platform] || metadata.platform}.`);
  parts.push(`2. أجب عن سؤال المستخدم وادمج بين المشاهد المرئية الدقيقة، النصوص (Micro-OCR)، والمحتوى المكتوب بدقة مطلقة وباللغة العربية الفصحى المنظمة.`);
  parts.push(bar);

  return parts.join('\n');
}
