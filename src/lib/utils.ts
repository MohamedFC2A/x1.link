import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DetectedUrlInfo {
  hasUrl: boolean;
  cleanUrl: string | null;
  domain: string | null;
  remainingText: string;
}

/**
 * Robustly detects, extracts, and normalizes URLs of any length from raw text.
 * Handles ultra-long URLs, query parameters, fragments, IP addresses, ports,
 * protocols (https://, http://, www.), and clean trailing punctuation removal.
 */
export function detectAndExtractUrl(rawText: string): DetectedUrlInfo {
  if (!rawText || typeof rawText !== 'string') {
    return { hasUrl: false, cleanUrl: null, domain: null, remainingText: rawText || '' };
  }

  // 1. Matches explicit http/https/ws/wss URLs of any length, including complex query params and fragments
  const explicitMatch = rawText.match(/(?:\/|\s|^)(https?:\/\/[^\s<>"'{}|\\^`]+)/i);

  // 2. Matches www. domains with any paths/params
  const wwwMatch = rawText.match(/(?:\/|\s|^)(www\.[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+[^\s<>"'{}|\\^`]*)/i);

  // 3. Matches IP addresses with optional ports (e.g. 192.168.1.1:8080, 10.0.0.1)
  const ipMatch = rawText.match(/(?:\/|\s|^)(https?:\/\/)?((?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?(?:\/[^\s<>"'{}|\\^`]*)?)/i);

  // 4. Matches domain.tld formats (e.g. upstore.one, github.com, sub.target.co.uk)
  const domainMatch = rawText.match(/(?:\/|\s|^)([a-zA-Z0-9-]+\.(?:[a-zA-Z0-9-]+\.)*(?:com|org|net|io|app|link|dev|ai|co|uk|de|me|info|tv|cc|xyz|site|online|tech|store|top|cloud|ca|fr|jp|ru|in|edu|gov|one|space|fun|club|pro|vip|world|life|zone|art|eg|sa|ae|qa|kw|bh|om|ye|ly|sy|iq|jo|sd|ma|dz|tn|is|to|so|sh|gg|page|live|agency|services)(?::\d{1,5})?(?:\/[^\s<>"'{}|\\^`]*)?)/i);

  let rawUrlFound = '';

  if (explicitMatch && explicitMatch[1]) {
    rawUrlFound = explicitMatch[1];
  } else if (wwwMatch && wwwMatch[1]) {
    rawUrlFound = wwwMatch[1];
  } else if (ipMatch && ipMatch[2]) {
    rawUrlFound = (ipMatch[1] || '') + ipMatch[2];
  } else if (domainMatch && domainMatch[1]) {
    rawUrlFound = domainMatch[1];
  }

  if (!rawUrlFound) {
    return { hasUrl: false, cleanUrl: null, domain: null, remainingText: rawText };
  }

  // Strip unwanted surrounding brackets, trailing punctuation or quotes commonly attached in prose
  let sanitized = rawUrlFound.trim();
  sanitized = sanitized.replace(/^[^a-zA-Z0-9]+(?=https?:\/\/)/i, '');
  sanitized = sanitized.replace(/^\/+/, '');
  sanitized = sanitized.replace(/[.,;:)>\]"']+$/, ''); // Strip trailing punctuation attached to end of URL

  if (!/^https?:\/\//i.test(sanitized)) {
    sanitized = 'https://' + sanitized;
  }

  let finalUrl: string | null = null;
  let domain: string | null = null;

  try {
    const parsed = new URL(sanitized);
    finalUrl = parsed.href;
    domain = parsed.hostname;
  } catch {
    if (/^https?:\/\/[a-zA-Z0-9.-]+/i.test(sanitized)) {
      finalUrl = sanitized;
      domain = sanitized.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
    }
  }

  if (!finalUrl) {
    return { hasUrl: false, cleanUrl: null, domain: null, remainingText: rawText };
  }

  // Calculate remaining text cleanly
  let remainingText = rawText.replace(rawUrlFound, '').trim();
  remainingText = remainingText.replace(/\[?(?:رابط|الرابط|link)(?:\s*رقم)?\s*#?\d+\]?:?/gi, ' ');
  remainingText = remainingText.replace(/^\/+\s*/, '').replace(/\s{2,}/g, ' ').trim();

  return {
    hasUrl: true,
    cleanUrl: finalUrl,
    domain,
    remainingText
  };
}

/**
 * Generates a high-resolution favicon/logo URL for any given domain or URL with canonical platform resolution.
 */
export function getFaviconUrl(domainOrUrl: string | null | undefined): string | null {
  if (!domainOrUrl || !domainOrUrl.trim()) return null;
  try {
    let clean = domainOrUrl.trim().toLowerCase();
    if (/^https?:\/\//i.test(clean)) {
      const parsed = new URL(clean);
      clean = parsed.hostname;
    }
    clean = clean.replace(/^www\./i, '').split('/')[0].split(':')[0];
    if (!clean || !clean.includes('.')) return null;

    // Canonicalize top platform shorteners and subdomains
    if (clean.includes('tiktok.com')) clean = 'tiktok.com';
    else if (clean.includes('youtube.com') || clean.includes('youtu.be')) clean = 'youtube.com';
    else if (clean.includes('instagram.com') || clean.includes('instagr.am')) clean = 'instagram.com';
    else if (clean.includes('facebook.com') || clean.includes('fb.watch') || clean.includes('fb.com')) clean = 'facebook.com';
    else if (clean.includes('twitter.com') || clean.includes('x.com') || clean.includes('t.co')) clean = 'x.com';
    else if (clean.includes('linkedin.com') || clean.includes('lnkd.in')) clean = 'linkedin.com';
    else if (clean.includes('reddit.com') || clean.includes('redd.it')) clean = 'reddit.com';
    else if (clean.includes('telegram.org') || clean.includes('t.me')) clean = 'telegram.org';
    else if (clean.includes('discord.com') || clean.includes('discord.gg')) clean = 'discord.com';

    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=128`;
  } catch {
    return null;
  }
}

/**
 * Extracts YouTube Video ID from any YouTube URL (watch, shorts, embed, youtu.be, etc.)
 */
export function extractYouTubeVideoId(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^m\./, '').replace(/^www\./, '');

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = url.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const pathMatch = url.pathname.match(/^\/(?:shorts|embed|live|v|e)\/([a-zA-Z0-9_-]{11})/);
      if (pathMatch?.[1]) return pathMatch[1];
    }

    if (host === 'youtu.be') {
      const pathId = url.pathname.replace(/^\//, '').split('?')[0].split('/')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(pathId)) return pathId;
    }
  } catch {
    const fallback = trimmed.match(/(?:v=|youtu\.be\/|\/(?:shorts|embed|live|v|e)\/)([a-zA-Z0-9_-]{11})/);
    if (fallback?.[1]) return fallback[1];
  }
  return null;
}

/**
 * Checks if a URL is a YouTube Shorts URL specifically
 */
export function isYouTubeShortsUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return /youtube\.com\/shorts\/[a-zA-Z0-9_-]+/i.test(url);
}

/**
 * Checks if a URL belongs to a media/video platform (YouTube, TikTok, Instagram, Twitter, etc.)
 */
export function isMediaOrVideoUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('tiktok.com') ||
    lower.includes('instagram.com') ||
    lower.includes('twitter.com') ||
    lower.includes('x.com') ||
    lower.includes('facebook.com') ||
    lower.includes('fb.watch') ||
    lower.includes('vimeo.com') ||
    lower.includes('dailymotion.com') ||
    lower.includes('soundcloud.com') ||
    lower.includes('spotify.com')
  );
}

/**
 * Returns high-resolution YouTube video thumbnail URL
 */
export function getYouTubeThumbnailUrl(videoId: string | null | undefined): string | null {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Extracts and sanitizes up to maxLimit URLs from text.
 * Returns unique clean URLs, remaining prompt text, and whether limit was reached/exceeded.
 */
export function extractAllCleanUrls(
  rawText: string,
  maxLimit = 5
): {
  urls: string[];
  remainingText: string;
  totalFound: number;
  isLimitExceeded: boolean;
} {
  if (!rawText || typeof rawText !== 'string') {
    return { urls: [], remainingText: rawText || '', totalFound: 0, isLimitExceeded: false };
  }

  // Regex matching http/https/www URLs and standard domain patterns
  const urlRegex = /(?:https?:\/\/[^\s<>"'{}|\\^`]+|www\.[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+[^\s<>"'{}|\\^`]*|[a-zA-Z0-9-]+\.(?:com|org|net|io|app|link|dev|ai|co|uk|de|me|info|tv|cc|xyz|site|online|tech|store|top|cloud|ca|fr|jp|ru|in|edu|gov|one|space|fun|club|pro|vip|world|life|zone|art|eg|sa|ae|qa|kw|bh|om|ye|ly|sy|iq|jo|sd|ma|dz|tn|is|to|so|sh|gg|page|live|agency|services)(?::\d{1,5})?(?:\/[^\s<>"'{}|\\^`]*)?)/gi;

  const rawMatches = rawText.match(urlRegex) || [];
  const cleanList: string[] = [];
  const seen = new Set<string>();

  for (const match of rawMatches) {
    let sanitized = match.trim();
    sanitized = sanitized.replace(/^[^a-zA-Z0-9]+(?=https?:\/\/)/i, '');
    sanitized = sanitized.replace(/^\/+/, '');
    sanitized = sanitized.replace(/[.,;:)>\]"']+$/, '');

    if (!/^https?:\/\//i.test(sanitized)) {
      sanitized = 'https://' + sanitized;
    }

    try {
      const parsed = new URL(sanitized);
      const cleanHref = parsed.href;
      if (!seen.has(cleanHref)) {
        seen.add(cleanHref);
        cleanList.push(cleanHref);
      }
    } catch {
      if (/^https?:\/\/[a-zA-Z0-9.-]+/i.test(sanitized) && !seen.has(sanitized)) {
        seen.add(sanitized);
        cleanList.push(sanitized);
      }
    }
  }

  const totalFound = cleanList.length;
  const isLimitExceeded = totalFound > maxLimit;
  const effectiveUrls = cleanList.slice(0, maxLimit);

  // Compute remaining text with matched URLs removed and strip any [رابط رقم X] markers
  let remainingText = rawText;
  for (const match of rawMatches) {
    remainingText = remainingText.replace(match, ' ');
  }
  remainingText = remainingText.replace(/\[?(?:رابط|الرابط|link)(?:\s*رقم)?\s*#?\d+\]?:?/gi, ' ');
  remainingText = remainingText.replace(/\s{2,}/g, ' ').trim();

  return {
    urls: effectiveUrls,
    remainingText,
    totalFound,
    isLimitExceeded
  };
}

/**
 * Extracts a deduplicated list of all URLs across the entire chat conversation in chronological order.
 */
export function getConversationGlobalUrls(messages: Array<{ role?: string; content?: string }>): string[] {
  const globalUrls: string[] = [];
  const seen = new Set<string>();

  messages.forEach(msg => {
    if (msg.role === 'user' && msg.content) {
      const extracted = extractAllCleanUrls(msg.content, 20);
      extracted.urls.forEach(u => {
        if (!seen.has(u)) {
          seen.add(u);
          globalUrls.push(u);
        }
      });
    }
  });

  return globalUrls;
}

/**
 * Extracts a deduplicated list of all image URLs across the entire chat conversation in chronological order.
 */
export function getConversationGlobalImages(messages: Array<{ role?: string; images?: string[]; image?: string }>): string[] {
  const globalImages: string[] = [];
  const seen = new Set<string>();

  messages.forEach(msg => {
    if (msg.role === 'user') {
      const allImgs = (msg.images && msg.images.length > 0)
        ? msg.images
        : (msg.image ? [msg.image] : []);

      allImgs.forEach(img => {
        if (img && !seen.has(img)) {
          seen.add(img);
          globalImages.push(img);
        }
      });
    }
  });

  return globalImages;
}

/**
 * Generates a clean, correct English format timestamp (e.g. "01:53 AM")
 */
export function formatEnglishTimestamp(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Cleans raw markdown formatting from text to produce ultra-clean, readable plain text
 * suitable for clipboard copying into any app (WhatsApp, Word, Notes, etc.) without
 * markdown hashes (#), bold markers (**), code fences, or internal UI badges.
 */
export function cleanMarkdownForClipboard(rawText: string | null | undefined): string {
  if (!rawText || typeof rawText !== 'string') return '';

  let text = rawText;

  // 1. Remove internal UI badges and action tokens
  text = text.replace(/\[\s*(?:AI|TIME|MEMORY|METADATA|DOWNLOAD)[-\s]?DETECT[-\s]?(?:BADGE|CARD|TIMER|REMINDER|AUTODELETE|BUTTON):[^\]]*\]/gi, '');
  text = text.replace(/(?:AI|TIME|MEMORY|METADATA|DOWNLOAD)[-\s]?DETECT[-\s]?(?:BADGE|CARD|TIMER|REMINDER|AUTODELETE|BUTTON):[^\n]*/gi, '');
  text = text.replace(/\[DOWNLOAD-BUTTON:[^\]]*\]/gi, '');
  text = text.replace(/\[DOWNLOAD-DETECT-CARD:[^\]]*\]/gi, '');

  // 2. Remove thinking tags <think>...</think> if present in raw content
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  text = text.replace(/<think>[\s\S]*/gi, '');
  text = text.replace(/<\/think>/gi, '');

  // 3. Remove Markdown image links ![Alt](URL) -> Alt
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // 4. Remove table formatting separator rows like |---|---|
  text = text.replace(/^\|?[\s-:]+\|[\s-:|]+\|?$/gm, '');
  // Clean table border pipes
  text = text.replace(/^\|\s*|\s*\|$/gm, '');

  // 5. Clean deliverable code fences and language fences (```lang and ```)
  text = text.replace(/```(?:prompt|coder|ad|script|[a-zA-Z0-9_-]+)?\r?\n?/gi, '').replace(/```/g, '');

  // 6. Clean inline code `code` -> code
  text = text.replace(/`([^`\n]+)`/g, '$1');

  // 7. Clean Markdown Headings (e.g. ### Heading -> Heading)
  text = text.replace(/^[ \t]*#{1,6}\s*/gm, '');

  // 8. Clean Bold, Italic & Strikethrough markdown symbols (including multiline spans)
  text = text.replace(/\*\*\*([\s\S]*?)\*\*\*/g, '$1');
  text = text.replace(/___([\s\S]*?)___/g, '$1');
  text = text.replace(/\*\*([\s\S]*?)\*\*/g, '$1');
  text = text.replace(/__([\s\S]*?)__/g, '$1');
  text = text.replace(/~~([\s\S]*?)~~/g, '$1');
  // Italic with single * or _ (avoid breaking URLs or variables with underscores)
  text = text.replace(/(^|\s)\*([^\s*][^*]*[^\s*]|\S)\*(\s|$|[.,!?;:،۔])/g, '$1$2$3');
  text = text.replace(/(^|\s)_([^\s_][^_]*[^\s_]|\S)_(\s|$|[.,!?;:،۔])/g, '$1$2$3');

  // 9. Clean Markdown Links [Title](URL) -> Title (URL) or Title
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, linkText, url) => {
    const cleanLinkText = linkText.trim();
    const cleanUrl = url.trim();
    if (cleanLinkText === cleanUrl || !cleanLinkText) {
      return cleanUrl;
    }
    if (cleanLinkText.startsWith('tel:') || cleanLinkText.startsWith('mailto:')) {
      return cleanLinkText.replace(/^(?:tel|mailto):/, '');
    }
    return `${cleanLinkText} (${cleanUrl})`;
  });

  // 10. Clean blockquotes (> quote -> quote)
  text = text.replace(/^[ \t]*>\s?/gm, '');

  // 11. Clean horizontal rules (--- or *** or ___)
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');

  // 12. Clean unordered list bullets (- or * or + -> • )
  text = text.replace(/^[ \t]*[-*+]\s+/gm, '• ');

  // 13. Normalize excessive newlines and whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

/**
 * Normalizes any timestamp string into clean English numerals and AM/PM format
 */
export function normalizeDisplayTimestamp(ts?: string): string {
  if (!ts) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let formatted = ts;
  arabicDigits.forEach((d, idx) => {
    formatted = formatted.replace(new RegExp(d, 'g'), String(idx));
  });
  return formatted
    .replace(/ص/g, 'AM')
    .replace(/م/g, 'PM')
    .replace(/\s+/g, ' ')
    .trim();
}
