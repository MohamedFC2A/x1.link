/**
 * Search Intelligence System — Core Types & Schemas
 * Matany AI (x1.link)
 */

export type QueryIntent =
  | 'INFORMATION_SEARCH'      // General knowledge / web search
  | 'CURRENT_EVENTS'          // Breaking news, recent happenings
  | 'REAL_TIME_DATA'          // Live prices, currency, weather, sports scores
  | 'PRODUCT_RESEARCH'        // Specs, shopping, hardware reviews
  | 'TECHNICAL_DOCUMENTATION' // Code, API references, library guides
  | 'SCIENTIFIC_RESEARCH'     // Papers, academic studies, medicine
  | 'COMPARISON'              // Comparison between products, tech, or concepts
  | 'TUTORIAL_HOW_TO'         // Step-by-step guides, how-to tutorials
  | 'FACT_CHECKING'           // Claim verification, hoax debunking
  | 'TREND_ANALYSIS'          // Market trends, popularity over time
  | 'OPINION_SEEKING'         // Subjective advice, perspectives
  | 'GENERAL_CONVERSATION';   // Chit-chat, greetings, no search needed

export type SearchPriority = 'urgent' | 'normal' | 'background';

export type SearchComplexityLevel = 'NONE' | 'LIGHT' | 'STANDARD' | 'DEEP_CYBER';

export type KnowledgeDomain =
  | 'ASTRONOMY_PHYSICS'
  | 'BIOLOGY_MEDICINE'
  | 'HISTORY_POLITICS'
  | 'TECHNOLOGY_COMPUTING'
  | 'FINANCE_ECONOMICS'
  | 'SPORTS'
  | 'ENTERTAINMENT_ARTS'
  | 'GENERAL_FACT';

export type SearchSourceType =
  | 'google'
  | 'duckduckgo'
  | 'news'
  | 'serper'
  | 'wiki'
  | 'academic'
  | 'other';

export interface ExtractedEntities {
  people: string[];
  organizations: string[];
  dates: string[];
  locations: string[];
  products: string[];
  concepts: string[];
  years: number[];
}

export interface IntentClassificationResult {
  intent: QueryIntent;
  confidence: number; // 0.0 to 1.0
  should_search: boolean;
  search_type: QueryIntent;
  priority: SearchPriority;
  complexityLevel?: SearchComplexityLevel;
  knowledgeDomain?: KnowledgeDomain;
  subQueries?: string[];
  entities: ExtractedEntities;
  reason: string;
  temporalBias: boolean;
  targetYear?: number;
  extractedQuery: string;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  sourceType: SearchSourceType;
  date?: string;
  imageUrl?: string;
  score?: number;
  credibilityScore?: number;
  relevanceScore?: number;
  freshnessScore?: number;
  contentQualityScore?: number;
  engagementScore?: number;
  domain?: string;
  isVerified?: boolean;
  fullContent?: string;
}

export interface SearchEngineOptions {
  maxResults?: number;
  timeoutMs?: number;
  hl?: 'ar' | 'en' | string;
  gl?: string;
  filterDomain?: string;
  forceFresh?: boolean;
  sources?: SearchSourceType[];
  signal?: AbortSignal;
  userPrompt?: string;
  explicitDeepSearch?: boolean;
  disableCache?: boolean;
}

export interface SearchAggregationResult {
  query: string;
  processedQuery: string;
  intent: IntentClassificationResult;
  results: SearchResult[];
  totalHits: number;
  executionTimeMs: number;
  sourcesUsed: string[];
  fromCache: boolean;
  timestamp: string;
  groundingContextBlock?: string;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  cachedAt: number;
  hitCount: number;
}
