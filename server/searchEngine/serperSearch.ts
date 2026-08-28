/**
 * Search Intelligence System — Serper.dev Google API Provider
 * Matany AI (Matany)
 * Supercharged Organic + News + Knowledge Graph Aggregation Engine
 */

import { SearchResult, SearchEngineOptions } from './searchTypes';

/**
 * Executes a supercharged multi-channel search query via Serper.dev API.
 * Combines Google Organic, Knowledge Graph, and Google News in parallel.
 */
export async function searchSerper(
  query: string,
  options?: SearchEngineOptions
): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY || process.env.SERPER_KEY || process.env.SERPER_AI_KEY || '';
  if (!apiKey) return [];

  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const maxResults = options?.maxResults || 15;
  const hl = options?.hl || 'ar';
  const gl = options?.gl || 'eg';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 5500);

    if (options?.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const payload: any = {
      q: options?.filterDomain ? `site:${options.filterDomain} ${cleanQuery}` : cleanQuery,
      num: maxResults,
      hl,
      gl
    };

    // Parallel fetch: Standard Organic Google Search + Google News on Serper
    const organicPromise = fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const newsPromise = fetch('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).catch(() => null);

    const [resOrganic, resNews] = await Promise.all([organicPromise, newsPromise]);

    clearTimeout(timeout);

    const results: SearchResult[] = [];
    const seenUrls = new Set<string>();

    // 1. Process Organic Search & Knowledge Graph
    if (resOrganic && resOrganic.ok) {
      const data = await resOrganic.json();

      // 1.1 Knowledge Graph (High Value Summary)
      if (data.knowledgeGraph && data.knowledgeGraph.title) {
        const kg = data.knowledgeGraph;
        const kgUrl = kg.website || kg.descriptionUrl || 'https://google.com';
        const kgSnippetParts = [
          kg.description || '',
          kg.type ? `النوع: ${kg.type}` : '',
          kg.attributes ? Object.entries(kg.attributes).map(([k, v]) => `${k}: ${v}`).join(' | ') : ''
        ].filter(Boolean);

        results.push({
          id: `serper-kg-${Date.now()}`,
          title: `[بطاقة جوجل المعرفية]: ${kg.title} ${kg.type ? `(${kg.type})` : ''}`,
          url: kgUrl,
          snippet: kgSnippetParts.join(' — ') || kg.title,
          source: 'Google Knowledge Graph (Serper)',
          sourceType: 'serper',
          imageUrl: kg.imageUrl,
          credibilityScore: 0.99,
          isVerified: true
        });
        if (kgUrl && kgUrl !== 'https://google.com') seenUrls.add(kgUrl);
      }

      // 1.2 Organic Web Results
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
          source: `Serper Live Search (${domain || 'Google Index'})`,
          sourceType: 'serper',
          date: item.date,
          imageUrl: item.imageUrl,
          domain,
          credibilityScore: 0.95,
          isVerified: true
        });
      }

      // 1.3 Top Stories from Serper if available
      const topStories = data.topStories || [];
      for (let i = 0; i < topStories.length; i++) {
        const item = topStories[i];
        if (!item.link || seenUrls.has(item.link)) continue;
        seenUrls.add(item.link);

        results.push({
          id: `serper-story-${i}-${Date.now()}`,
          title: `[خبر عاجل]: ${item.title}`,
          url: item.link,
          snippet: `تغطية إخبارية حية (${item.date || 'اليوم'}): ${item.title}`,
          source: `Google Top Stories (${item.source || 'Serper News'})`,
          sourceType: 'serper',
          date: item.date,
          imageUrl: item.imageUrl,
          credibilityScore: 0.96,
          isVerified: true
        });
      }
    }

    // 2. Process Serper News Results
    if (resNews && resNews.ok) {
      try {
        const newsData = await resNews.json();
        const newsItems = newsData.news || [];
        for (let i = 0; i < newsItems.length; i++) {
          const item = newsItems[i];
          if (!item.link || !item.title || seenUrls.has(item.link)) continue;
          seenUrls.add(item.link);

          let domain = '';
          try {
            domain = new URL(item.link).hostname.replace(/^www\./, '');
          } catch {}

          results.push({
            id: `serper-news-${i}-${Date.now()}`,
            title: `[أخبار Serper]: ${item.title}`,
            url: item.link,
            snippet: item.snippet || `تقرير صحفي منشور عبر ${item.source || domain} (${item.date || 'حديث'})`,
            source: item.source ? `Google News (${item.source})` : 'Serper News',
            sourceType: 'serper',
            date: item.date,
            imageUrl: item.imageUrl,
            domain,
            credibilityScore: 0.94,
            isVerified: true
          });
        }
      } catch {}
    }

    return results.slice(0, maxResults);
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.warn('[Serper Search Exception]:', err?.message);
    }
    return [];
  }
}
