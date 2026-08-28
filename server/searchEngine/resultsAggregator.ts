/**
 * Search Intelligence System — Results Aggregation, Deduplication & 5-Pillar Ranking Engine
 * Matany AI (Matany)
 */

import { SearchResult, QueryIntent } from './searchTypes';
import { normalizeArabicText } from './queryProcessor';

const HIGH_AUTHORITY_DOMAINS: Record<string, number> = {
  // Encyclopedias & Research
  'wikipedia.org': 0.98,
  'ar.wikipedia.org': 0.98,
  'en.wikipedia.org': 0.98,
  'arxiv.org': 0.96,
  'nature.com': 0.96,
  'science.org': 0.95,
  'nih.gov': 0.98,
  'who.int': 0.97,
  'cdc.gov': 0.97,

  // Technical & Developer
  'github.com': 0.95,
  'developer.mozilla.org': 0.96,
  'stackoverflow.com': 0.92,
  'w3schools.com': 0.88,
  'microsoft.com': 0.94,
  'apple.com': 0.94,
  'google.com': 0.95,
  'openai.com': 0.95,
  'anthropic.com': 0.95,
  'deepseek.com': 0.94,

  // Global & Arabic News
  'reuters.com': 0.96,
  'bbc.com': 0.95,
  'aljazeera.net': 0.94,
  'alarabiya.net': 0.93,
  'skynewsarabia.com': 0.92,
  'youm7.com': 0.88,
  'masrawy.com': 0.87,
  'ahram.org.eg': 0.90,
  'bloomberg.com': 0.95,
  'forbes.com': 0.92,
  'techcrunch.com': 0.92,
  'theverge.com': 0.91,
  'gsmarena.com': 0.90,
};

/**
 * Normalizes URL into canonical format, stripping tracking params and trailing slashes.
 */
export function canonicalizeUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'si', 'fbclid', 'igsh', 'gclid', 'ref', 'ref_src', 'sfnsn', 'paipv',
      '_nc_cat', '_nc_sid', 'ocid'
    ];
    trackingParams.forEach(p => parsed.searchParams.delete(p));
    
    // Normalize protocol to https if applicable
    if (parsed.protocol === 'http:' && !parsed.hostname.includes('localhost')) {
      parsed.protocol = 'https:';
    }

    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    }

    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Calculates domain credibility score (0.0 to 1.0).
 */
export function calculateDomainCredibility(url: string, domain?: string): number {
  let host = (domain || '').toLowerCase().replace(/^www\./, '');
  if (!host && url) {
    try {
      host = new URL(url).hostname.replace(/^www\./, '');
    } catch {}
  }

  if (!host) return 0.5;

  // Direct High Authority Whitelist (Tier A+)
  for (const [authDomain, score] of Object.entries(HIGH_AUTHORITY_DOMAINS)) {
    if (host === authDomain || host.endsWith(`.${authDomain}`)) {
      return score;
    }
  }

  // Government & Academic Top-Level Domains
  if (host.endsWith('.gov') || host.endsWith('.gov.eg') || host.endsWith('.gov.sa')) return 0.99;
  if (host.endsWith('.edu') || host.endsWith('.edu.eg')) return 0.98;
  if (host.endsWith('.org')) return 0.85;

  // HTTPS baseline
  return url.startsWith('https://') ? 0.75 : 0.55;
}

/**
 * Computes relevance score between query keywords and candidate hit.
 */
function calculateRelevance(
  query: string,
  hit: SearchResult
): number {
  const normQuery = normalizeArabicText(query.toLowerCase());
  const queryTokens = normQuery.split(/\s+/).filter(t => t.length > 1);

  if (queryTokens.length === 0) return 0.5;

  const normTitle = normalizeArabicText((hit.title || '').toLowerCase());
  const normSnippet = normalizeArabicText((hit.snippet || '').toLowerCase());
  const normUrl = (hit.url || '').toLowerCase();

  let matchedTitleTokens = 0;
  let matchedSnippetTokens = 0;
  let matchedUrlTokens = 0;

  for (const token of queryTokens) {
    if (normTitle.includes(token)) matchedTitleTokens++;
    if (normSnippet.includes(token)) matchedSnippetTokens++;
    if (normUrl.includes(token)) matchedUrlTokens++;
  }

  const titleRatio = matchedTitleTokens / queryTokens.length;
  const snippetRatio = matchedSnippetTokens / queryTokens.length;
  const urlRatio = matchedUrlTokens / queryTokens.length;

  let relevance = (titleRatio * 0.5) + (snippetRatio * 0.35) + (urlRatio * 0.15);

  // Exact phrase match bonus
  if (normTitle.includes(normQuery)) {
    relevance += 0.30;
  } else if (normSnippet.includes(normQuery)) {
    relevance += 0.15;
  }

  return Math.min(1.0, Math.max(0.0, relevance));
}

/**
 * Evaluates publication freshness score.
 */
function calculateFreshness(hit: SearchResult, isNewsIntent: boolean): number {
  if (hit.freshnessScore !== undefined) return hit.freshnessScore;
  if (hit.sourceType === 'news') return 1.0;

  const text = `${hit.title} ${hit.snippet} ${hit.date || ''}`.toLowerCase();
  const currentYear = new Date().getUTCFullYear();

  if (text.includes(String(currentYear))) return 0.95;
  if (text.includes(String(currentYear - 1))) return 0.80;
  if (text.includes('hours ago') || text.includes('ساعات') || text.includes('اليوم') || text.includes('today')) return 1.0;
  if (text.includes('days ago') || text.includes('أيام') || text.includes('امس')) return 0.90;

  return isNewsIntent ? 0.60 : 0.70;
}

/**
 * Evaluates snippet quality and content substance.
 */
function calculateContentQuality(hit: SearchResult): number {
  const snippet = (hit.snippet || '').trim();
  const title = (hit.title || '').trim();

  // Reject spam or empty
  if (!title || (!snippet && hit.sourceType !== 'wiki')) return 0.2;
  if (snippet.length < 25 && title.length < 20) return 0.3;

  let quality = 0.7;
  if (snippet.length >= 80) quality += 0.15;
  if (snippet.length >= 150) quality += 0.10;
  if (hit.imageUrl) quality += 0.05;

  return Math.min(1.0, quality);
}

/**
 * Master Aggregator: Deduplicates, scores with the 5-factor formula, filters low-quality items,
 * and sorts descending by final weighted score.
 */
export function aggregateAndRankResults(
  rawResults: SearchResult[],
  query: string,
  intent?: QueryIntent,
  maxResults: number = 8
): SearchResult[] {
  if (!rawResults || rawResults.length === 0) return [];

  const seenCanonicalUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const isNews = intent === 'CURRENT_EVENTS' || intent === 'REAL_TIME_DATA' || intent === 'FACT_CHECKING';

  const scoredResults: SearchResult[] = [];

  for (let i = 0; i < rawResults.length; i++) {
    const item = rawResults[i];
    const canonical = canonicalizeUrl(item.url);

    if (!canonical || !canonical.startsWith('http') || seenCanonicalUrls.has(canonical)) {
      continue;
    }

    const normTitle = normalizeArabicText((item.title || '').toLowerCase());
    if (normTitle.length > 5 && seenTitles.has(normTitle)) {
      continue;
    }

    seenCanonicalUrls.add(canonical);
    if (normTitle.length > 5) seenTitles.add(normTitle);

    // 1. Relevance Score (30%)
    const relevanceScore = calculateRelevance(query, item);

    // 2. Source Credibility (25%)
    const credibilityScore = item.credibilityScore ?? calculateDomainCredibility(canonical, item.domain);

    // 3. Freshness Score (20%)
    const freshnessScore = calculateFreshness(item, isNews);

    // 4. User Engagement / Original Rank (15%)
    const engagementScore = Math.max(0.3, 1.0 - (i * 0.05));

    // 5. Content Quality (10%)
    const contentQualityScore = calculateContentQuality(item);

    // Final 5-Factor Weighted Score Formula
    const finalScore = Number(
      (
        (0.30 * relevanceScore) +
        (0.25 * credibilityScore) +
        (0.20 * freshnessScore) +
        (0.15 * engagementScore) +
        (0.10 * contentQualityScore)
      ).toFixed(3)
    );

    scoredResults.push({
      ...item,
      url: canonical,
      score: finalScore,
      relevanceScore: Number(relevanceScore.toFixed(2)),
      credibilityScore: Number(credibilityScore.toFixed(2)),
      freshnessScore: Number(freshnessScore.toFixed(2)),
      engagementScore: Number(engagementScore.toFixed(2)),
      contentQualityScore: Number(contentQualityScore.toFixed(2))
    });
  }

  // Sort descending by finalScore
  scoredResults.sort((a, b) => (b.score || 0) - (a.score || 0));

  return scoredResults.slice(0, maxResults);
}
