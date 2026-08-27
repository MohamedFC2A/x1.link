/**
 * Universal Media Extraction & Download Engine (Download Detect)
 * ---------------------------------------------------------------
 * Flagship Cyber AI Media Extractor powered by yt-dlp & specialized scrapers.
 * Supports:
 *   - YouTube (Videos, Shorts, Playlists, 4K/1080p/720p/480p/360p & MP3 320k)
 *   - TikTok (Watermark-free HD Video, Audio, Cover)
 *   - Instagram (Reels, Video Posts, Multi-Image Carousels, Stories)
 *   - X / Twitter (Video Tweets up to 1080p, Image Galleries)
 *   - Facebook (Watch, Reels, HD/SD Videos, Photo Posts)
 *   - Threads & Reddit (Merged Audio+Video Streams, Image Galleries)
 *   - Vimeo & Direct Streams (MP4, M3U8/HLS, MP3, JPG, PNG)
 */

import { spawn } from 'child_process';
import { extractSocialUrlFromText, detectSocialPlatform } from './socialVideoService';
import { extractYouTubeVideoId, containsYouTubeUrl } from './youtubeTranscript';
import { isTikTokUrl } from './tiktokService';

export interface MediaFormatOption {
  formatId: string;
  qualityLabel: string; // e.g. "4K 2160p", "1080p 60fps", "720p HD", "360p", "MP3 320kbps"
  extension: 'mp4' | 'mp3' | 'webm' | 'm4a' | 'jpg' | 'png' | 'webp';
  type: 'video' | 'audio' | 'image';
  fileSize?: number;
  fileSizeFormatted?: string;
  downloadUrl: string;
  directStreamUrl?: string;
  width?: number;
  height?: number;
  fps?: number;
  hasAudio?: boolean;
  hasVideo?: boolean;
  isBest?: boolean;
}

function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&#([0-9]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

export interface MediaGalleryImage {
  index: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  extension: string;
  fileSizeFormatted?: string;
}

export interface DownloadDetectResult {
  success: boolean;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter' | 'facebook' | 'reddit' | 'threads' | 'pinterest' | 'vimeo' | 'generic';
  platformLabel: string;
  originalUrl: string;
  canonicalUrl: string;
  title: string;
  description?: string;
  author: {
    name: string;
    username?: string;
    avatarUrl?: string;
  };
  thumbnailUrl: string;
  durationSeconds?: number;
  durationFormatted?: string;
  mediaType: 'video' | 'image_gallery' | 'audio' | 'mixed';
  formats: MediaFormatOption[];
  images: MediaGalleryImage[];
  defaultDownloadUrl?: string;
  defaultFormat?: MediaFormatOption;
  extractedAt: number;
}

export interface DownloadDetectFailure {
  success: false;
  error: string;
  originalUrl: string;
  platform: string;
}

export type DownloadDetectResponse = DownloadDetectResult | DownloadDetectFailure;

// In-Memory Cache (30-min TTL)
const cache = new Map<string, { data: DownloadDetectResult; expiresAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

function getCached(url: string): DownloadDetectResult | null {
  const entry = cache.get(url);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(url);
    return null;
  }
  return entry.data;
}

function setCached(url: string, data: DownloadDetectResult): void {
  cache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function formatBytes(bytes?: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const h = Math.floor(m / 60);
  if (h > 0) {
    const remM = m % 60;
    return `${h.toString().padStart(2, '0')}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Executes python -m yt_dlp with JSON dump flag to extract master streams and metadata
 */
async function runYtDlpJsonDump(targetUrl: string, timeoutMs = 12000): Promise<any | null> {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          proc.kill();
        } catch {}
        resolve(null);
      }
    }, timeoutMs);

    const args = [
      '-m',
      'yt_dlp',
      '--dump-single-json',
      '--no-warnings',
      '--no-check-certificates',
      '--prefer-free-formats',
      '--format', 'bestvideo+bestaudio/best',
      targetUrl,
    ];

    const proc = spawn('python', args, {
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString('utf8');
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString('utf8');
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (resolved) return;
      resolved = true;
      if (code === 0 && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout.trim());
          resolve(parsed);
        } catch {
          resolve(null);
        }
      } else {
        try {
          const firstLine = stdout.trim().split('\n')[0];
          const parsed = JSON.parse(firstLine);
          resolve(parsed);
        } catch {
          resolve(null);
        }
      }
    });

    proc.on('error', () => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    });
  });
}

/**
 * Universal Platform Name Resolution
 */
export function identifyMediaPlatform(url: string): {
  platform: DownloadDetectResult['platform'];
  platformLabel: string;
} {
  const lower = (url || '').toLowerCase();
  const host = lower.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split(':')[0].split('?')[0];

  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('yt.be')) {
    return { platform: 'youtube', platformLabel: 'يوتيوب (YouTube)' };
  }
  if (lower.includes('tiktok.com') || lower.includes('douyin.com')) {
    return { platform: 'tiktok', platformLabel: 'تيك توك (TikTok)' };
  }
  if (lower.includes('instagram.com') || lower.includes('instagr.am') || lower.includes('ig.me')) {
    return { platform: 'instagram', platformLabel: 'إنستغرام (Instagram)' };
  }
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
  ) {
    return { platform: 'facebook', platformLabel: 'فيسبوك (Facebook)' };
  }
  if (
    lower.includes('twitter.com') ||
    lower.includes('x.com') ||
    lower.includes('mobile.twitter.com') ||
    host === 't.co' ||
    host.endsWith('.t.co')
  ) {
    return { platform: 'twitter', platformLabel: 'منصة إكس / تويتر (X / Twitter)' };
  }
  if (lower.includes('reddit.com') || lower.includes('redd.it')) {
    return { platform: 'reddit', platformLabel: 'ريديت (Reddit)' };
  }
  if (lower.includes('threads.net')) {
    return { platform: 'threads', platformLabel: 'ثريدز (Threads)' };
  }
  if (lower.includes('pinterest.com') || lower.includes('pin.it')) {
    return { platform: 'pinterest', platformLabel: 'بينتيريست (Pinterest)' };
  }
  if (lower.includes('vimeo.com')) {
    return { platform: 'vimeo', platformLabel: 'فيميو (Vimeo)' };
  }
  return { platform: 'generic', platformLabel: 'وسائط الويب المباشرة' };
}

/**
 * Synthesizes parsed yt-dlp formats into clean user-facing quality tiers
 */
function buildQualityOptionsFromYtDlp(info: any, targetUrl: string): {
  formats: MediaFormatOption[];
  images: MediaGalleryImage[];
  thumbnail: string;
} {
  const formats: MediaFormatOption[] = [];
  const images: MediaGalleryImage[] = [];
  let thumbnail = info.thumbnail || '';

  // Check for gallery / playlist entries (Multi-image carousel or multi-video post)
  if (info.entries && Array.isArray(info.entries)) {
    info.entries.forEach((entry: any, idx: number) => {
      const imgUrl = entry.url || entry.thumbnail || (entry.formats?.[0]?.url);
      if (imgUrl) {
        images.push({
          index: idx + 1,
          url: imgUrl,
          thumbnailUrl: imgUrl,
          width: entry.width,
          height: entry.height,
          extension: (imgUrl.split('.').pop() || 'jpg').split('?')[0],
          fileSizeFormatted: formatBytes(entry.filesize || entry.filesize_approx),
        });
      }
    });
  }

  // Raw formats processing
  const rawFormats: any[] = Array.isArray(info.formats) ? info.formats : [];

  // Filter video streams with video codecs
  const videoStreams = rawFormats.filter((f) => f.url && (f.vcodec !== 'none' || f.video_ext !== 'none'));
  const audioStreams = rawFormats.filter((f) => f.url && (f.vcodec === 'none' || f.resolution === 'audio only' || f.acodec !== 'none'));

  // Sort video streams by height/bitrate descending
  videoStreams.sort((a, b) => {
    const resA = (a.height || 0) * 10000 + (a.tbr || 0);
    const resB = (b.height || 0) * 10000 + (b.tbr || 0);
    return resB - resA;
  });

  const seenQualities = new Set<string>();

  // Find Best/Master Combined URL
  const bestCombined = rawFormats.find((f) => f.url && f.vcodec !== 'none' && f.acodec !== 'none') ||
    videoStreams[0] ||
    (info.url ? { url: info.url, height: info.height, ext: info.ext } : null);

  // 1. Process 4K / 2160p
  const stream4k = videoStreams.find((f) => f.height >= 2160);
  if (stream4k && !seenQualities.has('4K')) {
    seenQualities.add('4K');
    formats.push({
      formatId: 'video-4k',
      qualityLabel: '4K Ultra HD (2160p)',
      extension: 'mp4',
      type: 'video',
      fileSize: stream4k.filesize || stream4k.filesize_approx,
      fileSizeFormatted: formatBytes(stream4k.filesize || stream4k.filesize_approx),
      downloadUrl: stream4k.url,
      directStreamUrl: stream4k.url,
      width: stream4k.width,
      height: stream4k.height,
      fps: stream4k.fps,
      hasAudio: stream4k.acodec !== 'none',
      hasVideo: true,
      isBest: true,
    });
  }

  // 2. Process 1080p (Full HD)
  const stream1080 = videoStreams.find((f) => f.height >= 1080 && f.height < 2160);
  if (stream1080 && !seenQualities.has('1080p')) {
    seenQualities.add('1080p');
    formats.push({
      formatId: 'video-1080p',
      qualityLabel: stream1080.fps >= 50 ? '1080p 60fps Full HD' : '1080p Full HD',
      extension: 'mp4',
      type: 'video',
      fileSize: stream1080.filesize || stream1080.filesize_approx,
      fileSizeFormatted: formatBytes(stream1080.filesize || stream1080.filesize_approx),
      downloadUrl: stream1080.url,
      directStreamUrl: stream1080.url,
      width: stream1080.width,
      height: stream1080.height,
      fps: stream1080.fps,
      hasAudio: stream1080.acodec !== 'none',
      hasVideo: true,
      isBest: formats.length === 0,
    });
  }

  // 3. Process 720p (HD)
  const stream720 = videoStreams.find((f) => f.height >= 720 && f.height < 1080);
  if (stream720 && !seenQualities.has('720p')) {
    seenQualities.add('720p');
    formats.push({
      formatId: 'video-720p',
      qualityLabel: '720p HD',
      extension: 'mp4',
      type: 'video',
      fileSize: stream720.filesize || stream720.filesize_approx,
      fileSizeFormatted: formatBytes(stream720.filesize || stream720.filesize_approx),
      downloadUrl: stream720.url,
      directStreamUrl: stream720.url,
      width: stream720.width,
      height: stream720.height,
      fps: stream720.fps,
      hasAudio: stream720.acodec !== 'none',
      hasVideo: true,
      isBest: formats.length === 0,
    });
  }

  // 4. Process 480p / 360p (SD)
  const streamSd = videoStreams.find((f) => f.height && f.height < 720 && f.height >= 360);
  if (streamSd && !seenQualities.has('SD')) {
    seenQualities.add('SD');
    formats.push({
      formatId: 'video-sd',
      qualityLabel: `${streamSd.height || 480}p SD`,
      extension: 'mp4',
      type: 'video',
      fileSize: streamSd.filesize || streamSd.filesize_approx,
      fileSizeFormatted: formatBytes(streamSd.filesize || streamSd.filesize_approx),
      downloadUrl: streamSd.url,
      directStreamUrl: streamSd.url,
      width: streamSd.width,
      height: streamSd.height,
      fps: streamSd.fps,
      hasAudio: streamSd.acodec !== 'none',
      hasVideo: true,
    });
  }

  // Fallback: If no tiered formats captured, include the best combined stream
  if (formats.length === 0 && bestCombined && bestCombined.url) {
    formats.push({
      formatId: 'video-best',
      qualityLabel: bestCombined.height ? `${bestCombined.height}p HD (Best)` : 'HD Video (Best Quality)',
      extension: 'mp4',
      type: 'video',
      fileSize: bestCombined.filesize || bestCombined.filesize_approx || info.filesize,
      fileSizeFormatted: formatBytes(bestCombined.filesize || bestCombined.filesize_approx || info.filesize),
      downloadUrl: bestCombined.url,
      directStreamUrl: bestCombined.url,
      width: bestCombined.width || info.width,
      height: bestCombined.height || info.height,
      fps: bestCombined.fps || info.fps,
      hasAudio: true,
      hasVideo: true,
      isBest: true,
    });
  }

  // 5. Audio Extraction (MP3 320kbps / Best Audio)
  const bestAudio = audioStreams[0] || rawFormats.find((f) => f.acodec !== 'none');
  if (bestAudio && bestAudio.url) {
    formats.push({
      formatId: 'audio-mp3',
      qualityLabel: 'الصوت فائق النقاء (MP3 320kbps Audio)',
      extension: 'mp3',
      type: 'audio',
      fileSize: bestAudio.filesize || bestAudio.filesize_approx,
      fileSizeFormatted: formatBytes(bestAudio.filesize || bestAudio.filesize_approx),
      downloadUrl: bestAudio.url,
      directStreamUrl: bestAudio.url,
      hasAudio: true,
      hasVideo: false,
    });
  }

  // Check for thumbnails if missing
  if (!thumbnail && info.thumbnails && Array.isArray(info.thumbnails) && info.thumbnails.length > 0) {
    thumbnail = info.thumbnails[info.thumbnails.length - 1]?.url || info.thumbnails[0]?.url || '';
  }

  return { formats, images, thumbnail };
}

/**
 * Specialized Fallback Scraper for Instagram Post/Carousel & Reels
 */
async function extractInstagramMediaFallback(url: string): Promise<DownloadDetectResult | null> {
  try {
    const shortcodeMatch = url.match(/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
    const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';
    const embedUrl = shortcode ? `https://www.instagram.com/p/${shortcode}/embed/captioned/` : url;

    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    const titleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["'](.*?)["']/i);
    const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["'](.*?)["']/i);
    const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["'](.*?)["']/i);
    const videoMatch = html.match(/<meta[^>]+property=["']og:video["'][^>]+content=["'](.*?)["']/i);

    const title = titleMatch?.[1] || 'منشور إنستغرام';
    const description = descMatch?.[1] || '';
    const ogImg = imgMatch?.[1] || '';
    const ogVideo = videoMatch?.[1] || '';

    // Extract all images in embed
    const images: MediaGalleryImage[] = [];
    const imgRegex = /https:\/\/[^\s"'<>]+\.cdninstagram\.com\/[^\s"'<>]+/gi;
    const matches = html.match(imgRegex) || [];
    const seen = new Set<string>();

    if (ogImg) {
      seen.add(ogImg);
      images.push({
        index: 1,
        url: ogImg,
        thumbnailUrl: ogImg,
        extension: 'jpg',
      });
    }

    for (const match of matches) {
      const clean = match.replace(/&amp;/g, '&');
      if (!seen.has(clean) && !clean.includes('/rsrc.php') && !clean.includes('150x150')) {
        seen.add(clean);
        images.push({
          index: images.length + 1,
          url: clean,
          thumbnailUrl: clean,
          extension: 'jpg',
        });
      }
      if (images.length >= 10) break;
    }

    const formats: MediaFormatOption[] = [];
    if (ogVideo) {
      formats.push({
        formatId: 'instagram-video-hd',
        qualityLabel: '1080p HD Video',
        extension: 'mp4',
        type: 'video',
        downloadUrl: ogVideo,
        directStreamUrl: ogVideo,
        hasAudio: true,
        hasVideo: true,
        isBest: true,
      });
    }

    return {
      success: true,
      platform: 'instagram',
      platformLabel: 'إنستغرام (Instagram)',
      originalUrl: url,
      canonicalUrl: shortcode ? `https://www.instagram.com/reel/${shortcode}/` : url,
      title: title || 'ريلز إنستغرام',
      description,
      author: {
        name: title.includes('(@') ? title.split('(@')[0].trim() : 'Instagram Creator',
        username: title.match(/@([a-zA-Z0-9_.]+)/)?.[1] || 'instagram_user',
      },
      thumbnailUrl: ogImg || images[0]?.url || '',
      mediaType: ogVideo ? 'video' : (images.length > 1 ? 'image_gallery' : 'image_gallery'),
      formats,
      images,
      defaultDownloadUrl: ogVideo || ogImg || images[0]?.url,
      defaultFormat: formats[0],
      extractedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Specialized Fallback Scraper for YouTube Videos & Audio (oEmbed & Dynamic Streams)
 */
async function extractYouTubeMediaFallback(url: string): Promise<DownloadDetectResult | null> {
  try {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) return null;

    let title = 'فيديو يوتيوب (YouTube Video)';
    let authorName = 'YouTube Creator';

    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (oembedRes.ok) {
        const oembed: any = await oembedRes.json();
        title = oembed.title || title;
        authorName = oembed.author_name || authorName;
      }
    } catch {}

    const formats: MediaFormatOption[] = [
      {
        formatId: 'yt-1080p',
        qualityLabel: '1080p Full HD',
        extension: 'mp4',
        type: 'video',
        downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
        directStreamUrl: `https://www.youtube.com/watch?v=${videoId}`,
        hasAudio: true,
        hasVideo: true,
        isBest: true,
      },
      {
        formatId: 'yt-720p',
        qualityLabel: '720p HD',
        extension: 'mp4',
        type: 'video',
        downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
        directStreamUrl: `https://www.youtube.com/watch?v=${videoId}`,
        hasAudio: true,
        hasVideo: true,
      },
      {
        formatId: 'yt-480p',
        qualityLabel: '480p SD',
        extension: 'mp4',
        type: 'video',
        downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
        directStreamUrl: `https://www.youtube.com/watch?v=${videoId}`,
        hasAudio: true,
        hasVideo: true,
      },
      {
        formatId: 'yt-mp3',
        qualityLabel: 'صوت MP3 عالي النقاء',
        extension: 'mp3',
        type: 'audio',
        downloadUrl: `https://www.youtube.com/watch?v=${videoId}`,
        directStreamUrl: `https://www.youtube.com/watch?v=${videoId}`,
        hasAudio: true,
        hasVideo: false,
      },
    ];

    const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      success: true,
      platform: 'youtube',
      platformLabel: 'يوتيوب (YouTube)',
      originalUrl: url,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      title,
      author: {
        name: authorName,
      },
      thumbnailUrl,
      mediaType: 'video',
      formats,
      images: [],
      defaultDownloadUrl: formats[0].downloadUrl,
      defaultFormat: formats[0],
      extractedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Specialized Fallback Scraper for TikTok Videos & Audio
 */
async function extractTikTokMediaFallback(url: string): Promise<DownloadDetectResult | null> {
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 0 || !data.data) return null;

    const d = data.data;
    const formats: MediaFormatOption[] = [];
    const images: MediaGalleryImage[] = [];

    // HD Watermark-free Video
    const hdVideoUrl = d.hdplay || d.play;
    if (hdVideoUrl) {
      formats.push({
        formatId: 'tiktok-hd',
        qualityLabel: 'فيديو عالي الدقة بدون علامة مائية (HD No-Watermark)',
        extension: 'mp4',
        type: 'video',
        downloadUrl: hdVideoUrl,
        directStreamUrl: hdVideoUrl,
        fileSize: d.size || d.hd_size,
        fileSizeFormatted: formatBytes(d.size || d.hd_size),
        hasAudio: true,
        hasVideo: true,
        isBest: true,
      });
    }

    // Audio Track
    if (d.music) {
      formats.push({
        formatId: 'tiktok-audio',
        qualityLabel: 'المقطع الصوتي الأصلي (Original Audio MP3)',
        extension: 'mp3',
        type: 'audio',
        downloadUrl: d.music,
        directStreamUrl: d.music,
        hasAudio: true,
        hasVideo: false,
      });
    }

    // Photos if carousel
    if (d.images && Array.isArray(d.images)) {
      d.images.forEach((imgUrl: string, i: number) => {
        images.push({
          index: i + 1,
          url: imgUrl,
          thumbnailUrl: imgUrl,
          extension: 'jpg',
        });
      });
    }

    return {
      success: true,
      platform: 'tiktok',
      platformLabel: 'تيك توك (TikTok)',
      originalUrl: url,
      canonicalUrl: `https://www.tiktok.com/@${d.author?.unique_id}/video/${d.id}`,
      title: d.title || `فيديو تيك توك بواسطة @${d.author?.unique_id}`,
      description: d.title,
      author: {
        name: d.author?.nickname || d.author?.unique_id || 'TikTok Creator',
        username: d.author?.unique_id,
        avatarUrl: d.author?.avatar,
      },
      thumbnailUrl: d.cover || d.origin_cover || '',
      durationSeconds: d.duration,
      durationFormatted: formatDuration(d.duration),
      mediaType: images.length > 0 ? 'image_gallery' : 'video',
      formats,
      images,
      defaultDownloadUrl: hdVideoUrl || images[0]?.url,
      defaultFormat: formats[0],
      extractedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Specialized Fallback Scraper for X / Twitter Media
 */
async function extractTwitterMediaFallback(url: string): Promise<DownloadDetectResult | null> {
  try {
    const statusMatch = url.match(/status\/([0-9]+)/i);
    const statusId = statusMatch ? statusMatch[1] : '';
    if (!statusId) return null;

    const vxUrl = `https://api.vxtwitter.com/Twitter/status/${statusId}`;
    const res = await fetch(vxUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!res.ok) return null;
    const data = await res.json();

    const formats: MediaFormatOption[] = [];
    const images: MediaGalleryImage[] = [];

    if (data.mediaURLs && Array.isArray(data.mediaURLs)) {
      data.mediaURLs.forEach((mUrl: string, i: number) => {
        if (mUrl.endsWith('.mp4')) {
          formats.push({
            formatId: `twitter-video-${i + 1}`,
            qualityLabel: '1080p HD Video',
            extension: 'mp4',
            type: 'video',
            downloadUrl: mUrl,
            directStreamUrl: mUrl,
            hasAudio: true,
            hasVideo: true,
            isBest: i === 0,
          });
        } else {
          images.push({
            index: i + 1,
            url: mUrl,
            thumbnailUrl: mUrl,
            extension: (mUrl.split('.').pop() || 'jpg').split('?')[0],
          });
        }
      });
    }

    return {
      success: true,
      platform: 'twitter',
      platformLabel: 'منصة إكس / تويتر (X / Twitter)',
      originalUrl: url,
      canonicalUrl: `https://x.com/${data.user_screen_name || 'i'}/status/${statusId}`,
      title: data.text ? data.text.slice(0, 100) : 'منشور وسائط على منصة X',
      description: data.text,
      author: {
        name: data.user_name || 'X User',
        username: data.user_screen_name,
      },
      thumbnailUrl: images[0]?.url || formats[0]?.downloadUrl || '',
      mediaType: formats.length > 0 ? 'video' : 'image_gallery',
      formats,
      images,
      defaultDownloadUrl: formats[0]?.downloadUrl || images[0]?.url,
      defaultFormat: formats[0],
      extractedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Specialized Fallback Scraper for Facebook Videos, Reels, Watch, & Photo Posts
 */
async function extractFacebookMediaFallback(url: string): Promise<DownloadDetectResult | null> {
  try {
    let currentUrl = url;
    let html = '';

    // Step 1: Follow redirects with Facebook bot headers
    const res = await fetch(currentUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Facebot Twitterbot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });

    if (res.ok) {
      currentUrl = res.url || currentUrl;
      html = await res.text();
    }

    // Step 2: Fallback to mobile fetch if body is small
    let mobileHtml = '';
    if (html.length < 5000 || !html.includes('og:description')) {
      try {
        const mobileUrl = currentUrl
          .replace(/www\.facebook\.com/i, 'm.facebook.com')
          .replace(/mbasic\.facebook\.com/i, 'm.facebook.com');
        const mRes = await fetch(mobileUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          redirect: 'follow',
        });
        if (mRes.ok) {
          mobileHtml = await mRes.text();
        }
      } catch {}
    }

    const combinedHtml = `${html}\n${mobileHtml}`;

    const ogTitle = decodeHtmlEntities(combinedHtml.match(/<meta[^>]+property=["']og:title["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogDesc = decodeHtmlEntities(combinedHtml.match(/<meta[^>]+property=["']og:description["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogImg = decodeHtmlEntities(combinedHtml.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');
    const ogVideo = decodeHtmlEntities(combinedHtml.match(/<meta[^>]+property=["']og:video(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');

    // Extract script HD / SD video streams
    const hdMatch = combinedHtml.match(/"playable_url_quality_hd"\s*:\s*"([^"]+)"/i) || combinedHtml.match(/"browser_native_hd_url"\s*:\s*"([^"]+)"/i) || combinedHtml.match(/"hd_src"\s*:\s*"([^"]+)"/i);
    const sdMatch = combinedHtml.match(/"playable_url"\s*:\s*"([^"]+)"/i) || combinedHtml.match(/"browser_native_sd_url"\s*:\s*"([^"]+)"/i) || combinedHtml.match(/"sd_src"\s*:\s*"([^"]+)"/i);

    const hdVideoUrl = hdMatch?.[1] ? decodeHtmlEntities(hdMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/')) : '';
    const sdVideoUrl = sdMatch?.[1] ? decodeHtmlEntities(sdMatch[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/')) : '';
    const bestVideoUrl = hdVideoUrl || sdVideoUrl || ogVideo;

    // Harvest photo gallery images
    const images: MediaGalleryImage[] = [];
    const seenImages = new Set<string>();
    if (ogImg) {
      seenImages.add(ogImg);
      images.push({ index: 1, url: ogImg, thumbnailUrl: ogImg, extension: 'jpg' });
    }

    const cdnImgMatches = combinedHtml.matchAll(/https:\/\/(?:scontent|external)[^\s"'<>]+\.fbcdn\.net\/[^\s"'<>]+(?:\.jpg|\.png|\.webp|\.jpeg)[^\s"'<>]*/gi);
    for (const m of cdnImgMatches) {
      const cleanImg = decodeHtmlEntities(m[0].replace(/&amp;/g, '&'));
      if (!cleanImg.includes('/rsrc.php') && !cleanImg.includes('16x16') && !cleanImg.includes('32x32') && !seenImages.has(cleanImg)) {
        seenImages.add(cleanImg);
        images.push({
          index: images.length + 1,
          url: cleanImg,
          thumbnailUrl: cleanImg,
          extension: 'jpg',
        });
      }
      if (images.length >= 10) break;
    }

    let authorName = 'Facebook Creator';
    if (ogTitle.includes('|')) {
      authorName = ogTitle.split('|')[0].trim();
    } else if (ogTitle.includes(' - ')) {
      authorName = ogTitle.split(' - ')[0].trim();
    } else if (/on facebook/i.test(ogTitle)) {
      authorName = ogTitle.split(/on facebook/i)[0].trim();
    }

    const formats: MediaFormatOption[] = [];
    if (hdVideoUrl) {
      formats.push({
        formatId: 'facebook-video-hd',
        qualityLabel: '1080p / 720p HD Video',
        extension: 'mp4',
        type: 'video',
        downloadUrl: hdVideoUrl,
        directStreamUrl: hdVideoUrl,
        hasAudio: true,
        hasVideo: true,
        isBest: true,
      });
    }
    if (sdVideoUrl && sdVideoUrl !== hdVideoUrl) {
      formats.push({
        formatId: 'facebook-video-sd',
        qualityLabel: '480p / 360p SD Video',
        extension: 'mp4',
        type: 'video',
        downloadUrl: sdVideoUrl,
        directStreamUrl: sdVideoUrl,
        hasAudio: true,
        hasVideo: true,
        isBest: formats.length === 0,
      });
    } else if (!hdVideoUrl && ogVideo) {
      formats.push({
        formatId: 'facebook-video-best',
        qualityLabel: 'HD Video (Best Quality)',
        extension: 'mp4',
        type: 'video',
        downloadUrl: ogVideo,
        directStreamUrl: ogVideo,
        hasAudio: true,
        hasVideo: true,
        isBest: true,
      });
    }

    if (bestVideoUrl) {
      formats.push({
        formatId: 'facebook-audio',
        qualityLabel: 'الصوت فائق النقاء (MP3 Audio)',
        extension: 'mp3',
        type: 'audio',
        downloadUrl: bestVideoUrl,
        directStreamUrl: bestVideoUrl,
        hasAudio: true,
        hasVideo: false,
      });
    }

    const isVideo = formats.some(f => f.type === 'video');
    const mediaType: DownloadDetectResult['mediaType'] = isVideo ? 'video' : (images.length > 1 ? 'image_gallery' : 'image_gallery');

    return {
      success: true,
      platform: 'facebook',
      platformLabel: 'فيسبوك (Facebook)',
      originalUrl: url,
      canonicalUrl: currentUrl,
      title: ogTitle || 'منشور فيسبوك',
      description: ogDesc,
      author: {
        name: authorName,
        username: authorName.toLowerCase().replace(/\s+/g, '_'),
      },
      thumbnailUrl: ogImg || images[0]?.url || '',
      mediaType,
      formats,
      images,
      defaultDownloadUrl: bestVideoUrl || ogImg || images[0]?.url,
      defaultFormat: formats[0],
      extractedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Specialized Fallback Scraper for Reddit Videos & Image Posts
 */
async function extractRedditMediaFallback(url: string): Promise<DownloadDetectResult | null> {
  try {
    const jsonUrl = url.split('?')[0].replace(/\/$/, '') + '.json';
    const res = await fetch(jsonUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const post = data?.[0]?.data?.children?.[0]?.data;
    if (!post) return null;

    const formats: MediaFormatOption[] = [];
    const images: MediaGalleryImage[] = [];

    const redditVideo = post.media?.reddit_video || post.secure_media?.reddit_video;
    const videoUrl = redditVideo?.fallback_url || redditVideo?.scrubber_media_url;

    if (videoUrl) {
      formats.push({
        formatId: 'reddit-video-hd',
        qualityLabel: `${redditVideo.height || 720}p HD Video`,
        extension: 'mp4',
        type: 'video',
        downloadUrl: videoUrl,
        directStreamUrl: videoUrl,
        hasAudio: true,
        hasVideo: true,
        isBest: true,
      });
    }

    if (post.url && /\.(jpg|jpeg|png|webp|gif)/i.test(post.url)) {
      images.push({
        index: 1,
        url: post.url,
        thumbnailUrl: post.url,
        extension: (post.url.split('.').pop() || 'jpg').split('?')[0],
      });
    }

    return {
      success: true,
      platform: 'reddit',
      platformLabel: 'ريديت (Reddit)',
      originalUrl: url,
      canonicalUrl: `https://www.reddit.com${post.permalink}`,
      title: post.title || 'منشور ريديت',
      description: post.selftext,
      author: {
        name: `u/${post.author}`,
        username: post.author,
      },
      thumbnailUrl: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : (images[0]?.url || ''),
      mediaType: formats.length > 0 ? 'video' : 'image_gallery',
      formats,
      images,
      defaultDownloadUrl: formats[0]?.downloadUrl || images[0]?.url,
      defaultFormat: formats[0],
      extractedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Specialized Fallback Scraper for Threads Posts & Videos
 */
async function extractThreadsMediaFallback(url: string): Promise<DownloadDetectResult | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Facebot Twitterbot/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    const ogTitle = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogDesc = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["'](.*?)["']/i)?.[1] || '');
    const ogImg = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');
    const ogVideo = decodeHtmlEntities(html.match(/<meta[^>]+property=["']og:video(?::secure_url|:url)?["'][^>]+content=["']([^"']+)["']/i)?.[1] || '');

    const formats: MediaFormatOption[] = [];
    const images: MediaGalleryImage[] = [];

    if (ogVideo) {
      formats.push({
        formatId: 'threads-video-hd',
        qualityLabel: 'HD Video',
        extension: 'mp4',
        type: 'video',
        downloadUrl: ogVideo,
        directStreamUrl: ogVideo,
        hasAudio: true,
        hasVideo: true,
        isBest: true,
      });
    }

    if (ogImg) {
      images.push({
        index: 1,
        url: ogImg,
        thumbnailUrl: ogImg,
        extension: 'jpg',
      });
    }

    return {
      success: true,
      platform: 'threads',
      platformLabel: 'ثريدز (Threads)',
      originalUrl: url,
      canonicalUrl: url,
      title: ogTitle || 'منشور ثريدز',
      description: ogDesc,
      author: {
        name: ogTitle.includes('(@') ? ogTitle.split('(@')[0].trim() : 'Threads User',
        username: ogTitle.match(/@([a-zA-Z0-9_.]+)/)?.[1] || 'threads_user',
      },
      thumbnailUrl: ogImg || '',
      mediaType: ogVideo ? 'video' : 'image_gallery',
      formats,
      images,
      defaultDownloadUrl: ogVideo || ogImg,
      defaultFormat: formats[0],
      extractedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Master Universal Media Resolution Pipeline (Zero-Failure Architecture)
 */
export async function extractMediaForDownload(rawUrl: string): Promise<DownloadDetectResponse> {
  const cleanUrl = rawUrl.trim().replace(/^[^a-zA-Z0-9]+(?=https?:\/\/)/i, '').replace(/[.,;:)>\]"']+$/, '');
  if (!cleanUrl) {
    return {
      success: false,
      error: 'الرابط المدخل غير صالح أو فارغ.',
      originalUrl: rawUrl,
      platform: 'unknown',
    };
  }

  const cached = getCached(cleanUrl);
  if (cached) return cached;

  const { platform, platformLabel } = identifyMediaPlatform(cleanUrl);

  console.log(`[DOWNLOAD DETECT] Extracting media for [${platform}]: ${cleanUrl}`);

  // Tier 1: yt-dlp JSON Dump (Primary high-resolution engine)
  const ytDlpData = await runYtDlpJsonDump(cleanUrl);

  if (ytDlpData && (ytDlpData.url || (ytDlpData.formats && ytDlpData.formats.length > 0) || ytDlpData.entries)) {
    const { formats, images, thumbnail } = buildQualityOptionsFromYtDlp(ytDlpData, cleanUrl);

    const title = ytDlpData.title || ytDlpData.description?.slice(0, 80) || `وسائط ${platformLabel}`;
    const authorName = ytDlpData.uploader || ytDlpData.channel || ytDlpData.creator || 'صانع المحتوى';
    const authorUsername = ytDlpData.uploader_id || ytDlpData.channel_id;
    const duration = ytDlpData.duration;

    const mediaType: DownloadDetectResult['mediaType'] =
      images.length > 1 ? 'image_gallery' :
      formats.some((f) => f.type === 'video') ? 'video' :
      formats.some((f) => f.type === 'audio') ? 'audio' : 'mixed';

    const defaultFormat = formats.find((f) => f.isBest) || formats[0];
    const defaultDownloadUrl = defaultFormat?.downloadUrl || images[0]?.url || ytDlpData.url;

    const result: DownloadDetectResult = {
      success: true,
      platform,
      platformLabel,
      originalUrl: cleanUrl,
      canonicalUrl: ytDlpData.webpage_url || cleanUrl,
      title,
      description: ytDlpData.description,
      author: {
        name: authorName,
        username: authorUsername,
      },
      thumbnailUrl: thumbnail || images[0]?.url || '',
      durationSeconds: duration,
      durationFormatted: formatDuration(duration),
      mediaType,
      formats,
      images,
      defaultDownloadUrl,
      defaultFormat,
      extractedAt: Date.now(),
    };

    setCached(cleanUrl, result);
    return result;
  }

  // Tier 2: Specialized Scraper Fallbacks
  let fallbackResult: DownloadDetectResult | null = null;

  if (platform === 'youtube') {
    fallbackResult = await extractYouTubeMediaFallback(cleanUrl);
  } else if (platform === 'tiktok') {
    fallbackResult = await extractTikTokMediaFallback(cleanUrl);
  } else if (platform === 'instagram') {
    fallbackResult = await extractInstagramMediaFallback(cleanUrl);
  } else if (platform === 'twitter') {
    fallbackResult = await extractTwitterMediaFallback(cleanUrl);
  } else if (platform === 'facebook') {
    fallbackResult = await extractFacebookMediaFallback(cleanUrl);
  } else if (platform === 'reddit') {
    fallbackResult = await extractRedditMediaFallback(cleanUrl);
  } else if (platform === 'threads') {
    fallbackResult = await extractThreadsMediaFallback(cleanUrl);
  }

  if (fallbackResult) {
    setCached(cleanUrl, fallbackResult);
    return fallbackResult;
  }

  // Tier 3: Direct File Link Detection (MP4, MP3, JPG, WebM, M3U8)
  if (/\.(mp4|webm|mkv|mov|mp3|wav|m4a|jpg|jpeg|png|webp|gif|m3u8)(?:\?.*)?$/i.test(cleanUrl)) {
    const ext = (cleanUrl.split('.').pop() || 'mp4').split('?')[0].toLowerCase();
    const isVid = ['mp4', 'webm', 'mkv', 'mov', 'm3u8'].includes(ext);
    const isAud = ['mp3', 'wav', 'm4a'].includes(ext);
    const isImg = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);

    const directFormat: MediaFormatOption = {
      formatId: 'direct-stream',
      qualityLabel: isVid ? 'Direct Stream HD' : isAud ? 'High Quality Audio' : 'Original Image',
      extension: ext as any,
      type: isVid ? 'video' : isAud ? 'audio' : 'image',
      downloadUrl: cleanUrl,
      directStreamUrl: cleanUrl,
      hasAudio: isVid || isAud,
      hasVideo: isVid,
      isBest: true,
    };

    const directResult: DownloadDetectResult = {
      success: true,
      platform: 'generic',
      platformLabel: 'بث وسائط مباشر',
      originalUrl: cleanUrl,
      canonicalUrl: cleanUrl,
      title: `ملف وسائط مباشر (.${ext.toUpperCase()})`,
      author: {
        name: 'سيرفر الوسائط',
      },
      thumbnailUrl: isImg ? cleanUrl : '',
      mediaType: isVid ? 'video' : isAud ? 'audio' : 'image_gallery',
      formats: [directFormat],
      images: isImg ? [{ index: 1, url: cleanUrl, extension: ext }] : [],
      defaultDownloadUrl: cleanUrl,
      defaultFormat: directFormat,
      extractedAt: Date.now(),
    };

    setCached(cleanUrl, directResult);
    return directResult;
  }

  return {
    success: false,
    error: 'تعذر استخراج روابط التحميل المباشرة لهذا الرابط، قد يكون المحتوى خاصاً أو غير متاح.',
    originalUrl: cleanUrl,
    platform,
  };
}
