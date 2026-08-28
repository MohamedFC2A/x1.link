/**
 * Search Intelligence System — Multi-Source Parallel Search Orchestrator
 * Matany AI (x1.link)
 */

import { SearchResult, SearchEngineOptions, QueryIntent } from './searchTypes';
import { searchGoogleCSE } from './googleSearch';
import { searchDuckDuckGo } from './duckduckgoSearch';
import { searchGoogleNews } from './newsSearch';
import { searchSerper } from './serperSearch';
import { searchWikipedia } from './wikiSearch';
import { aggregateAndRankResults } from './resultsAggregator';

export interface MultiSourceExecutionSummary {
  results: SearchResult[];
  sourcesUsed: string[];
  totalRawHits: number;
  executionTimeMs: number;
}

/**
 * Dispatches concurrent searches across all available search tiers and aggregates hits.
 */
export async function executeMultiSourceSearch(
  query: string,
  intent?: QueryIntent,
  options?: SearchEngineOptions
): Promise<MultiSourceExecutionSummary> {
  const startTime = Date.now();
  const rawHits: SearchResult[] = [];
  const sourcesUsed: string[] = [];

  const isNewsOrRealtime =
    intent === 'CURRENT_EVENTS' ||
    intent === 'REAL_TIME_DATA' ||
    intent === 'FACT_CHECKING';

  const isAcademicOrDefinition =
    intent === 'SCIENTIFIC_RESEARCH' ||
    intent === 'TECHNICAL_DOCUMENTATION' ||
    intent === 'INFORMATION_SEARCH';

  // Prepare search tasks array
  const searchTasks: Array<{ name: string; promise: Promise<SearchResult[]> }> = [];

  // 1. Google CSE (if configured)
  const hasGoogleCse = Boolean(process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_CX);
  if (hasGoogleCse && (!options?.sources || options.sources.includes('google'))) {
    searchTasks.push({
      name: 'Google CSE',
      promise: searchGoogleCSE(query, options)
    });
  }

  // 2. Serper API (if configured)
  const hasSerper = Boolean(process.env.SERPER_API_KEY);
  if (hasSerper && (!options?.sources || options.sources.includes('serper'))) {
    searchTasks.push({
      name: 'Serper API',
      promise: searchSerper(query, options)
    });
  }

  // 3. DuckDuckGo (Always active, Zero-key live web index)
  if (!options?.sources || options.sources.includes('duckduckgo')) {
    searchTasks.push({
      name: 'DuckDuckGo Live Index',
      promise: searchDuckDuckGo(query, options)
    });
  }

  // 4. Google News RSS Feed (for breaking events, realtime updates)
  if ((isNewsOrRealtime || !options?.sources || options.sources.includes('news'))) {
    searchTasks.push({
      name: 'Google News RSS',
      promise: searchGoogleNews(query, options)
    });
  }

  // 5. Wikipedia Knowledge Graph (for definitions, science, history, background)
  if (isAcademicOrDefinition && (!options?.sources || options.sources.includes('wiki'))) {
    searchTasks.push({
      name: 'Wikipedia Knowledge',
      promise: searchWikipedia(query, options)
    });
  }

  // Execute all search providers concurrently
  const settled = await Promise.allSettled(searchTasks.map(t => t.promise));

  settled.forEach((res, idx) => {
    const task = searchTasks[idx];
    if (res.status === 'fulfilled' && res.value && res.value.length > 0) {
      sourcesUsed.push(task.name);
      rawHits.push(...res.value);
    } else if (res.status === 'rejected') {
      console.warn(`[MultiSourceSearch] ${task.name} failed:`, res.reason?.message || res.reason);
    }
  });

  // Rank and deduplicate results
  const ranked = aggregateAndRankResults(
    rawHits,
    query,
    intent,
    options?.maxResults || 8
  );

  const executionTimeMs = Date.now() - startTime;

  return {
    results: ranked,
    sourcesUsed,
    totalRawHits: rawHits.length,
    executionTimeMs
  };
}
