/**
 * Search Intelligence System — Wikipedia Knowledge API Provider
 * Matany AI (x1.link)
 */

import { SearchResult, SearchEngineOptions } from './searchTypes';

/**
 * Searches Arabic and English Wikipedia for encyclopedic facts and definitions.
 */
export async function searchWikipedia(
  query: string,
  options?: SearchEngineOptions
): Promise<SearchResult[]> {
  const cleanQuery = query
    .replace(/\b(2026|2025|latest|update|سعر|أسعار|الآن|اليوم)\b/gi, '')
    .trim();

  if (!cleanQuery || cleanQuery.length < 2) return [];

  const maxResults = options?.maxResults || 2;
  const isArabic = /[\u0600-\u06FF]/.test(cleanQuery);
  const lang = options?.hl || (isArabic ? 'ar' : 'en');

  const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(cleanQuery)}&format=json&utf8=1&srlimit=${maxResults}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 3000);

    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'MatanySearchBot/2.0 (+https://matany.one; info@matany.one)',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    const items = data?.query?.search || [];
    const results: SearchResult[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = item.title;
      const snippet = (item.snippet || '').replace(/<[^>]+>/g, '').trim();

      if (!title || !snippet) continue;

      const pageUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;

      results.push({
        id: `wiki-${i}-${Date.now()}`,
        title: `ويكيبيديا الموسوعة الحرة: ${title}`,
        url: pageUrl,
        snippet,
        source: 'Wikipedia Encyclopedia',
        sourceType: 'wiki',
        domain: `${lang}.wikipedia.org`,
        isVerified: true,
        credibilityScore: 0.95
      });
    }

    return results;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[Wikipedia Search Exception]:', err.message);
    }
    return [];
  }
}
