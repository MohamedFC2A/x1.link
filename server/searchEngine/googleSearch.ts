/**
 * Search Intelligence System — Google Custom Search API Provider
 * Matany AI (x1.link)
 */

import { SearchResult, SearchEngineOptions } from './searchTypes';

/**
 * Executes a search query via Google Custom Search Engine (CSE) API.
 */
export async function searchGoogleCSE(
  query: string,
  options?: SearchEngineOptions
): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_API_KEY || '';
  const cx = process.env.GOOGLE_SEARCH_CX || process.env.GOOGLE_CX || '';

  if (!apiKey || !cx) {
    return [];
  }

  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const maxResults = Math.min(options?.maxResults || 10, 10);
  const hl = options?.hl || 'ar';
  const gl = options?.gl || 'eg';

  const endpoint = new URL('https://www.googleapis.com/customsearch/v1');
  endpoint.searchParams.set('key', apiKey);
  endpoint.searchParams.set('cx', cx);
  endpoint.searchParams.set('q', cleanQuery);
  endpoint.searchParams.set('num', String(maxResults));
  endpoint.searchParams.set('hl', hl);
  endpoint.searchParams.set('gl', gl);

  if (options?.filterDomain) {
    endpoint.searchParams.set('siteSearch', options.filterDomain);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 4500);

    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const res = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MatanySearch/2.0 (+https://matany.one)'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[Google CSE] Response status ${res.status}`);
      return [];
    }

    const data = await res.json();
    const items = data.items || [];
    const results: SearchResult[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.link || !item.title) continue;

      let domain = '';
      try {
        domain = new URL(item.link).hostname.replace(/^www\./, '');
      } catch {}

      const imageUrl = item.pagemap?.cse_image?.[0]?.src || item.pagemap?.metatags?.[0]?.['og:image'];

      results.push({
        id: `google-${i}-${Date.now()}`,
        title: item.title,
        url: item.link,
        snippet: item.snippet || item.title,
        source: 'Google Global Search',
        sourceType: 'google',
        domain,
        imageUrl,
        isVerified: true
      });
    }

    return results;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[Google CSE Exception]:', err.message);
    }
    return [];
  }
}
