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
 * Robustly detects, extracts, and normalizes URLs from raw text.
 * Handles prefixes like `/https://`, `https://`, `http://`, `www.`, or plain domain names.
 */
export function detectAndExtractUrl(rawText: string): DetectedUrlInfo {
  if (!rawText || typeof rawText !== 'string') {
    return { hasUrl: false, cleanUrl: null, domain: null, remainingText: rawText || '' };
  }

  // Matches explicit http/https URLs (even with leading slashes like /https://...)
  const explicitMatch = rawText.match(/(?:\/|\s|^)(https?:\/\/[^\s<>"'{}|\\^`]+)/i);

  // Matches www. domains
  const wwwMatch = rawText.match(/(?:\/|\s|^)(www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s<>"'{}|\\^`]*)/i);

  // Matches domain.tld formats (e.g. github.com, youtube.com/watch?v=123)
  const domainMatch = rawText.match(/(?:\/|\s|^)([a-zA-Z0-9-]+\.(?:com|org|net|io|app|link|dev|ai|co|uk|de|me|info|tv|cc|xyz|site|online|tech|store|top|cloud|ca|fr|jp|ru|in|edu|gov)(?:\/[^\s<>"'{}|\\^`]*)?)/i);

  let rawUrlFound = '';

  if (explicitMatch && explicitMatch[1]) {
    rawUrlFound = explicitMatch[1];
  } else if (wwwMatch && wwwMatch[1]) {
    rawUrlFound = wwwMatch[1];
  } else if (domainMatch && domainMatch[1]) {
    rawUrlFound = domainMatch[1];
  }

  if (!rawUrlFound) {
    return { hasUrl: false, cleanUrl: null, domain: null, remainingText: rawText };
  }

  // Clean the extracted URL
  let sanitized = rawUrlFound.trim();
  sanitized = sanitized.replace(/^[^a-zA-Z0-9]+(?=https?:\/\/)/i, '');
  sanitized = sanitized.replace(/^\/+/, '');

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
    if (/^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(sanitized)) {
      finalUrl = sanitized;
      domain = sanitized.replace(/^https?:\/\//i, '').split('/')[0];
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


