/**
 * Search Intelligence System — DuckDuckGo Live Web Scraper
 * Matany AI (Matany)
 * High-Reliability DDG Lite Engine with Cheerio Extraction
 */

import * as cheerio from 'cheerio';
import { SearchResult, SearchEngineOptions } from './searchTypes';

/**
 * Unescapes basic HTML entities.
 */
function unescapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * Extracts and decodes actual destination URL from DuckDuckGo wrapper.
 */
function decodeDDGUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  if (rawUrl.includes('uddg=')) {
    const parts = rawUrl.split('uddg=')[1]?.split('&')[0];
    if (parts) {
      try {
        return decodeURIComponent(parts);
      } catch {}
    }
  }
  if (rawUrl.startsWith('//')) {
    return `https:${rawUrl}`;
  }
  return rawUrl;
}

/**
 * Executes a live web search using DuckDuckGo Lite endpoint parsed cleanly with cheerio.
 */
export async function searchDuckDuckGo(
  query: string,
  options?: SearchEngineOptions
): Promise<SearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const maxResults = options?.maxResults || 10;
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 4500);

  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  // Strategy 1: DDG Lite Endpoint (Reliable, resilient, zero captcha challenge)
  try {
    const liteRes = await fetch('https://lite.duckduckgo.com/lite/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      },
      body: new URLSearchParams({ q: cleanQuery }).toString(),
      signal: controller.signal
    });

    if (liteRes.ok) {
      const html = await liteRes.text();
      const $ = cheerio.load(html);

      $('a.result-link').each((i, el) => {
        if (results.length >= maxResults) return;

        const title = $(el).text().trim();
        const rawHref = $(el).attr('href') || '';
        const decodedUrl = decodeDDGUrl(rawHref);

        if (!decodedUrl.startsWith('http') || decodedUrl.includes('duckduckgo.com') || seenUrls.has(decodedUrl)) {
          return;
        }

        const tr = $(el).closest('tr');
        const snippet = tr.next().find('td.result-snippet').text().trim() || title;

        seenUrls.add(decodedUrl);
        let domain = '';
        try {
          domain = new URL(decodedUrl).hostname.replace(/^www\./, '');
        } catch {}

        results.push({
          id: `ddg-lite-${i}-${Date.now()}`,
          title: unescapeHtml(title),
          url: decodedUrl,
          snippet: unescapeHtml(snippet),
          source: `DuckDuckGo Live (${domain || 'Web'})`,
          sourceType: 'duckduckgo',
          domain,
          credibilityScore: 0.88,
          isVerified: true
        });
      });
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[DDG Lite Search Notice]:', err?.message);
    }
  }

  clearTimeout(timeout);
  return results;
}
