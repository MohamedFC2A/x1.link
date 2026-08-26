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
  remainingText = remainingText.replace(/^\/+\s*/, '').trim();

  return {
    hasUrl: true,
    cleanUrl: finalUrl,
    domain,
    remainingText
  };
}

/**
 * Generates a high-resolution favicon/logo URL for any given domain or URL.
 */
export function getFaviconUrl(domainOrUrl: string | null | undefined): string | null {
  if (!domainOrUrl || !domainOrUrl.trim()) return null;
  try {
    let clean = domainOrUrl.trim();
    if (/^https?:\/\//i.test(clean)) {
      const parsed = new URL(clean);
      clean = parsed.hostname;
    }
    clean = clean.replace(/^www\./i, '').split('/')[0];
    if (!clean || !clean.includes('.')) return null;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(clean)}&sz=64`;
  } catch {
    return null;
  }
}


