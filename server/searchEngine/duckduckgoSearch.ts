/**
 * Search Intelligence System — DuckDuckGo Live Web Scraper
 * Matany AI (x1.link)
 */

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
 * Strips HTML tags and excessive whitespace.
 */
function cleanHtmlTags(html: string): string {
  if (!html) return '';
  return unescapeHtml(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
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
 * Executes a live web search using DuckDuckGo HTML & Lite endpoints.
 */
export async function searchDuckDuckGo(
  query: string,
  options?: SearchEngineOptions
): Promise<SearchResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const maxResults = options?.maxResults || 8;
  const results: SearchResult[] = [];
  const seenUrls = new Set<string>();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 3500);

  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  // Strategy 1: DDG HTML Endpoint
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
      },
      signal: controller.signal
    });

    if (res.ok) {
      const html = await res.text();
      const resultBlocks = html.split(/class="result__body"/g).slice(1, maxResults + 2);

      for (let i = 0; i < resultBlocks.length; i++) {
        const block = resultBlocks[i];
        const urlMatch = block.match(/href="([^"]+)"/);
        let rawUrl = urlMatch ? urlMatch[1] : '';
        const decodedUrl = decodeDDGUrl(rawUrl);

        if (!decodedUrl.startsWith('http') || decodedUrl.includes('duckduckgo.com') || seenUrls.has(decodedUrl)) {
          continue;
        }

        const titleMatch =
          block.match(/class="result__snippet[^>]*>([\s\S]*?)<\/a>/) ||
          block.match(/<a[^>]*class="result__url"[^>]*>([\s\S]*?)<\/a>/) ||
          block.match(/<h2[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/);

        const snippetMatch =
          block.match(/class="result__snippet[^>]*>([\s\S]*?)<\/a>/) ||
          block.match(/class="result__snippet[^>]*>([\s\S]*?)<\/td>/);

        const title = cleanHtmlTags(titleMatch ? titleMatch[1] : '');
        const snippet = cleanHtmlTags(snippetMatch ? snippetMatch[1] : '');

        if (title || snippet) {
          seenUrls.add(decodedUrl);
          let domain = '';
          try {
            domain = new URL(decodedUrl).hostname.replace(/^www\./, '');
          } catch {}

          results.push({
            id: `ddg-${i}-${Date.now()}`,
            title: title || domain || 'نتيجة بحث',
            url: decodedUrl,
            snippet: snippet || title,
            source: 'DuckDuckGo Live Index',
            sourceType: 'duckduckgo',
            domain,
            isVerified: true
          });
        }
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[DDG HTML Search Catch]:', err.message);
    }
  }

  // Strategy 2: Fallback to DDG Lite if HTML returned few results
  if (results.length < 3 && !controller.signal.aborted) {
    try {
      const liteRes = await fetch('https://lite.duckduckgo.com/lite/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        },
        body: `q=${encodeURIComponent(cleanQuery)}`,
        signal: controller.signal
      });

      if (liteRes.ok) {
        const liteHtml = await liteRes.text();
        const rows = liteHtml.split(/<tr[^>]*>/gi);

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const linkMatch = row.match(/href="([^"]+)"[^>]*class="result-link"/i) || row.match(/href="([^"]+)"/i);
          if (!linkMatch) continue;

          const decodedUrl = decodeDDGUrl(linkMatch[1]);
          if (!decodedUrl.startsWith('http') || decodedUrl.includes('duckduckgo.com') || seenUrls.has(decodedUrl)) {
            continue;
          }

          const title = cleanHtmlTags(row.match(/<a[^>]+>([\s\S]*?)<\/a>/i)?.[1] || '');
          const nextRow = rows[i + 1] || '';
          const snippet = cleanHtmlTags(nextRow.match(/class="result-snippet"[^>]*>([\s\S]*?)<\/td>/i)?.[1] || '');

          if (title) {
            seenUrls.add(decodedUrl);
            let domain = '';
            try {
              domain = new URL(decodedUrl).hostname.replace(/^www\./, '');
            } catch {}

            results.push({
              id: `ddg-lite-${i}-${Date.now()}`,
              title,
              url: decodedUrl,
              snippet: snippet || title,
              source: 'DuckDuckGo Live Index',
              sourceType: 'duckduckgo',
              domain,
              isVerified: true
            });
          }

          if (results.length >= maxResults) break;
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && process.env.DEBUG_SEARCH === 'true') {
        console.warn('[DDG Lite Search Catch]:', err.message);
      }
    }
  }

  clearTimeout(timeout);
  return results.slice(0, maxResults);
}
