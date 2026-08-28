/**
 * Search Intelligence System — Serper.dev Google API Provider
 * Matany AI (x1.link)
 */

import { SearchResult, SearchEngineOptions } from './searchTypes';

/**
 * Executes a search query via Serper.dev API.
 */
export async function searchSerper(
  query: string,
  options?: SearchEngineOptions
): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY || '';
  if (!apiKey) return [];

  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const maxResults = options?.maxResults || 10;
  const hl = options?.hl || 'ar';
  const gl = options?.gl || 'eg';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 4500);

    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const payload: any = {
      q: options?.filterDomain ? `site:${options.filterDomain} ${cleanQuery}` : cleanQuery,
      num: maxResults,
      hl,
      gl
    };

    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[Serper Search] Response status ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results: SearchResult[] = [];
    const seenUrls = new Set<string>();

    // 1. Knowledge Graph (High Value Summary)
    if (data.knowledgeGraph && data.knowledgeGraph.title) {
      const kg = data.knowledgeGraph;
      const kgUrl = kg.website || kg.descriptionUrl || 'https://google.com';
      results.push({
        id: `serper-kg-${Date.now()}`,
        title: `[بطاقة معرفية]: ${kg.title} ${kg.type ? `(${kg.type})` : ''}`,
        url: kgUrl,
        snippet: kg.description || (kg.attributes ? JSON.stringify(kg.attributes) : kg.title),
        source: 'Google Knowledge Graph',
        sourceType: 'serper',
        imageUrl: kg.imageUrl,
        credibilityScore: 0.98,
        isVerified: true
      });
      if (kgUrl && kgUrl !== 'https://google.com') seenUrls.add(kgUrl);
    }

    // 2. Organic Web Results
    const organic = data.organic || [];
    for (let i = 0; i < organic.length; i++) {
      const item = organic[i];
      if (!item.link || !item.title || seenUrls.has(item.link)) continue;
      seenUrls.add(item.link);

      let domain = '';
      try {
        domain = new URL(item.link).hostname.replace(/^www\./, '');
      } catch {}

      results.push({
        id: `serper-org-${i}-${Date.now()}`,
        title: item.title,
        url: item.link,
        snippet: item.snippet || item.title,
        source: 'Google Global Live Index',
        sourceType: 'serper',
        date: item.date,
        imageUrl: item.imageUrl,
        domain,
        isVerified: true
      });

      if (results.length >= maxResults) break;
    }

    return results;
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[Serper Search Exception]:', err.message);
    }
    return [];
  }
}
