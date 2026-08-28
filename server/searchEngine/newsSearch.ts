/**
 * Search Intelligence System — Google News RSS Real-Time Provider
 * Matany AI (Matany)
 */

import { SearchResult, SearchEngineOptions } from './searchTypes';

/**
 * Unescapes CDATA and HTML entities.
 */
function cleanXmlContent(text: string): string {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Executes a real-time news search using Google News RSS.
 */
export async function searchGoogleNews(
  query: string,
  options?: SearchEngineOptions
): Promise<SearchResult[]> {
  const cleanQuery = query
    .replace(/\b(2026|latest update|أحدث|جديد|أخبار)\b/gi, '')
    .trim();

  if (!cleanQuery) return [];

  const maxResults = options?.maxResults || 6;
  const hl = options?.hl === 'en' ? 'en' : 'ar';
  const gl = options?.gl || (hl === 'en' ? 'US' : 'EG');
  const ceid = `${gl}:${hl}`;

  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanQuery)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 3500);

    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const res = await fetch(rssUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MatanyNewsBot/2.0; +https://matany.one)',
        'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9',
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return [];
    }

    const xml = await res.text();
    const itemMatches = xml.split('<item>').slice(1, maxResults + 2);
    const results: SearchResult[] = [];
    const seenUrls = new Set<string>();

    for (let i = 0; i < itemMatches.length; i++) {
      const itemXml = itemMatches[i];
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      const rawTitle = cleanXmlContent(titleMatch ? titleMatch[1] : '');
      const link = cleanXmlContent(linkMatch ? linkMatch[1] : '');
      const pubDate = cleanXmlContent(pubDateMatch ? pubDateMatch[1] : '');
      const sourceName = cleanXmlContent(sourceMatch ? sourceMatch[1] : '');

      if (!rawTitle || !link || seenUrls.has(link)) continue;
      seenUrls.add(link);

      // Google News title usually format: "Headline title - Publisher Name"
      let displayTitle = rawTitle;
      let publisher = sourceName;
      if (rawTitle.includes(' - ') && !publisher) {
        const parts = rawTitle.split(' - ');
        publisher = parts.pop()?.trim() || '';
        displayTitle = parts.join(' - ').trim();
      }

      let domain = '';
      try {
        domain = new URL(link).hostname.replace(/^www\./, '');
      } catch {}

      results.push({
        id: `news-${i}-${Date.now()}`,
        title: displayTitle,
        url: link,
        snippet: `[خبر عاجل ومحدث${pubDate ? ' - ' + pubDate : ''}] ${displayTitle}${publisher ? ` | المصدر: ${publisher}` : ''}`,
        source: publisher ? `Google News (${publisher})` : 'Google News Realtime',
        sourceType: 'news',
        date: pubDate,
        domain: domain || publisher,
        isVerified: true,
        freshnessScore: 1.0
      });

      if (results.length >= maxResults) break;
    }

    return results;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[Google News RSS Exception]:', err.message);
    }
    return [];
  }
}
