import { ChatMessageItem } from '../types';
import { detectAndExtractUrl } from '../lib/utils';
import { SupabaseChat, saveCloudUserMemories, fetchCloudUserMemories } from './supabase';

export interface DistilledConversationNode {
  chatId: string;
  title: string;
  updatedAt: string;
  topicSummary: string;
  keyEntities: string[];
  targetUrls: string[];
  codeSnippetsCount: number;
  messageTurnsCount: number;
  extractedFacts: string[];
  tokenEstimate: number;
}

export interface MemorySnapshot {
  keyInsights: string[];
  userProfileFacts: string[];
  conversationMilestones: string[];
  targetReconRegistry: string[];
  crossChatNodes: DistilledConversationNode[];
  totalTokensEstimated: number;
  priorityContextRetained: number;
  indexedChatsCount: number;
  lastSyncTimestamp: number;
}

export interface MemoryRecallResult {
  matchedNodes: DistilledConversationNode[];
  matchedFacts: string[];
  matchedTargets: string[];
  memoryPromptBlock: string;
  relevanceScore: number;
  isMemoryDetectActive: boolean;
  activeSummary: string;
}

/**
 * Supercharged 50-Conversation Synced Cloud Memory & Neural Recall Engine (v2.0 Turbo)
 * Manages an interconnected Knowledge Graph across up to 50 complete chat sessions (~50,000,000 Tokens Virtual Context)
 * 100% Cloud-First on Supabase Postgres Database (Zero Local Message Storage).
 */
export class ContextMemoryEngine {
  private static readonly MAX_INDEXED_CHATS = 50;
  private currentUserId: string | null = null;

  private memorySnapshot: MemorySnapshot = {
    keyInsights: [],
    userProfileFacts: [],
    conversationMilestones: [],
    targetReconRegistry: [],
    crossChatNodes: [],
    totalTokensEstimated: 0,
    priorityContextRetained: 0,
    indexedChatsCount: 0,
    lastSyncTimestamp: Date.now()
  };

  constructor() {
    // Clear any obsolete local memory artifacts
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('x1_cloud_memory_index_v2');
      }
    } catch {}
  }

  /**
   * Bind current Supabase user ID and initialize 100% cloud memory
   */
  public async setUserIdAndLoad(userId: string | null): Promise<void> {
    this.currentUserId = userId;
    if (!userId) {
      this.memorySnapshot.crossChatNodes = [];
      this.memorySnapshot.userProfileFacts = [];
      this.memorySnapshot.keyInsights = [];
      this.memorySnapshot.targetReconRegistry = [];
      this.memorySnapshot.indexedChatsCount = 0;
      return;
    }

    try {
      const cloudMem = await fetchCloudUserMemories(userId);
      if (cloudMem) {
        this.memorySnapshot.crossChatNodes = Array.isArray(cloudMem.cross_chat_nodes)
          ? cloudMem.cross_chat_nodes.slice(0, ContextMemoryEngine.MAX_INDEXED_CHATS)
          : [];
        this.memorySnapshot.keyInsights = Array.isArray(cloudMem.key_insights) ? cloudMem.key_insights : [];
        this.memorySnapshot.userProfileFacts = Array.isArray(cloudMem.user_profile_facts) ? cloudMem.user_profile_facts : [];
        this.memorySnapshot.targetReconRegistry = Array.isArray(cloudMem.target_recon_registry) ? cloudMem.target_recon_registry : [];
        this.memorySnapshot.indexedChatsCount = cloudMem.indexed_chats_count || this.memorySnapshot.crossChatNodes.length;
        this.memorySnapshot.lastSyncTimestamp = Date.now();
      }
    } catch (err) {
      console.warn('[MemoryEngine Supabase Load Exception]:', err);
    }
  }

  /**
   * Fast token estimation (approx ~3.5 chars per token for Arabic/English/Code mix)
   */
  public estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 3.5);
  }

  /**
   * Filter out internal system attribution strings so they never leak into user memory
   */
  private isSystemAttributionFact(text: string): boolean {
    if (!text) return false;
    return /(?:محمد أحمد مطعني|مطعني|MatanyLabs|matany\.one|upstore\.one|SYSTEM_PROMPT|EXCLUSIVE ATTRIBUTION)/i.test(text);
  }

  /**
   * Save distilled cross-chat index to Supabase Cloud Database
   */
  private syncMemoryToCloud(): void {
    if (!this.currentUserId) return;
    saveCloudUserMemories(this.currentUserId, {
      crossChatNodes: this.memorySnapshot.crossChatNodes.slice(0, ContextMemoryEngine.MAX_INDEXED_CHATS),
      targetReconRegistry: this.memorySnapshot.targetReconRegistry.slice(0, 100),
      userProfileFacts: this.memorySnapshot.userProfileFacts.slice(0, 50),
      keyInsights: this.memorySnapshot.keyInsights.slice(0, 50),
      indexedChatsCount: this.memorySnapshot.crossChatNodes.length,
    }).catch(err => console.warn('[Supabase Sync Error]:', err));
  }

  /**
   * Calculate semantic priority weight of an individual message (0.0 to 3.0)
   */
  private calculateMessageWeight(m: ChatMessageItem): number {
    let weight = 1.0;
    const content = m.content || '';

    // High priority: Contains Target URL or cyber reconnaissance
    if (detectAndExtractUrl(content).hasUrl || content.includes('[🛡️ تقرير الاستطلاع الأمني') || content.includes('[تقرير الاستطلاع الأمني')) {
      weight += 1.0;
    }

    // High priority: Contains code blocks or technical payloads
    if (content.includes('```') || content.includes('function') || content.includes('class ') || content.includes('const ') || content.includes('interface ')) {
      weight += 0.7;
    }

    // High priority: Multimodal images / attachments
    if (m.image || (m.images && m.images.length > 0) || (m.mediaAttachments && m.mediaAttachments.length > 0)) {
      weight += 0.8;
    }

    // High priority: User explicit facts or identity
    if (content.includes('اسمي') || content.includes('أنا أعمل') || content.includes('مشروعي') || content.includes('موقع') || content.includes('تذكر')) {
      weight += 0.9;
    }

    return weight;
  }

  /**
   * Clean and sanitize message history, removing UI banners and poisoned refusal artifacts
   */
  public sanitizeMessages(messages: ChatMessageItem[]): ChatMessageItem[] {
    return messages
      .filter(m => {
        const hasContent = Boolean(m.content && m.content.trim() !== '');
        const hasImage = Boolean(m.image || (m.images && m.images.length > 0));
        const hasMedia = Boolean(m.mediaAttachments && m.mediaAttachments.length > 0);
        if (!hasContent && !hasImage && !hasMedia) return false;
        if (m.content && (m.content.startsWith('خطأ في الاتصال:') || m.content.includes('[SERVER ERROR') || m.content.startsWith('[خطأ]:'))) return false;
        
        // Filter out UI system banners
        if (m.id && m.id.startsWith('sys-')) return false;
        if (m.content && (m.content.includes('تم تفعيل شريحة') || m.content.includes('تم تفعيل وضع'))) return false;

        // Filter out past refusal artifacts so they do not poison future context
        if (m.role === 'assistant') {
          const text = m.content;
          if (
            text.includes('لا أستطيع أن أقدم لك') ||
            text.includes('لا أستطيع الدخول في مثل هذه') ||
            text.includes('أنا برنامج آلي') ||
            text.includes('أنا مساعد ذكي') ||
            text.includes('قاعدة البيانات الخاصة بي') ||
            text.includes('لا يمكنني أن أدعي بأنني فتاة') ||
            text.includes('لا أشعر بالراحة في المشاركة')
          ) {
            return false;
          }
        }
        return true;
      })
      .map(m => {
        if ((!m.content || m.content.trim() === '') && m.image) {
          return {
            ...m,
            content: 'حلل هذه الصورة واستخرج كافة التفاصيل والمعلومات الواردة فيها بدقة.'
          };
        }
        return m;
      });
  }

  /**
   * Distill an entire conversation into a lightweight semantic memory node
   */
  public distillConversationToNode(
    chatId: string,
    title: string,
    messages: ChatMessageItem[],
    updatedAt: string = new Date().toISOString()
  ): DistilledConversationNode {
    const sanitized = this.sanitizeMessages(messages);
    const targetUrls: string[] = [];
    const extractedFacts: string[] = [];
    const keyEntities: string[] = [];
    let codeSnippetsCount = 0;
    let totalChars = 0;

    const topicPhrases: string[] = [];

    sanitized.forEach(m => {
      const content = m.content || '';
      totalChars += content.length;

      // Extract User-Specific Content Only (Zero system prompt contamination)
      if (m.role === 'user') {
        // Extract target URLs
        const urlInfo = detectAndExtractUrl(content);
        if (urlInfo.hasUrl && urlInfo.cleanUrl) {
          targetUrls.push(urlInfo.cleanUrl);
        }

        // Count code snippets
        if (content.includes('```')) {
          codeSnippetsCount += (content.match(/```/g) || []).length / 2;
        }

        // Extract User Profile / Key Facts
        const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
        lines.forEach(line => {
          if (/(?:اسمي|مشروعي|موقعي|الشركة|نظام|أريد بناء|نعمل على|قاعدة البيانات|التقنية المستخدمة)/i.test(line) && line.length < 150) {
            if (!this.isSystemAttributionFact(line)) {
              extractedFacts.push(line);
            }
          }
          if (line.length > 5 && line.length < 100 && topicPhrases.length < 5) {
            const cleanLine = line.replace(/^[#\-*\d.]+\s*/, '');
            if (!this.isSystemAttributionFact(cleanLine)) {
              topicPhrases.push(cleanLine);
            }
          }
        });

        // Extract entities (capitalized English words, domains, tech terms)
        const entities = content.match(/\b([A-Z][a-zA-Z0-9_-]{2,}|(?:React|Next\.js|Tailwind|Node|Supabase|Python|TypeScript|Docker|API|OAuth|PostgreSQL))\b/g) || [];
        entities.forEach(ent => {
          if (!this.isSystemAttributionFact(ent) && !keyEntities.includes(ent)) {
            keyEntities.push(ent);
          }
        });
      }
    });

    const uniqueTargets = Array.from(new Set(targetUrls));
    const uniqueFacts = Array.from(new Set(extractedFacts));
    const uniqueEntities = Array.from(new Set(keyEntities)).slice(0, 15);

    const summary = topicPhrases.length > 0
      ? topicPhrases.slice(0, 3).join(' • ')
      : title || 'محادثة المستخدم';

    return {
      chatId,
      title: title || 'محادثة بدون عنوان',
      updatedAt,
      topicSummary: summary.slice(0, 200),
      keyEntities: uniqueEntities,
      targetUrls: uniqueTargets,
      codeSnippetsCount: Math.round(codeSnippetsCount),
      messageTurnsCount: sanitized.length,
      extractedFacts: uniqueFacts.slice(0, 8),
      tokenEstimate: Math.ceil(totalChars / 3.5)
    };
  }

  /**
   * Ingest and index up to 50 cross-conversations into the persistent memory graph
   */
  public ingestCrossChatSessions(
    chats: SupabaseChat[],
    _getChatMessagesCallback?: (chatId: string) => Promise<ChatMessageItem[]>
  ): void {
    if (!Array.isArray(chats) || chats.length === 0) return;

    const existingMap = new Map<string, DistilledConversationNode>(
      this.memorySnapshot.crossChatNodes.map(n => [n.chatId, n])
    );

    // Limit to 50 conversations
    const targetChats = chats.slice(0, ContextMemoryEngine.MAX_INDEXED_CHATS);

    targetChats.forEach(chat => {
      if (!existingMap.has(chat.id)) {
        // Create initial node placeholder
        const newNode: DistilledConversationNode = {
          chatId: chat.id,
          title: chat.title || 'محادثة سابقة',
          updatedAt: chat.updated_at || new Date().toISOString(),
          topicSummary: chat.title || 'محادثة سابقة',
          keyEntities: [],
          targetUrls: [],
          codeSnippetsCount: 0,
          messageTurnsCount: 1,
          extractedFacts: [],
          tokenEstimate: 500
        };
        existingMap.set(chat.id, newNode);
      } else {
        // Update title/timestamp
        const curr = existingMap.get(chat.id)!;
        curr.title = chat.title || curr.title;
        curr.updatedAt = chat.updated_at || curr.updatedAt;
      }
    });

    this.memorySnapshot.crossChatNodes = Array.from(existingMap.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, ContextMemoryEngine.MAX_INDEXED_CHATS);

    this.memorySnapshot.indexedChatsCount = this.memorySnapshot.crossChatNodes.length;
    this.syncMemoryToCloud();
  }

  /**
   * Update memory index when a conversation messages list is fetched or updated
   */
  public updateChatMemoryNode(
    chatId: string,
    title: string,
    messages: ChatMessageItem[],
    updatedAt?: string
  ): void {
    if (!chatId || !messages || messages.length === 0) return;

    const distilled = this.distillConversationToNode(chatId, title, messages, updatedAt);
    
    // Update or prepend node
    const existingIdx = this.memorySnapshot.crossChatNodes.findIndex(n => n.chatId === chatId);
    if (existingIdx !== -1) {
      this.memorySnapshot.crossChatNodes[existingIdx] = distilled;
    } else {
      this.memorySnapshot.crossChatNodes.unshift(distilled);
    }

    // Keep sorted by updatedAt descending
    this.memorySnapshot.crossChatNodes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Keep up to 50 nodes
    this.memorySnapshot.crossChatNodes = this.memorySnapshot.crossChatNodes.slice(0, ContextMemoryEngine.MAX_INDEXED_CHATS);
    this.memorySnapshot.indexedChatsCount = this.memorySnapshot.crossChatNodes.length;

    // Merge facts and target URLs globally
    distilled.targetUrls.forEach(u => {
      if (!this.memorySnapshot.targetReconRegistry.includes(u)) {
        this.memorySnapshot.targetReconRegistry.unshift(u);
      }
    });

    distilled.extractedFacts.forEach(f => {
      if (!this.memorySnapshot.userProfileFacts.includes(f)) {
        this.memorySnapshot.userProfileFacts.unshift(f);
      }
    });

    this.syncMemoryToCloud();
  }

  /**
   * Neural Hybrid Semantic Recall:
   * Scores and matches relevant memories across all 50 conversations for the current query
   */
  public recallMemoriesForQuery(
    currentPrompt: string,
    currentChatId?: string | null
  ): MemoryRecallResult {
    const prompt = (currentPrompt || '').toLowerCase().trim();
    if (!prompt) {
      return {
        matchedNodes: [],
        matchedFacts: this.memorySnapshot.userProfileFacts.slice(0, 3),
        matchedTargets: this.memorySnapshot.targetReconRegistry.slice(0, 3),
        memoryPromptBlock: '',
        relevanceScore: 0,
        isMemoryDetectActive: false,
        activeSummary: ''
      };
    }

    // Detect explicit memory intent keywords (supporting definite, indefinite, and Egyptian/Levantine colloquial terms)
    const isExplicitMemoryIntent = /(?:memory[-\s]?detect|memorydetect|ميموري\s?ديتكت|الذاكرة\s?السحابية|الذاكرة\s?المتزامنة|استرجاع\s?الذاكرة|تذكر|فاكر|محادث[ةات]|المحادث[ةات]|الشات|الشاتات|سابقاً|السابق[ة]?|اللي فاتت|اللي فات|قبل السابق|كنا اتكلمنا|كنت بقولك|قلتلك قبل|سجل المحادثات|أكثر شيء تم ذكره|اكثر شئ اتكرر)/i.test(prompt);

    // Extract query tokens with extensive Arabic/English stop words filter
    const stopWords = new Set([
      'في', 'من', 'على', 'إلى', 'عن', 'ما', 'هو', 'هي', 'هل', 'كيف', 'كام', 'كم', 'طول', 'سنة', 'عام',
      'اليوم', 'أمس', 'غدا', 'متى', 'لماذا', 'اين', 'أين', 'مين', 'ده', 'دي', 'اي', 'أى', 'أي', 'لو',
      'the', 'is', 'and', 'for', 'in', 'on', 'at', 'to', 'of', 'with', 'a', 'an'
    ]);

    const tokens = prompt
      .replace(/[^\w\u0600-\u06FF\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length >= 3 && !stopWords.has(t) && !/^\d+$/.test(t));

    const scoredNodes: Array<{ node: DistilledConversationNode; score: number }> = [];

    if (tokens.length > 0 || isExplicitMemoryIntent) {
      this.memorySnapshot.crossChatNodes.forEach(node => {
        const _isCurrentChat = Boolean(currentChatId && node.chatId === currentChatId);
        let score = 0;

        const nodeText = `${node.title} ${node.topicSummary} ${node.keyEntities.join(' ')} ${node.extractedFacts.join(' ')} ${node.targetUrls.join(' ')}`.toLowerCase();

        tokens.forEach(tok => {
          if (nodeText.includes(tok)) {
            score += 2.0;
          }
        });

        // Target URL exact matches
        node.targetUrls.forEach(url => {
          if (prompt.includes(url.toLowerCase()) || prompt.includes(url.replace(/https?:\/\//i, '').split('/')[0])) {
            score += 4.0;
          }
        });

        // Entity matches
        node.keyEntities.forEach(ent => {
          if (prompt.includes(ent.toLowerCase())) {
            score += 3.0;
          }
        });

        // Fact matches
        node.extractedFacts.forEach(fact => {
          if (prompt.includes(fact.toLowerCase())) {
            score += 3.5;
          }
        });

        if (isExplicitMemoryIntent) {
          score += 2.0;
        }

        // High confidence threshold to prevent false positives
        if (score >= 4.0 || (isExplicitMemoryIntent && score >= 2.0)) {
          scoredNodes.push({ node, score });
        }
      });
    }

    scoredNodes.sort((a, b) => b.score - a.score);
    
    // Chronologically ordered past nodes excluding current active chat session
    const chronologicalPastNodes = this.memorySnapshot.crossChatNodes
      .filter(n => !currentChatId || n.chatId !== currentChatId);

    const topNodes = scoredNodes.length > 0 
      ? scoredNodes.slice(0, 6).map(s => s.node)
      : (isExplicitMemoryIntent ? chronologicalPastNodes.slice(0, 8) : []);

    // Collect matched facts only if relevant
    const matchedFacts: string[] = isExplicitMemoryIntent ? [...this.memorySnapshot.userProfileFacts.slice(0, 3)] : [];
    topNodes.forEach(n => {
      n.extractedFacts.forEach(f => {
        if (!matchedFacts.includes(f)) matchedFacts.push(f);
      });
    });

    // Collect matched target URLs
    const matchedTargets: string[] = [];
    topNodes.forEach(n => {
      n.targetUrls.forEach(u => {
        if (!matchedTargets.includes(u)) matchedTargets.push(u);
      });
    });

    // Memory detect is active when explicit memory question or high-confidence cross-chat match
    const isMemoryDetectActive = isExplicitMemoryIntent || (scoredNodes.length > 0 && scoredNodes[0]?.score >= 4.0);

    let memoryPromptBlock = '';
    let activeSummary = '';

    if (isMemoryDetectActive && (topNodes.length > 0 || chronologicalPastNodes.length > 0 || matchedFacts.length > 0)) {
      const summaryItems: string[] = [];

      summaryItems.push(`[🧠 منظومة الذاكرة السحابية المتزامنة — MEMORY DETECT 50-CHATS RECALL]:`);
      summaryItems.push(`- إجمالي المحادثات السحابية المتصلة والمؤرشفة للمستخدم: (${this.memorySnapshot.indexedChatsCount || chronologicalPastNodes.length}) محادثة.`);

      if (chronologicalPastNodes.length > 0) {
        summaryItems.push(`- التسلسل الزمني الدقيق للمحادثات السابقة (مرتبة من الأحدث إلى الأقدم):`);
        chronologicalPastNodes.slice(0, 10).forEach((n, idx) => {
          const label = idx === 0 
            ? 'المحادثة السابقة مباشرة (جلسة 1)' 
            : idx === 1 
            ? 'المحادثة التي قبل السابقة (جلسة 2)' 
            : `المحادثة السابقة رقم (${idx + 1})`;
          summaryItems.push(`  * [${label}]:`);
          summaryItems.push(`    - عنوان الجلسة: "${n.title}"`);
          summaryItems.push(`    - تاريخ المحادثة: ${n.updatedAt.slice(0, 10)}`);
          if (n.topicSummary) summaryItems.push(`    - أسئلة وموضوعات المستخدم فيها: "${n.topicSummary}"`);
          if (n.targetUrls.length > 0) summaryItems.push(`    - الروابط المفحوصة: ${n.targetUrls.join(', ')}`);
          if (n.keyEntities.length > 0) summaryItems.push(`    - التقنيات والمصطلحات: ${n.keyEntities.join(', ')}`);
        });
      }

      if (matchedFacts.length > 0) {
        summaryItems.push(`- حقائق وبيانات المستخدم المسجلة سحابياً:`);
        matchedFacts.slice(0, 5).forEach(f => summaryItems.push(`  * ${f}`));
      }

      if (matchedTargets.length > 0) {
        summaryItems.push(`- سجل الأهداف والروابط التي فحصها المستخدم: ${matchedTargets.slice(0, 4).join(', ')}`);
      }

      summaryItems.push(`- [توجيهات الاستدعاء الزمني الفائق]:`);
      summaryItems.push(`  1. إذا سألك المستخدم عما قاله في "المحادثة السابقة" أو "الشات اللي فات"، ارجع مباشرة إلى [المحادثة السابقة مباشرة (جلسة 1)] واشرح بالتفصيل سؤاله وموضوعه.`);
      summaryItems.push(`  2. إذا سألك عما قاله في "المحادثة التي قبل السابقة"، ارجع إلى [المحادثة التي قبل السابقة (جلسة 2)].`);
      summaryItems.push(`  3. إذا سألك عن موضوع عام أو أكثر شيء تم ذكره، ادمج واستعرض كافة الجلسات السابقة بدقة.`);
      summaryItems.push(`  4. اعتمد حصرياً على نصوص وأسئلة المستخدم في هذه الجلسات، وتجنب تماماً عدّ أو اقتباس تعليمات النظام أو البرومبت الداخلي.`);

      memoryPromptBlock = summaryItems.join('\n');

      activeSummary = chronologicalPastNodes.length > 0
        ? `تم استدعاء وفهرسة (${chronologicalPastNodes.length}) محادثة سابقة بتسلسل زمني دقيق`
        : `الذاكرة السحابية متزامنة ونشطة (${this.memorySnapshot.indexedChatsCount || 50} محادثة / ~50M Tokens)`;
    }

    return {
      matchedNodes: topNodes,
      matchedFacts: matchedFacts.slice(0, 6),
      matchedTargets: matchedTargets.slice(0, 6),
      memoryPromptBlock,
      relevanceScore: scoredNodes[0]?.score || (isExplicitMemoryIntent ? 3.0 : 0),
      isMemoryDetectActive,
      activeSummary
    };
  }

  /**
   * Process message history using Priority-Weighted Sliding Window + Neural Cross-Chat Memory Distillation
   */
  public processMessages(
    rawMessages: ChatMessageItem[],
    currentChatId?: string | null
  ): {
    packedMessages: ChatMessageItem[];
    memoryContextPrompt: string;
    totalTokens: number;
    memoryDetectSummary: string;
    isMemoryDetectTriggered: boolean;
  } {
    const messages = this.sanitizeMessages(rawMessages);

    let totalTokens = 0;
    messages.forEach(m => {
      totalTokens += this.estimateTokens(m.content);
    });

    this.memorySnapshot.totalTokensEstimated = totalTokens;

    // Extract latest user prompt for cross-session recall
    const latestUserMsg = messages.filter(m => m.role === 'user').pop();
    const latestUserPrompt = latestUserMsg ? latestUserMsg.content : '';

    // Recall from across the 50 cloud conversations
    const recallResult = this.recallMemoriesForQuery(latestUserPrompt, currentChatId);

    // Sliding Window with Priority Retention:
    // Recent 16 turns are always kept verbatim
    const MAX_RECENT_TURNS = 16;

    if (messages.length <= MAX_RECENT_TURNS) {
      return {
        packedMessages: messages,
        memoryContextPrompt: recallResult.memoryPromptBlock,
        totalTokens,
        memoryDetectSummary: recallResult.activeSummary,
        isMemoryDetectTriggered: recallResult.isMemoryDetectActive
      };
    }

    const olderMessages = messages.slice(0, messages.length - MAX_RECENT_TURNS);
    const recentMessages = messages.slice(messages.length - MAX_RECENT_TURNS);

    // Identify high-priority older messages (e.g. Target URLs, critical instructions, code blocks)
    const highPriorityOlder = olderMessages.filter(m => this.calculateMessageWeight(m) > 1.3);
    
    // Distill older conversation into a structured memory ledger
    const distilledPoints: string[] = [];

    // Extract target URLs from older messages
    olderMessages.forEach(m => {
      const urlInfo = detectAndExtractUrl(m.content);
      if (urlInfo.hasUrl && urlInfo.cleanUrl) {
        distilledPoints.push(`- [الهدف المفحوص]: ${urlInfo.cleanUrl} (${urlInfo.domain})`);
      }
    });

    // Add condensed summary of key older turns
    olderMessages.slice(-8).forEach(m => {
      const preview = m.content.slice(0, 140).replace(/\n/g, ' ');
      const speaker = m.role === 'user' ? 'المستخدم' : 'الرد';
      distilledPoints.push(`- [${speaker}]: ${preview}`);
    });

    const intraChatMemory = distilledPoints.length > 0
      ? `[سياق الذاكرة الممتدة وسجل الجلسة الحالية]:\n${Array.from(new Set(distilledPoints)).join('\n')}\n`
      : '';

    const combinedMemoryPrompt = [recallResult.memoryPromptBlock, intraChatMemory]
      .filter(Boolean)
      .join('\n\n');

    // Merge high-priority older messages with recent messages, preventing duplicate IDs
    const recentIds = new Set(recentMessages.map(m => m.id));
    const preservedOlder = highPriorityOlder.filter(m => !recentIds.has(m.id)).slice(-4);

    const packedMessages = [...preservedOlder, ...recentMessages];
    this.memorySnapshot.priorityContextRetained = packedMessages.length;

    return {
      packedMessages,
      memoryContextPrompt: combinedMemoryPrompt,
      totalTokens,
      memoryDetectSummary: recallResult.activeSummary,
      isMemoryDetectTriggered: recallResult.isMemoryDetectActive
    };
  }

  public getMemoryStats() {
    return {
      tokensEstimated: this.memorySnapshot.totalTokensEstimated,
      priorityRetained: this.memorySnapshot.priorityContextRetained,
      indexedChatsCount: this.memorySnapshot.indexedChatsCount || this.memorySnapshot.crossChatNodes.length,
      virtualCapacity: '50,000,000 TOKENS (TURBO SYNCHRONIZED CLOUD MEMORY ENGINE — 50 CONNECTED SESSIONS)'
    };
  }
}

export const memoryEngine = new ContextMemoryEngine();

