/**
 * Search Intelligence System — Master Engine & Facade
 * Matany AI (Matany)
 */

export * from './searchTypes';
export * from './intentClassifier';
export * from './queryProcessor';
export * from './cacheManager';
export * from './resultsAggregator';
export * from './promptAugmentation';
export * from './googleSearch';
export * from './duckduckgoSearch';
export * from './newsSearch';
export * from './serperSearch';
export * from './wikiSearch';
export * from './multiSourceSearcher';
export * from './deepContentExtractor';

import {
  SearchEngineOptions,
  SearchAggregationResult,
  SearchResult
} from './searchTypes';
import { classifyQueryIntent } from './intentClassifier';
import { globalSearchCache } from './cacheManager';
import { executeMultiSourceSearch } from './multiSourceSearcher';
import { enrichSearchResultsWithDeepContent } from './deepContentExtractor';
import { buildSearchGroundingContextBlock } from './promptAugmentation';

/**
 * End-to-End Autonomous Search Pipeline:
 * 1. Analyzes user query & classifies intent with confidence scoring
 * 2. Checks adaptive in-memory cache
 * 3. Dispatches concurrent parallel multi-source search (Google, DDG, News, Serper, Wiki)
 * 4. Deduplicates and executes 5-pillar ranking algorithm
 * 5. Deeply extracts article body text from top source pages
 * 6. Updates cache with adaptive TTL
 * 7. Generates LLM grounding context block with source attribution
 */
export async function executeAutonomousSearch(
  rawQuery: string,
  options?: SearchEngineOptions
): Promise<SearchAggregationResult> {
  const startTime = Date.now();
  const query = (rawQuery || '').trim();

  // 1. Intent Classification & Autonomous Trigger Evaluation
  const intentResult = classifyQueryIntent(query, {
    explicitDeepSearch: options?.explicitDeepSearch
  });

  const processedQuery = intentResult.extractedQuery || query;

  // If the query does not warrant a search, return early
  if (!intentResult.should_search && !options?.explicitDeepSearch) {
    return {
      query,
      processedQuery,
      intent: intentResult,
      results: [],
      totalHits: 0,
      executionTimeMs: Date.now() - startTime,
      sourcesUsed: [],
      fromCache: false,
      timestamp: new Date().toISOString()
    };
  }

  // 2. Check Smart Cache
  const cacheKey = globalSearchCache.generateKey(
    processedQuery,
    options?.hl || 'ar',
    intentResult.intent
  );

  if (!options?.disableCache && !options?.forceFresh) {
    const cachedResults = globalSearchCache.get(cacheKey);
    if (cachedResults && cachedResults.length > 0) {
      const groundingBlock = buildSearchGroundingContextBlock(
        cachedResults,
        intentResult,
        processedQuery
      );

      return {
        query,
        processedQuery,
        intent: intentResult,
        results: cachedResults,
        totalHits: cachedResults.length,
        executionTimeMs: Date.now() - startTime,
        sourcesUsed: ['Memory Cache'],
        fromCache: true,
        timestamp: new Date().toISOString(),
        groundingContextBlock: groundingBlock
      };
    }
  }

  // 3. Multi-Source Parallel Search Execution
  const multiSourceResult = await executeMultiSourceSearch(
    processedQuery,
    intentResult.intent,
    options
  );

  // 4. Enrich Top Results with Deep Page Content (Articles, Scores, Statistics)
  let finalResults = multiSourceResult.results;
  if (finalResults.length > 0 && options?.explicitDeepSearch) {
    try {
      finalResults = await enrichSearchResultsWithDeepContent(
        finalResults,
        2,
        1500
      );
    } catch {
      // Keep multiSourceResult.results on deep fetch error
    }
  }

  // 5. Update Cache
  if (finalResults.length > 0 && !options?.disableCache) {
    globalSearchCache.set(cacheKey, finalResults, intentResult.intent);
  }

  // 6. Generate Grounding Context Block
  const groundingContextBlock = buildSearchGroundingContextBlock(
    finalResults,
    intentResult,
    processedQuery
  );

  return {
    query,
    processedQuery,
    intent: intentResult,
    results: finalResults,
    totalHits: finalResults.length,
    executionTimeMs: Date.now() - startTime,
    sourcesUsed: multiSourceResult.sourcesUsed,
    fromCache: false,
    timestamp: new Date().toISOString(),
    groundingContextBlock
  };
}
