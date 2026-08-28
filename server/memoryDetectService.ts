import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ============================================================================
 * MATANY.ONE / X1.LINK — MEMORY DETECT 2.0 MAX EDITION SERVICE LAYER
 * Autonomous Multi-Hop Vector Search, Temporal Invalidation & Conflict Engine
 * ============================================================================
 */

export type SemanticMemoryScope = 
  | 'general_chat' 
  | 'code_snippets' 
  | 'decisions' 
  | 'cyber_findings' 
  | 'user_facts' 
  | 'target_recon' 
  | 'all';

export type TimeFilterRange = 'last_day' | 'last_week' | 'last_month' | 'all_time';

export type ChatRelationshipType = 
  | 'SUPERSEDES' 
  | 'EXTENDS' 
  | 'DEPENDS_ON' 
  | 'SAME_PROJECT' 
  | 'RELATES_TO' 
  | 'CONTRADICTS';

export interface SemanticMemoryRecord {
  id: string;
  chat_id: string;
  message_id?: string | null;
  project_id?: string;
  predicate?: string | null;
  message_role: 'user' | 'assistant' | 'system' | 'distilled_summary' | 'insight';
  scope: SemanticMemoryScope;
  content: string;
  summary?: string | null;
  entities: string[];
  keywords: string[];
  code_symbols?: string[];
  token_count: number;
  created_at: string;
  vector_similarity?: number;
  text_similarity?: number;
  symbol_match_score?: number;
  rrf_score?: number;
  hop_depth?: number;
  linked_via?: string | null;
}

export interface MemoryDetectSearchParams {
  query: string;
  exact_keywords?: string[];
  exact_symbols?: string[];
  project_id?: string;
  scope?: SemanticMemoryScope;
  time_filter?: TimeFilterRange;
  start_time?: string | null;
  end_time?: string | null;
  enable_multihop?: boolean;
  limit?: number;
  match_threshold?: number;
  userId?: string | null;
  deviceId?: string | null;
}

export interface IterativeSearchParams extends MemoryDetectSearchParams {
  min_confidence?: number;
  max_iterations?: number;
}

export interface IterativeSearchOutput {
  results: SemanticMemoryRecord[];
  iterationsRun: number;
  refinementHistory: Array<{ iteration: number; queryUsed: string; scopeUsed: SemanticMemoryScope; count: number }>;
  isConfident: boolean;
  synthesizedContextBlock: string;
  multiHopPathsCount: number;
}

export interface MemoryUpdateParams {
  nodeId: string;
  newContent: string;
  newSummary?: string;
  newEntities?: string[];
  newKeywords?: string[];
  newCodeSymbols?: string[];
  reason: string;
  userId?: string | null;
  deviceId?: string | null;
}

export interface ChatLinkParams {
  sourceChatId: string;
  targetChatId: string;
  relationshipType: ChatRelationshipType;
  confidence?: number;
  metadata?: Record<string, any>;
  userId?: string | null;
  deviceId?: string | null;
}

export interface ChatGraphEdge {
  link_id: string;
  source_chat_id: string;
  target_chat_id: string;
  source_title: string;
  target_title: string;
  relationship_type: ChatRelationshipType;
  confidence: number;
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * ============================================================================
 * TEMPORAL NATURAL LANGUAGE RESOLVER
 * Converts ambiguous relative expressions into exact UTC timestamps
 * ============================================================================
 */
export class TemporalExpressionResolver {
  public static resolveTemporalWindow(query: string, referenceDate: Date = new Date()): {
    startTime: string | null;
    endTime: string | null;
    cleanedQuery: string;
    detectedWindowLabel: string | null;
  } {
    const qLower = query.toLowerCase();
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    let label: string | null = null;

    // 1. Day of week detection (English & Arabic)
    const englishDays: Record<string, number> = {
      'sunday': 0, 'sun': 0,
      'monday': 1, 'mon': 1,
      'tuesday': 2, 'tue': 2, 'tues': 2,
      'wednesday': 3, 'wed': 3,
      'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
      'friday': 5, 'fri': 5,
      'saturday': 6, 'sat': 6
    };
    const arabicDays: Record<string, number> = {
      'الأحد': 0, 'الاحد': 0,
      'الاثنين': 1, 'الإثنين': 1,
      'الثلاثاء': 2,
      'الأربعاء': 3, 'الاربعاء': 3,
      'الخميس': 4,
      'الجمعة': 5,
      'السبت': 6,
    };

    for (const [dayName, targetDayNum] of Object.entries({ ...englishDays, ...arabicDays })) {
      const patterns = [
        new RegExp(`(?:last|past|previous)\\s+${dayName}`, 'i'),
        new RegExp(`(?:يوم\\s+)?${dayName}\\s+(?:الماضي|الفائت|اللي فات)`, 'i'),
        new RegExp(`${dayName}\\s+(?:last|past|previous)`, 'i')
      ];

      if (patterns.some(p => p.test(qLower))) {
        const currentDay = referenceDate.getDay();
        let daysAgo = (currentDay - targetDayNum + 7) % 7;
        if (daysAgo === 0) daysAgo = 7; // Previous week's occurrence

        const targetDate = new Date(referenceDate);
        targetDate.setDate(referenceDate.getDate() - daysAgo);
        
        startTime = new Date(targetDate);
        startTime.setHours(0, 0, 0, 0);
        endTime = new Date(targetDate);
        endTime.setHours(23, 59, 59, 999);
        label = `Exact Day: ${dayName} (${targetDate.toISOString().slice(0, 10)})`;
        break;
      }
    }

    // 2. "yesterday" (أمس، البارحة)
    if (!startTime && /(?:yesterday|أمس|البارحة|مبارح|امس)/i.test(qLower)) {
      const yesterday = new Date(referenceDate);
      yesterday.setDate(referenceDate.getDate() - 1);
      startTime = new Date(yesterday);
      startTime.setHours(0, 0, 0, 0);
      endTime = new Date(yesterday);
      endTime.setHours(23, 59, 59, 999);
      label = 'Yesterday';
    }

    // 3. "3 days ago" / "N days ago" (منذ N أيام)
    const daysAgoMatch = qLower.match(/(?:(\d+)\s+days?\s+ago|منذ\s+(\d+)\s+أيام?|قبل\s+(\d+)\s+أيام?)/i);
    if (!startTime && daysAgoMatch) {
      const days = parseInt(daysAgoMatch[1] || daysAgoMatch[2] || daysAgoMatch[3] || '1', 10);
      const target = new Date(referenceDate);
      target.setDate(referenceDate.getDate() - days);
      startTime = new Date(target);
      startTime.setHours(0, 0, 0, 0);
      endTime = new Date(target);
      endTime.setHours(23, 59, 59, 999);
      label = `${days} days ago`;
    }

    // 4. "last week" (الأسبوع الماضي)
    if (!startTime && /(?:last\s+week|الأسبوع\s+الماضي|الاسبوع\s+الماضي|الاسبوع\s+اللي\s+فات)/i.test(qLower)) {
      startTime = new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      endTime = new Date(referenceDate);
      label = 'Last 7 Days';
    }

    // Clean temporal tokens from search text
    const cleanedQuery = query
      .replace(/(?:last|past|previous)\s+(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tue|wed|thu|fri|sat)/gi, '')
      .replace(/(?:يوم\\s+)?(?:الأحد|الاحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|السبت)\s+(?:الماضي|الفائت|اللي فات)/gi, '')
      .replace(/(?:yesterday|last week|أمس|البارحة|الاسبوع الماضي|الأسبوع الماضي)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      startTime: startTime ? startTime.toISOString() : null,
      endTime: endTime ? endTime.toISOString() : null,
      cleanedQuery: cleanedQuery || query,
      detectedWindowLabel: label
    };
  }
}

/**
 * ============================================================================
 * CODE IDENTIFIER & SYMBOL EXTRACTOR (Needle-in-Code Precision)
 * ============================================================================
 */
export class CodeSymbolExtractor {
  public static extractSymbols(text: string): string[] {
    if (!text) return [];
    const symbols = new Set<string>();

    // 1. Explicit variable, constant, function declarations
    const declPatterns = [
      /(?:const|let|var|function|def|class|interface|type|enum)\s+([_a-zA-Z0-9$]+)/g,
      /(?:^|[^\w$])([_a-zA-Z$][a-zA-Z0-9_$]{2,60})(?=[^\w$]|$)/g, // handles identifiers including _x1_auth_nonce_ephemeral_v9
      /\b([a-z]+(?:[A-Z][a-z0-9]+)+)\b/g,  // camelCase (e.g. authNonceEphemeral)
      /\b([A-Z]+(?:_[A-Z0-9]+)+)\b/g,      // SCREAMING_SNAKE (e.g. MAX_TOKEN_LIMIT)
      /\b(CVE-\d{4}-\d{4,})\b/gi           // Security CVEs
    ];

    declPatterns.forEach(pattern => {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const sym = match[1] ? match[1].trim() : '';
        if (sym && sym.length >= 3 && sym.length <= 60 && !/^(const|let|var|function|return|import|export|from|class|type)$/i.test(sym)) {
          symbols.add(sym);
        }
      }
    });

    // 2. Inline code mentions `symbol`
    const inlineCodeMatches = text.match(/`([^`\n]{2,50})`/g) || [];
    inlineCodeMatches.forEach(tick => {
      const inner = tick.replace(/`/g, '').trim();
      if (/^[_a-zA-Z0-9$.-]{2,50}$/.test(inner)) {
        symbols.add(inner);
      }
    });

    return Array.from(symbols);
  }
}

/**
 * ============================================================================
 * EMBEDDING PROVIDER (OpenAI / OpenRouter text-embedding-3-small + Fallback)
 * ============================================================================
 */
export class EmbeddingProvider {
  private static readonly EMBEDDING_DIMENSION = 1536;
  private static readonly cache = new Map<string, number[]>();

  public static async getEmbedding(text: string): Promise<number[]> {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return new Array(this.EMBEDDING_DIMENSION).fill(0);
    }

    const clean = text.slice(0, 8000).trim();
    if (this.cache.has(clean)) {
      return this.cache.get(clean)!;
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (openRouterApiKey || openAiApiKey) {
      try {
        const endpoint = openRouterApiKey
          ? 'https://openrouter.ai/api/v1/embeddings'
          : 'https://api.openai.com/v1/embeddings';

        const authHeader = openRouterApiKey
          ? `Bearer ${openRouterApiKey}`
          : `Bearer ${openAiApiKey}`;

        const model = openRouterApiKey 
          ? 'openai/text-embedding-3-small' 
          : 'text-embedding-3-small';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
            ...(openRouterApiKey ? { 'HTTP-Referer': 'https://matany.one', 'X-Title': 'Matany.one' } : {})
          },
          body: JSON.stringify({
            input: clean,
            model: model,
            dimensions: this.EMBEDDING_DIMENSION
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          const json = await response.json();
          const vec = json?.data?.[0]?.embedding;
          if (Array.isArray(vec) && vec.length === this.EMBEDDING_DIMENSION) {
            this.cache.set(clean, vec);
            if (this.cache.size > 2000) {
              const firstKey = this.cache.keys().next().value;
              if (firstKey) this.cache.delete(firstKey);
            }
            return vec;
          }
        }
      } catch (err) {
        console.warn('[EmbeddingProvider] Upstream API failed, using deterministic semantic fallback:', err);
      }
    }

    const fallbackVec = this.generateSemanticFallbackVector(clean);
    this.cache.set(clean, fallbackVec);
    return fallbackVec;
  }

  public static generateSemanticFallbackVector(text: string): number[] {
    const dim = this.EMBEDDING_DIMENSION;
    const vector = new Float64Array(dim);
    const normalized = text.toLowerCase().normalize('NFKD');

    const words = normalized.split(/\s+/).filter(Boolean);
    words.forEach((word, wIdx) => {
      const weight = 1.0 / Math.sqrt(wIdx + 1);
      for (let i = 0; i < word.length; i++) {
        const charCode = word.charCodeAt(i);
        const pos1 = (charCode * 31 + i * 17 + wIdx * 101) % dim;
        const pos2 = (charCode * 59 + i * 43 + (pos1 * 7)) % dim;
        vector[pos1] += Math.sin(charCode + i) * weight;
        vector[pos2] += Math.cos(charCode * 2 + i) * weight;
      }
    });

    for (let i = 0; i < normalized.length - 2; i++) {
      const triHash = (normalized.charCodeAt(i) << 10) ^ (normalized.charCodeAt(i + 1) << 5) ^ normalized.charCodeAt(i + 2);
      const targetBucket = Math.abs(triHash) % dim;
      vector[targetBucket] += 0.5;
    }

    let sumSq = 0;
    for (let i = 0; i < dim; i++) {
      sumSq += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSq) || 1.0;
    const result: number[] = new Array(dim);
    for (let i = 0; i < dim; i++) {
      result[i] = Number((vector[i] / norm).toFixed(6));
    }
    return result;
  }
}

/**
 * ============================================================================
 * ZERO LEAKAGE PRIVACY SANITIZER
 * ============================================================================
 */
export class MemorySanitizer {
  private static readonly SECRET_PATTERNS = [
    /(?:bearer\s+|token\s+|key\s+|auth\s+|api[_-]?key\s*[:=]\s*)[a-zA-Z0-9_\-.]{20,}/gi,
    /(?:password|passwd|pwd|secret)\s*[:=]\s*['"][^'"]+['"]/gi,
    /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
    /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_\-.]{10,}/g,
    /sbp_[a-zA-Z0-9]{30,}/g,
    /sk-[a-zA-Z0-9_\-.]{20,}/g,
  ];

  public static sanitize(text: string): string {
    if (!text || typeof text !== 'string') return '';
    let res = text;
    for (const pattern of this.SECRET_PATTERNS) {
      res = res.replace(pattern, '[REDACTED_CREDENTIAL]');
    }
    res = res.replace(/(?:SYSTEM_PROMPT|EXCLUSIVE ATTRIBUTION|SYSTEM INSTRUCTION)/gi, '');
    return res.trim();
  }
}

/**
 * ============================================================================
 * MEMORY DETECT SERVICE LAYER (MAX EDITION)
 * ============================================================================
 */
export class MemoryDetectService {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    if (supabaseClient) {
      this.supabase = supabaseClient;
    } else {
      const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://gyxlvreqwikpujzpyegm.supabase.co';
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';
      this.supabase = createClient(url, key);
    }
  }

  /**
   * 1. High-Performance Hybrid Search via match_chat_history RPC (MAX Edition)
   */
  public async searchMemories(params: MemoryDetectSearchParams): Promise<SemanticMemoryRecord[]> {
    const {
      query,
      exact_keywords = [],
      exact_symbols = [],
      project_id = null,
      scope = 'all',
      time_filter = 'all_time',
      start_time = null,
      end_time = null,
      enable_multihop = true,
      limit = 8,
      match_threshold = 0.15,
      userId = null,
      deviceId = null
    } = params;

    const sanitizedQuery = MemorySanitizer.sanitize(query);
    const extractedSymbols = CodeSymbolExtractor.extractSymbols(sanitizedQuery);
    const allSymbols = Array.from(new Set([...exact_symbols, ...extractedSymbols]));

    if (!sanitizedQuery && exact_keywords.length === 0 && allSymbols.length === 0) {
      return [];
    }

    try {
      const queryEmbedding = await EmbeddingProvider.getEmbedding(sanitizedQuery || exact_keywords.join(' '));
      const fullQueryText = [sanitizedQuery, ...exact_keywords].filter(Boolean).join(' ');

      const { data, error } = await this.supabase.rpc('match_chat_history', {
        query_embedding: queryEmbedding,
        query_text: fullQueryText,
        exact_symbols: allSymbols,
        match_threshold: match_threshold,
        match_count: limit,
        p_user_id: userId || null,
        p_device_id: deviceId || null,
        p_project_id: project_id || null,
        p_scope: scope,
        p_time_filter: time_filter,
        p_start_time: start_time || null,
        p_end_time: end_time || null,
        p_enable_multihop: enable_multihop,
        rrf_k: 60
      });

      if (error) {
        console.warn('[MemoryDetectService RPC match_chat_history Error]:', error.message);
        return await this.fallbackDirectSearch(params);
      }

      if (Array.isArray(data)) {
        return data.map((row: any) => ({
          id: row.id,
          chat_id: row.chat_id,
          message_id: row.message_id,
          project_id: row.project_id,
          predicate: row.predicate,
          message_role: row.message_role,
          scope: row.scope,
          content: row.content,
          summary: row.summary,
          entities: Array.isArray(row.entities) ? row.entities : (typeof row.entities === 'string' ? JSON.parse(row.entities) : []),
          keywords: Array.isArray(row.keywords) ? row.keywords : [],
          code_symbols: Array.isArray(row.code_symbols) ? row.code_symbols : [],
          token_count: row.token_count || 0,
          created_at: row.created_at,
          vector_similarity: row.vector_similarity,
          text_similarity: row.text_similarity,
          symbol_match_score: row.symbol_match_score,
          rrf_score: row.rrf_score,
          hop_depth: row.hop_depth || 0,
          linked_via: row.linked_via || null
        }));
      }

      return [];
    } catch (err) {
      console.warn('[MemoryDetectService Exception in searchMemories]:', err);
      return await this.fallbackDirectSearch(params);
    }
  }

  /**
   * 2. Iterative Agentic Search Loop with Temporal Resolving & Sub-Query Decomposition
   */
  public async iterativeAgenticSearch(params: IterativeSearchParams): Promise<IterativeSearchOutput> {
    const minConfidence = params.min_confidence ?? 0.20;
    const maxIterations = Math.min(3, params.max_iterations ?? 3);

    // Resolve natural temporal expressions (e.g. "last Tuesday")
    const temporal = TemporalExpressionResolver.resolveTemporalWindow(params.query);
    let currentQuery = temporal.cleanedQuery || params.query;
    let currentStartTime = params.start_time || temporal.startTime;
    let currentEndTime = params.end_time || temporal.endTime;
    let currentScope = params.scope ?? 'all';
    let currentTimeFilter = temporal.startTime ? 'all_time' : (params.time_filter ?? 'all_time');
    let exactKeywords = [...(params.exact_keywords ?? [])];
    let exactSymbols = [...(params.exact_symbols ?? []), ...CodeSymbolExtractor.extractSymbols(params.query)];

    const refinementHistory: Array<{ iteration: number; queryUsed: string; scopeUsed: SemanticMemoryScope; count: number }> = [];
    let bestResults: SemanticMemoryRecord[] = [];
    let highestRrfScore = 0;

    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      const searchResults = await this.searchMemories({
        query: currentQuery,
        exact_keywords: exactKeywords,
        exact_symbols: exactSymbols,
        project_id: params.project_id,
        scope: currentScope,
        time_filter: currentTimeFilter,
        start_time: currentStartTime,
        end_time: currentEndTime,
        enable_multihop: params.enable_multihop ?? true,
        limit: params.limit ?? 8,
        match_threshold: Math.max(0.10, (params.match_threshold ?? 0.15) - (iteration - 1) * 0.04),
        userId: params.userId,
        deviceId: params.deviceId
      });

      const topScore = searchResults[0]?.rrf_score || searchResults[0]?.vector_similarity || 0;
      refinementHistory.push({
        iteration,
        queryUsed: currentQuery,
        scopeUsed: currentScope,
        count: searchResults.length
      });

      if (searchResults.length > 0 && topScore >= highestRrfScore) {
        highestRrfScore = topScore;
        bestResults = searchResults;
      }

      // Early exit if high-confidence results achieved
      if (searchResults.length >= 1 && (topScore >= minConfidence || searchResults[0]?.symbol_match_score === 1.0)) {
        break;
      }

      // Autonomous Reformulation for next iteration
      if (iteration === 1) {
        // Expand Jargon & Synonyms (e.g. "database issue" -> "migration OR table OR error OR postgres")
        currentQuery = this.expandJargonAndSynonyms(currentQuery);
        currentScope = 'all';
      } else if (iteration === 2) {
        // Broaden temporal window to all_time and extract all identifier tokens
        currentTimeFilter = 'all_time';
        currentStartTime = null;
        currentEndTime = null;
        const tokens = this.extractKeyEntitiesAndTokens(params.query);
        exactKeywords = Array.from(new Set([...exactKeywords, ...tokens]));
      }
    }

    const multiHopPathsCount = bestResults.filter(r => (r.hop_depth || 0) > 0).length;
    const isConfident = bestResults.length > 0 && (highestRrfScore >= 0.15 || bestResults[0]?.symbol_match_score === 1.0);
    const synthesizedContextBlock = this.synthesizeContextBlock(bestResults, temporal.detectedWindowLabel);

    return {
      results: bestResults,
      iterationsRun: refinementHistory.length,
      refinementHistory,
      isConfident,
      synthesizedContextBlock,
      multiHopPathsCount
    };
  }

  /**
   * 3. Update Memory Node with Code Symbol Indexing
   */
  public async updateMemoryNode(params: MemoryUpdateParams): Promise<{ success: boolean; updatedId?: string; error?: string }> {
    const { nodeId, newContent, newSummary, newEntities = [], newKeywords = [], newCodeSymbols = [], reason, userId, deviceId } = params;
    const cleanContent = MemorySanitizer.sanitize(newContent);
    const cleanSummary = newSummary ? MemorySanitizer.sanitize(newSummary) : undefined;
    const extractedSymbols = Array.from(new Set([...newCodeSymbols, ...CodeSymbolExtractor.extractSymbols(cleanContent)]));

    try {
      const newEmbedding = await EmbeddingProvider.getEmbedding(cleanContent);

      const { data, error } = await this.supabase.rpc('update_memory_node_content', {
        p_node_id: nodeId,
        p_new_content: cleanContent,
        p_new_summary: cleanSummary || null,
        p_new_entities: newEntities,
        p_new_keywords: newKeywords,
        p_new_code_symbols: extractedSymbols,
        p_new_embedding: newEmbedding,
        p_reason: reason || 'Updated via Memory Detect',
        p_user_id: userId || null,
        p_device_id: deviceId || null
      });

      if (error) {
        console.warn('[MemoryDetectService updateMemoryNode RPC Error]:', error.message);
        const { error: directErr } = await this.supabase
          .from('x1_semantic_memories')
          .update({
            content: cleanContent,
            summary: cleanSummary,
            entities: newEntities,
            keywords: newKeywords,
            code_symbols: extractedSymbols,
            embedding: newEmbedding,
            revision_reason: reason,
            updated_at: new Date().toISOString()
          })
          .eq('id', nodeId);

        if (directErr) return { success: false, error: directErr.message };
        return { success: true, updatedId: nodeId };
      }

      return data || { success: true, updatedId: nodeId };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update memory node' };
    }
  }

  /**
   * 4. Link two chat sessions in the memory graph
   */
  public async linkChatContexts(params: ChatLinkParams): Promise<{ success: boolean; linkId?: string; error?: string }> {
    const { sourceChatId, targetChatId, relationshipType, confidence = 1.0, metadata = {}, userId, deviceId } = params;

    try {
      const { data, error } = await this.supabase.rpc('link_chat_sessions', {
        p_source_chat_id: sourceChatId,
        p_target_chat_id: targetChatId,
        p_relationship_type: relationshipType,
        p_confidence: confidence,
        p_metadata: metadata,
        p_user_id: userId || null,
        p_device_id: deviceId || null
      });

      if (error) {
        console.warn('[MemoryDetectService linkChatContexts RPC Error]:', error.message);
        const { data: upsertData, error: directErr } = await this.supabase
          .from('x1_chat_links')
          .upsert({
            user_id: userId || null,
            device_id: deviceId || null,
            source_chat_id: sourceChatId,
            target_chat_id: targetChatId,
            relationship_type: relationshipType,
            confidence: confidence,
            metadata: metadata,
            created_at: new Date().toISOString()
          }, { onConflict: 'source_chat_id,target_chat_id,relationship_type' })
          .select('id')
          .single();

        if (directErr) return { success: false, error: directErr.message };
        return { success: true, linkId: upsertData?.id };
      }

      return data || { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to link chat contexts' };
    }
  }

  /**
   * 5. Query chat graph topology
   */
  public async getChatGraphTopology(
    chatId: string,
    userId?: string | null,
    deviceId?: string | null
  ): Promise<ChatGraphEdge[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_chat_graph_topology', {
        p_chat_id: chatId,
        p_user_id: userId || null,
        p_device_id: deviceId || null,
        p_max_depth: 2
      });

      if (error) {
        console.warn('[MemoryDetectService getChatGraphTopology Error]:', error.message);
        return [];
      }

      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  /**
   * 6. Background Asynchronous Ingestion & Semantic Chunking Pipeline
   */
  public async autoIndexConversation(params: {
    chatId: string;
    messages: Array<{ id?: string; role: string; content: string }>;
    chatTitle?: string;
    projectId?: string;
    userId?: string | null;
    deviceId?: string | null;
  }): Promise<{ indexedCount: number }> {
    const { chatId, messages, chatTitle = 'محادثة سابقة', projectId = 'default_project', userId = null, deviceId = null } = params;
    if (!chatId || !Array.isArray(messages) || messages.length === 0) {
      return { indexedCount: 0 };
    }

    try {
      const memoryNodesToInsert: any[] = [];
      const userFacts: Array<{ text: string; predicate?: string }> = [];
      const technicalCodeBlocks: string[] = [];
      const cyberFindings: string[] = [];
      const targetUrls: string[] = [];
      const extractedEntities: Set<string> = new Set();
      const extractedSymbols: Set<string> = new Set();

      messages.forEach(msg => {
        const raw = msg.content || '';
        const clean = MemorySanitizer.sanitize(raw);
        if (!clean || clean.length < 5) return;

        // Extract symbols and entities
        const symbols = CodeSymbolExtractor.extractSymbols(clean);
        symbols.forEach(s => extractedSymbols.add(s));

        const foundEntities = clean.match(/\b([A-Z][a-zA-Z0-9_\-.]{2,}|(?:React|Next\.js|Tailwind|Node|Supabase|Python|TypeScript|Docker|Kubernetes|AWS|GCP|Cloudflare|Nginx|PostgreSQL|GraphQL|OAuth|JWT|CVE-\d{4}-\d{4,}))\b/g) || [];
        foundEntities.forEach(e => extractedEntities.add(e));

        // Extract code snippets
        if (clean.includes('```')) {
          const codeMatches = clean.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g) || [];
          codeMatches.forEach(block => {
            if (block.length < 2000) technicalCodeBlocks.push(block);
          });
        }

        // Extract URLs
        const urlMatches = clean.match(/https?:\/\/[^\s\)\"\'\<\>]+/g) || [];
        urlMatches.forEach(u => targetUrls.push(u));

        // Predicate recognition (Ports, DB, Auth, Bugfixes)
        if (msg.role === 'user' || msg.role === 'assistant') {
          const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
          lines.forEach(line => {
            if (/(?:(?:port|بورت|منفذ)\s*(?:is|:|is running on|migrated to|أصبح|تم تغيير|يعمل على|to)?|(?:migrated to port|changed port to|listening on port))\s*(\d{2,5})/i.test(line)) {
              userFacts.push({ text: line, predicate: 'SERVER_PORT' });
            } else if (/(?:database|قاعدة البيانات)\s*(?:is|:|هي|تستخدم|engine)\s*([A-Za-z0-9_]+)/i.test(line)) {
              userFacts.push({ text: line, predicate: 'DATABASE_ENGINE' });
            } else if (/(?:اسمي|مشروعي|موقعي|الشركة|نظام|أريد بناء|قاعدة البيانات|التقنية المستخدمة|السيرفر|الاستضافة)/i.test(line) && line.length < 180) {
              userFacts.push({ text: line });
            }
          });
        }

        if (msg.role === 'assistant' && (clean.includes('[CRITICAL]') || clean.includes('[HIGH]') || clean.includes('ثغرة') || clean.includes('نتيجة الفحص'))) {
          const lines = clean.split('\n').filter(l => l.includes('[CRITICAL]') || l.includes('[HIGH]') || l.includes('ثغرة'));
          lines.slice(0, 3).forEach(l => cyberFindings.push(l.slice(0, 160)));
        }
      });

      const entitiesArray = Array.from(extractedEntities).slice(0, 25);
      const symbolsArray = Array.from(extractedSymbols).slice(0, 50);

      // Node 1: Session Summary
      const sessionSummary = `${chatTitle} — ${userFacts.map(u => u.text).slice(0, 2).join(' • ') || 'جلسة محادثة وتحليل فني'}`;
      const summaryEmbedding = await EmbeddingProvider.getEmbedding(sessionSummary);
      
      memoryNodesToInsert.push({
        chat_id: chatId,
        user_id: userId,
        device_id: deviceId,
        project_id: projectId,
        message_role: 'distilled_summary',
        scope: 'decisions',
        content: `[ملخص جلسة: "${chatTitle}"]\n${sessionSummary}`,
        summary: sessionSummary,
        entities: entitiesArray,
        keywords: [chatTitle, ...entitiesArray.slice(0, 5)],
        code_symbols: symbolsArray.slice(0, 10),
        embedding: summaryEmbedding,
        token_count: Math.ceil(sessionSummary.length / 3.5),
        relevance_weight: 1.5,
        is_latest: true
      });

      // Node 2: Predicate & Ground Truth Facts
      for (const fact of userFacts) {
        const factEmbedding = await EmbeddingProvider.getEmbedding(fact.text);
        
        // If functional predicate exists, use atomic conflict reconciliation
        if (fact.predicate) {
          await this.supabase.rpc('reconcile_and_upsert_memory', {
            p_chat_id: chatId,
            p_project_id: projectId,
            p_predicate: fact.predicate,
            p_message_role: 'insight',
            p_scope: 'user_facts',
            p_content: fact.text,
            p_summary: fact.text.slice(0, 80),
            p_entities: entitiesArray,
            p_keywords: ['predicate', fact.predicate, ...entitiesArray.slice(0, 4)],
            p_code_symbols: symbolsArray.slice(0, 10),
            p_embedding: factEmbedding,
            p_token_count: Math.ceil(fact.text.length / 3.5),
            p_user_id: userId,
            p_device_id: deviceId
          });
        } else {
          memoryNodesToInsert.push({
            chat_id: chatId,
            user_id: userId,
            device_id: deviceId,
            project_id: projectId,
            message_role: 'insight',
            scope: 'user_facts',
            content: `[حقيقة مشروع]: ${fact.text}`,
            summary: fact.text.slice(0, 80),
            entities: entitiesArray,
            keywords: ['user_facts', ...entitiesArray.slice(0, 4)],
            code_symbols: symbolsArray.slice(0, 10),
            embedding: factEmbedding,
            token_count: Math.ceil(fact.text.length / 3.5),
            relevance_weight: 1.8,
            is_latest: true
          });
        }
      }

      // Node 3: Code Snippets & Symbols
      if (technicalCodeBlocks.length > 0) {
        for (const code of technicalCodeBlocks.slice(0, 3)) {
          const codeSample = code.slice(0, 1200);
          const snippetSymbols = CodeSymbolExtractor.extractSymbols(codeSample);
          const codeEmbedding = await EmbeddingProvider.getEmbedding(codeSample);
          
          memoryNodesToInsert.push({
            chat_id: chatId,
            user_id: userId,
            device_id: deviceId,
            project_id: projectId,
            message_role: 'insight',
            scope: 'code_snippets',
            content: codeSample,
            summary: `كود برمجي (${snippetSymbols.slice(0, 3).join(', ') || 'Snippet'})`,
            entities: entitiesArray,
            keywords: ['code', ...snippetSymbols.slice(0, 5)],
            code_symbols: snippetSymbols,
            embedding: codeEmbedding,
            token_count: Math.ceil(codeSample.length / 3.5),
            relevance_weight: 1.6,
            is_latest: true
          });
        }
      }

      // Bulk Insert non-predicate memory nodes
      if (memoryNodesToInsert.length > 0) {
        await this.supabase
          .from('x1_semantic_memories')
          .insert(memoryNodesToInsert);
      }

      return { indexedCount: memoryNodesToInsert.length + userFacts.filter(f => f.predicate).length };
    } catch (err) {
      console.warn('[MemoryDetectService autoIndexConversation Exception]:', err);
      return { indexedCount: 0 };
    }
  }

  /**
   * Helper: Synthesize structured LLM prompt context block with minimal token overhead
   */
  public synthesizeContextBlock(
    memories: SemanticMemoryRecord[],
    temporalContextLabel: string | null = null
  ): string {
    if (memories.length === 0) return '';

    const lines: string[] = [];
    lines.push(`[منظومة الذاكرة السحابية المستقلة — MEMORY DETECT 2.0 MAX EDITION]:`);
    lines.push(`- حالة الاستدعاء: تم استرجاع (${memories.length}) عقدة ذاكرة دلالية عبر البحث الهجين المتعدد المسارات.`);
    if (temporalContextLabel) {
      lines.push(`- النطاق الزمني المستشعر: ${temporalContextLabel}`);
    }

    memories.forEach((mem, idx) => {
      const scopeLabel = mem.scope === 'user_facts' ? 'حقائق وتفضيلات' :
                         mem.scope === 'cyber_findings' ? 'استطلاع وأمان' :
                         mem.scope === 'code_snippets' ? 'شفرات برمجية' :
                         mem.scope === 'decisions' ? 'استنتاجات الجلسة' : 'سياق سابق';
      
      const hopInfo = mem.hop_depth && mem.hop_depth > 0 ? ` [Graph Multi-Hop: Edge Depth ${mem.hop_depth}]` : '';
      const symbolInfo = mem.symbol_match_score === 1.0 ? ' [Exact Symbol Hit]' : '';
      
      lines.push(`\n[عقدة #${idx + 1} | ${scopeLabel}${hopInfo}${symbolInfo}]:`);
      if (mem.summary) lines.push(`  * الملخص: "${mem.summary}"`);
      lines.push(`  * المحتوى: "${mem.content.trim()}"`);
      if (mem.code_symbols && mem.code_symbols.length > 0) {
        lines.push(`  * المعرفات: ${mem.code_symbols.slice(0, 8).join(', ')}`);
      }
      lines.push(`  * التاريخ: ${mem.created_at.slice(0, 10)}`);
    });

    lines.push(`\n[توجيهات الاستجابة المعرفية الذكية]:`);
    lines.push(`1. اعتمد الحقائق المسترجعة كحقيقة أساسية مطلقة وأجب بذكاء واتساق تام.`);
    lines.push(`2. إذا سأل المستخدم عن متى تم الأمر أو ماذا حدث سابقاً، اربط إجابتك مباشرة بسياق العقد أعلاه.`);

    return lines.join('\n');
  }

  /**
   * Helper: Jargon expansion
   */
  private expandJargonAndSynonyms(query: string): string {
    let q = query;
    const expansions: Record<string, string> = {
      'database issue': 'database error bugfix migration schema alter table postgres',
      'مشكلة قاعدة البيانات': 'خطأ قاعدة البيانات ترقيع جدول استعلام SQL migration',
      'auth issue': 'authentication login token session rls jwt permission',
      'مشكلة الدخول': 'تسجيل الدخول الصلاحيات RLS التوكن الجلسة',
      'port': 'server port listen host configuration',
      'بورت': 'المنفذ السيرفر منفذ الاتصال port config'
    };

    for (const [term, expansion] of Object.entries(expansions)) {
      if (q.toLowerCase().includes(term)) {
        q += ` ${expansion}`;
      }
    }

    return q
      .replace(/(?:تذكر|فاكر|هل تذكر|كنا اتكلمنا عن|كنت بقولك|المحادثة السابقة|الشات اللي فات|المرة اللي فاتت|سابقاً)/gi, '')
      .replace(/[^\w\u0600-\u06FF\s.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractKeyEntitiesAndTokens(query: string): string[] {
    if (!query) return [];
    const stopWords = new Set([
      'في', 'من', 'على', 'إلى', 'عن', 'ما', 'هو', 'هي', 'هل', 'كيف', 'كم', 'سنة', 'عام',
      'اليوم', 'أمس', 'متى', 'لماذا', 'أين', 'مين', 'ده', 'دي', 'أي', 'the', 'is', 'and', 'for', 'in'
    ]);

    const words = query
      .replace(/[^\w\u0600-\u06FF\s.-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stopWords.has(w.toLowerCase()));

    return Array.from(new Set(words));
  }

  private async fallbackDirectSearch(params: MemoryDetectSearchParams): Promise<SemanticMemoryRecord[]> {
    try {
      const clean = MemorySanitizer.sanitize(params.query);
      let query = this.supabase
        .from('x1_semantic_memories')
        .select('*')
        .eq('is_latest', true)
        .order('created_at', { ascending: false })
        .limit(params.limit || 8);

      if (params.userId) {
        query = query.eq('user_id', params.userId);
      } else if (params.deviceId) {
        query = query.eq('device_id', params.deviceId);
      }

      if (params.project_id) {
        query = query.eq('project_id', params.project_id);
      }

      if (params.scope && params.scope !== 'all') {
        query = query.eq('scope', params.scope);
      }

      if (clean) {
        query = query.ilike('content', `%${clean}%`);
      }

      const { data, error } = await query;
      if (error || !Array.isArray(data)) return [];

      return data.map((row: any) => ({
        id: row.id,
        chat_id: row.chat_id,
        message_id: row.message_id,
        project_id: row.project_id,
        predicate: row.predicate,
        message_role: row.message_role,
        scope: row.scope,
        content: row.content,
        summary: row.summary,
        entities: row.entities || [],
        keywords: row.keywords || [],
        code_symbols: row.code_symbols || [],
        token_count: row.token_count || 0,
        created_at: row.created_at,
        text_similarity: 0.85,
        rrf_score: 0.25,
        hop_depth: 0
      }));
    } catch {
      return [];
    }
  }
}
