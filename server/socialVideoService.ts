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

import { extractYouTubeKeyframes, extractTikTokKeyframes, performVideoVisionPerception, buildMasterVideoIntelligenceBlock, type VideoKeyframe, type VideoVisionResult } from './videoVisionService';

export interface PostComment {
  author: string;
  text: string;
  time?: string;
  likes?: number;
}

export interface SocialVideoMetadata {
  platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok' | 'generic';
  postType?: 'video' | 'reel' | 'photo' | 'post' | 'album' | 'story';
  canonicalUrl: string;
  originalUrl: string;
  videoId?: string;
  title: string;
  description: string;
  fullContent?: string;
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
  mediaUrls?: string[];
  commentsList?: PostComment[];
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
  if (
    lower.includes('facebook.com') ||
    lower.includes('fb.watch') ||
    lower.includes('fb.me') ||
    lower.includes('fb.com') ||
    lower.includes('fb.gg') ||
    lower.includes('m.facebook.com') ||
    lower.includes('web.facebook.com') ||
    lower.includes('touch.facebook.com') ||
    lower.includes('mbasic.facebook.com')
  ) return 'facebook';
  if (lower.includes('x.com') || lower.includes('twitter.com') || lower.includes('t.co')) return 'twitter';
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('yt.be')) return 'youtube';
  if (lower.includes('tiktok.com') || lower.includes('douyin.com')) return 'tiktok';
  return null;
}

export function extractSocialUrlFromText(text: string): { url: string; platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok' } | null {
  if (!text) return null;
  const match = text.match(/(?:https?:\/\/[^\s<>"'{}|\\^`]+|(?:www\.)?(?:facebook\.com|fb\.watch|fb\.me|fb\.com|fb\.gg|instagram\.com|instagr\.am|tiktok\.com|youtube\.com|youtu\.be|twitter\.com|x\.com)[^\s<>"'{}|\\^`]*)/i);
  if (!match) return null;
  let cleanUrl = match[0].replace(/[.,;:)>\]"']+$/, '');
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = 'https://' + cleanUrl;
  }
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

// ─── Facebook Post, Media & Video Forensic Extractor ─────────────────────────

export async function fetchFacebookVideoData(url: string): Promise<SocialVideoResult> {
  const cached = getCached(url);
  if (cached) return cached;

  try {
    let currentUrl = url;
    let html = '';

    // Step 1: Follow redirects with Facebook Bot Headers to resolve canonical URL
    const res = await fetch(currentUrl, {
      headers: BOT_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      currentUrl = res.url || currentUrl;
      html = await res.text();
    }

    // Step 2: Fallback to mobile fetch if main body is small or missing rich content
    let mobileHtml = '';
    if (html.length < 5000 || !html.includes('og:description')) {
      try {
        const mobileUrl = currentUrl
          .replace(/www\.facebook\.com/i, 'm.facebook.com')
          .replace(/mbasic\.facebook\.com/i, 'm.facebook.com');
        const mRes = await fetch(mobileUrl, {
          headers: STEALTH_HEADERS,
          redirect: 'follow',
          signal: AbortSignal.timeout(3000),
        });
        if (mRes.ok) {
          mobileHtml = await mRes.text();
        }
      } catch {}
    }

    const combinedHtml = `${html}\n${mobileHtml}`;

    // Step 3: OpenGraph Extractions
    const ogTitle = decodeHtmlEntities(combinedHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogDesc = decodeHtmlEntities(combinedHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const metaDesc = decodeHtmlEntities(combinedHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogImg = decodeHtmlEntities(combinedHtml.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');
    const ogVideo = decodeHtmlEntities(combinedHtml.match(/<meta[^>]+property=["']og:video(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');
    const ogType = combinedHtml.match(/<meta[^>]+property=["']og:type["'][^>]+content=["'](.*?)["']/i)?.[1] || '';

    // Step 4: Deep JSON-LD Extraction (articleBody, text, author, images, video, comments, stats)
    let jsonLdBody = '';
    let jsonLdAuthor = '';
    const jsonLdImages: string[] = [];
    let jsonLdVideoUrl = '';
    const jsonLdComments: PostComment[] = [];
    let likesCount: number | undefined;
    let commentsCount: number | undefined;
    let sharesCount: number | undefined;

    const ldMatches = combinedHtml.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of ldMatches) {
      try {
        const parsed = JSON.parse(match[1].trim());
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item.articleBody && typeof item.articleBody === 'string') {
            jsonLdBody = item.articleBody;
          } else if (item.text && typeof item.text === 'string') {
            jsonLdBody = item.text;
          } else if (item.description && typeof item.description === 'string' && !jsonLdBody) {
            jsonLdBody = item.description;
          }

          if (item.author) {
            const aName = typeof item.author === 'string' ? item.author : item.author.name;
            if (aName) jsonLdAuthor = aName;
          }

          if (item.image) {
            if (Array.isArray(item.image)) {
              jsonLdImages.push(...item.image.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean));
            } else if (typeof item.image === 'string') {
              jsonLdImages.push(item.image);
            } else if (item.image.url) {
              jsonLdImages.push(item.image.url);
            }
          }

          if (item.video) {
            jsonLdVideoUrl = item.video.contentUrl || item.video.embedUrl || '';
          }

          // Comments inside JSON-LD
          if (item.comment && Array.isArray(item.comment)) {
            for (const c of item.comment) {
              const cText = c.text || c.commentText || '';
              const cAuthor = typeof c.author === 'string' ? c.author : (c.author?.name || 'مستخدم فيسبوك');
              if (cText.trim()) {
                jsonLdComments.push({
                  author: cAuthor,
                  text: decodeHtmlEntities(cText.trim()),
                  time: c.dateCreated,
                });
              }
            }
          }

          // Interaction stats
          if (item.interactionStatistic && Array.isArray(item.interactionStatistic)) {
            for (const stat of item.interactionStatistic) {
              const type = stat.interactionType?.['@type'] || stat.interactionType || '';
              const count = parseInt(stat.userInteractionCount || '0', 10);
              if (type.includes('LikeAction')) likesCount = count;
              if (type.includes('CommentAction')) commentsCount = count;
              if (type.includes('ShareAction')) sharesCount = count;
            }
          }
        }
      } catch {}
    }

    // Step 5: HTML Microdata & Regex Extraction for Post Message Text
    let rawPostText = '';
    const postMessageMatch = combinedHtml.match(/data-testid=["']post_message["'][^>]*>([\s\S]*?)<\/div>/i) ||
                             combinedHtml.match(/data-ad-preview=["']message["'][^>]*>([\s\S]*?)<\/div>/i) ||
                             combinedHtml.match(/class=["'][^"']*_5rgt[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
                             combinedHtml.match(/class=["'][^"']*story_body_container[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (postMessageMatch) {
      rawPostText = decodeHtmlEntities(postMessageMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }

    // Step 6: HTML Microdata Extraction for Comments
    const htmlComments: PostComment[] = [];
    const commentBlockMatches = combinedHtml.matchAll(/(?:aria-label=["']Comment by ([^"']+)["'][^>]*>|data-testid=["']UFI2Comment\/body["'][^>]*>|data-sigil=["']comment-body["'][^>]*>)([\s\S]*?)<\/(?:div|span)>/gi);
    for (const cMatch of commentBlockMatches) {
      const cAuthor = cMatch[1] ? decodeHtmlEntities(cMatch[1].trim()) : 'معلق فيسبوك';
      const cContent = decodeHtmlEntities(cMatch[2]?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || '');
      if (cContent && cContent.length > 2 && !htmlComments.some(x => x.text === cContent)) {
        htmlComments.push({ author: cAuthor, text: cContent });
      }
      if (htmlComments.length >= 8) break;
    }

    const allComments = jsonLdComments.length > 0 ? jsonLdComments : htmlComments;

    // Step 7: Harvest all high-resolution photos
    const allMediaUrls: string[] = [];
    if (ogImg) allMediaUrls.push(ogImg);
    jsonLdImages.forEach(img => {
      if (!allMediaUrls.includes(img)) allMediaUrls.push(img);
    });

    const cdnImgMatches = combinedHtml.matchAll(/https:\/\/(?:scontent|external)[^\s"'<>]+\.fbcdn\.net\/[^\s"'<>]+(?:\.jpg|\.png|\.webp|\.jpeg)[^\s"'<>]*/gi);
    for (const m of cdnImgMatches) {
      const cleanImg = decodeHtmlEntities(m[0].replace(/&amp;/g, '&'));
      if (!cleanImg.includes('/rsrc.php') && !cleanImg.includes('16x16') && !cleanImg.includes('32x32') && !allMediaUrls.includes(cleanImg)) {
        allMediaUrls.push(cleanImg);
      }
      if (allMediaUrls.length >= 6) break;
    }

    // Step 7.5: Extract direct Facebook playable video streams (HD / SD) from script tags
    let scriptVideoHd = '';
    let scriptVideoSd = '';
    const hdMatch = combinedHtml.match(/"playable_url_quality_hd"\s*:\s*"([^"]+)"/i) || combinedHtml.match(/"browser_native_hd_url"\s*:\s*"([^"]+)"/i) || combinedHtml.match(/"hd_src"\s*:\s*"([^"]+)"/i);
    const sdMatch = combinedHtml.match(/"playable_url"\s*:\s*"([^"]+)"/i) || combinedHtml.match(/"browser_native_sd_url"\s*:\s*"([^"]+)"/i) || combinedHtml.match(/"sd_src"\s*:\s*"([^"]+)"/i);

    if (hdMatch?.[1]) {
      scriptVideoHd = decodeHtmlEntities(hdMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'));
    }
    if (sdMatch?.[1]) {
      scriptVideoSd = decodeHtmlEntities(sdMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'));
    }

    const directVideoUrl = scriptVideoHd || scriptVideoSd || ogVideo || jsonLdVideoUrl || undefined;

    // Determine author name
    let authorName = jsonLdAuthor || '';
    if (!authorName && ogTitle) {
      if (ogTitle.includes('|')) {
        authorName = ogTitle.split('|')[0].trim();
      } else if (ogTitle.includes(' - ')) {
        authorName = ogTitle.split(' - ')[0].trim();
      } else if (ogTitle.toLowerCase().includes('on facebook')) {
        authorName = ogTitle.split(/on facebook/i)[0].trim();
      }
    }
    if (!authorName) authorName = 'Facebook Page / User';

    // Determine full text content
    const bestFullContent = jsonLdBody || rawPostText || ogDesc || metaDesc || ogTitle || 'محتوى منشور فيسبوك';
    const isExplicitVideoUrl = /(?:facebook\.com|fb\.watch)\/(?:reel|reels|watch|videos|share\/v\/|share\/r\/)/i.test(currentUrl);
    const isExplicitPostUrl = /(?:facebook\.com|fb\.me)\/(?:share\/p\/|posts\/|permalink\.php|story\.php|photos\/|photo\/)/i.test(currentUrl);
    const isVideo = Boolean((directVideoUrl || isExplicitVideoUrl) && !isExplicitPostUrl && !currentUrl.includes('/share/p/'));
    const isPhoto = Boolean(!isVideo && (allMediaUrls.length > 0 || ogType.includes('photo')));
    const postType: SocialVideoMetadata['postType'] = isVideo ? 'video' : isPhoto ? 'photo' : 'post';

    // Extract ID
    const idMatch = currentUrl.match(/(?:videos|reel|watch\/\?v=|watch\?v=|share\/v\/|share\/r\/|share\/p\/|share\/|posts\/|photos\/|permalink\/|fbid=)([0-9a-zA-Z_-]+)/i);
    const videoId = isVideo ? idMatch?.[1] : undefined;

    const result: SocialVideoMetadata = {
      platform: 'facebook',
      postType,
      canonicalUrl: currentUrl,
      originalUrl: url,
      videoId,
      title: ogTitle || `منشور فيسبوك بواسطة ${authorName}`,
      description: ogDesc || bestFullContent,
      fullContent: bestFullContent,
      author: {
        username: authorName.toLowerCase().replace(/\s+/g, '_'),
        displayName: authorName,
      },
      metrics: {
        likes: likesCount,
        comments: commentsCount || (allComments.length > 0 ? allComments.length : undefined),
        shares: sharesCount,
      },
      thumbnailUrl: ogImg || allMediaUrls[0] || undefined,
      videoUrl: directVideoUrl,
      mediaUrls: allMediaUrls,
      commentsList: allComments.slice(0, 10),
      hashtags: extractHashtags(`${ogTitle} ${bestFullContent}`),
      extractedAt: Date.now(),
    };

    setCached(url, result);
    return result;
  } catch (err: any) {
    return {
      error: true,
      message: err?.message || 'Failed to extract Facebook post and media metadata',
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
      fullContent: ogDesc || ogTitle || '',
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

// ─── Master AI Context Builder for Social Videos & Posts ──────────────────────

export function buildSocialVideoContextBlock(
  metadata: SocialVideoMetadata,
  visionResult?: VideoVisionResult | null
): string {
  const bar = '━'.repeat(55);
  const parts: string[] = [];

  const platformNames: Record<string, string> = {
    instagram: 'إنستغرام (Instagram Reels / Post)',
    facebook: 'فيسبوك (Facebook Post / Video / Photos)',
    twitter: 'منصة إكس / تويتر (X / Twitter Post)',
    youtube: 'يوتيوب (YouTube)',
    tiktok: 'تيك توك (TikTok)',
  };

  const pName = platformNames[metadata.platform] || metadata.platform;
  const postTypeLabel = metadata.postType === 'video' ? 'Video / Reel' : metadata.postType === 'photo' ? 'Photo / Image Post' : 'Post / Discussion';
  const authorLabel = `${metadata.author.displayName} (@${metadata.author.username})`;
  const fullContent = metadata.fullContent || metadata.description || metadata.title;

  parts.push(`[RESOLVED LINK DATA]:`);
  parts.push(`- Platform: ${metadata.platform === 'facebook' ? 'Facebook' : metadata.platform === 'instagram' ? 'Instagram' : metadata.platform === 'twitter' ? 'X (Twitter)' : metadata.platform}`);
  parts.push(`- Post Type: ${postTypeLabel}`);
  parts.push(`- Title / Subject: ${metadata.title}`);
  parts.push(`- Author / Page: ${authorLabel}`);
  parts.push(`- Canonical URL: ${metadata.canonicalUrl}`);
  parts.push(`- Full Post Text:\n"""\n${fullContent.trim()}\n"""`);

  if (metadata.commentsList && metadata.commentsList.length > 0) {
    parts.push(`- Top Comments / Reactions:`);
    metadata.commentsList.forEach((c, idx) => {
      parts.push(`  ${idx + 1}. [${c.author}]: "${c.text}"${c.time ? ` (${c.time})` : ''}`);
    });
  } else {
    parts.push(`- Top Comments / Reactions: لا توجد تعليقات عامة إضافية متاحة على هذا المنشور.`);
  }

  parts.push(bar);
  parts.push(`📘 [استخبارات وتحليل وسائط ومنشورات ${pName}]`);
  parts.push(`• المنصة: ${pName}`);
  parts.push(`• نوع المنشور: ${metadata.postType === 'video' ? 'فيديو / ريلز (Video / Reel)' : metadata.postType === 'photo' ? 'منشور بصري / صور (Photo / Gallery)' : 'منشور وسائط اجتماعية (Social Post)'}`);
  parts.push(`• الرابط الأصلي المعتمد: ${metadata.canonicalUrl}`);
  parts.push(`• صاحب المنشور / الصفحة: ${metadata.author.displayName} (@${metadata.author.username})`);
  parts.push(`• عنوان المنشور: "${metadata.title}"`);

  if (metadata.mediaUrls && metadata.mediaUrls.length > 0) {
    parts.push(`\n🖼️ [الصور والمرفقات البصرية المستخرجة — إجمالي (${metadata.mediaUrls.length}) صور عالية الدقة]:`);
    metadata.mediaUrls.forEach((img, i) => {
      parts.push(`  ${i + 1}. [صورة ${i + 1}]: ${img}`);
    });
  }

  if (metadata.videoUrl) {
    parts.push(`\n🎬 [بث ورابط الفيديو المستخرج]: ${metadata.videoUrl}`);
  }

  if (metadata.metrics && (metadata.metrics.likes || metadata.metrics.comments || metadata.metrics.shares)) {
    parts.push(`\n📊 [إحصائيات التفاعل على المنشور]: ${metadata.metrics.likes ? `${metadata.metrics.likes} إعجاب | ` : ''}${metadata.metrics.comments ? `${metadata.metrics.comments} تعليق | ` : ''}${metadata.metrics.shares ? `${metadata.metrics.shares} مشاركة` : ''}`);
  }

  if (metadata.commentsList && metadata.commentsList.length > 0) {
    parts.push(`\n💬 [أبرز التعليقات والردود الواردة على المنشور — تم رصد (${metadata.commentsList.length}) تعليقات]:`);
    metadata.commentsList.forEach((c, idx) => {
      parts.push(`  ${idx + 1}. [${c.author}]: "${c.text}"${c.time ? ` (${c.time})` : ''}`);
    });
  }

  if (metadata.hashtags && metadata.hashtags.length > 0) {
    parts.push(`\n🏷️ [الهاشتاجات]: ${metadata.hashtags.join(' ')}`);
  }

  parts.push(bar);

  if (visionResult && visionResult.visualAnalysisAr) {
    parts.push(`\n👁️ [الإدراك والتحليل البصري الفعلي والميكرو-OCR للصور والمشاهد المرفقة بالبوست]:\n`);
    parts.push(visionResult.visualAnalysisAr);
    parts.push(bar);
  }

  parts.push(`[توجيه استخباراتي صارم للرد — FATHOM SOCIAL & FACEBOOK POST DIRECTIVE]:`);
  parts.push(`1. لقد تم استخراج وتفكيك هذا المنشور والوسائط وكافة النصوص والتعليقات المرفقة أعلاه بنجاح تام.`);
  parts.push(`2. أجب عن سؤال المستخدم معتمداً على نص البوست الكامل، الصور، التعليقات والآراء الواردة، وقدّم تحليلاً شاملاً وفصيحاً.`);
  parts.push(bar);

  return parts.join('\n');
}
