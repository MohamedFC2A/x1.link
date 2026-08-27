import { MemoryDetectService, IterativeSearchOutput, SemanticMemoryScope, TimeFilterRange, ChatRelationshipType } from './memoryDetectService';
import { isPersonalMemoryRecallIntent } from '../src/lib/featuresRegistry';

/**
 * ============================================================================
 * MATANY.ONE / X1.LINK — AI STRUCTURED TOOL CALLING & CONTROLLER SPEC
 * Standardized OpenAI / DeepSeek / Gemini Function Tool Schemas
 * ============================================================================
 */

export const MEMORY_DETECT_TOOL_DEFINITION = {
  type: 'function',
  function: {
    name: 'memory_detect',
    description: 'Autonomously scan, retrieve, and search past user conversations and memory graph in Supabase with hybrid vector + full-text search and iterative refinement.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query or concept to recall from previous conversations (e.g. "نظام قواعد البيانات المستخدم", "نتائج فحص موقع target.com", "المحادثة السابقة").'
        },
        exact_keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional exact technical terms, domain names, CVEs, or code symbols to filter by (e.g. ["supabase", "CVE-2024-1234", "api.target.com"]).'
        },
        time_filter: {
          type: 'string',
          enum: ['last_day', 'last_week', 'last_month', 'all_time'],
          description: 'Temporal filter for past conversations. Defaults to all_time.'
        },
        target_scope: {
          type: 'string',
          enum: ['general_chat', 'code_snippets', 'decisions', 'cyber_findings', 'user_facts', 'target_recon', 'all'],
          description: 'The scope of memory to search. Use "user_facts" for user preferences/stack, "cyber_findings" for security scans, "code_snippets" for code, or "all".'
        },
        min_relevance: {
          type: 'number',
          description: 'Minimum confidence score threshold (0.0 to 1.0). Defaults to 0.25.'
        }
      },
      required: ['query']
    }
  }
};

export const UPDATE_MEMORY_NODE_TOOL_DEFINITION = {
  type: 'function',
  function: {
    name: 'update_memory_node',
    description: 'Update or mutate an outdated memory node when new facts, changes, or security fixes supersede previous assumptions.',
    parameters: {
      type: 'object',
      properties: {
        memory_id: {
          type: 'string',
          description: 'UUID of the memory node to update.'
        },
        revised_content: {
          type: 'string',
          description: 'The updated, accurate memory content or statement.'
        },
        reason: {
          type: 'string',
          description: 'The reason for this modification (e.g. "تم إصلاح الثغرة وترقيع السيرفر", "انتقل المستخدم من MySQL إلى Supabase").'
        },
        updated_entities: {
          type: 'array',
          items: { type: 'string' },
          description: 'Updated list of entity keywords.'
        }
      },
      required: ['memory_id', 'revised_content', 'reason']
    }
  }
};

export const LINK_CHAT_CONTEXTS_TOOL_DEFINITION = {
  type: 'function',
  function: {
    name: 'link_chat_contexts',
    description: 'Create a semantic relationship edge between two distinct chat sessions in the memory knowledge graph.',
    parameters: {
      type: 'object',
      properties: {
        source_chat_id: {
          type: 'string',
          description: 'UUID of the source chat session.'
        },
        target_chat_id: {
          type: 'string',
          description: 'UUID of the related chat session.'
        },
        relationship_type: {
          type: 'string',
          enum: ['SUPERSEDES', 'EXTENDS', 'DEPENDS_ON', 'SAME_PROJECT', 'RELATES_TO', 'CONTRADICTS'],
          description: 'Type of semantic link between the two chats.'
        },
        description: {
          type: 'string',
          description: 'Optional human-readable description of how these sessions are connected.'
        }
      },
      required: ['source_chat_id', 'target_chat_id', 'relationship_type']
    }
  }
};

export const GET_MEMORY_GRAPH_TOPOLOGY_TOOL_DEFINITION = {
  type: 'function',
  function: {
    name: 'get_memory_graph_topology',
    description: 'Inspect the relational graph connections, linked sessions, and dependencies surrounding a chat session.',
    parameters: {
      type: 'object',
      properties: {
        chat_id: {
          type: 'string',
          description: 'UUID of the chat session to inspect.'
        }
      },
      required: ['chat_id']
    }
  }
};

export const ALL_MEMORY_TOOLS = [
  MEMORY_DETECT_TOOL_DEFINITION,
  UPDATE_MEMORY_NODE_TOOL_DEFINITION,
  LINK_CHAT_CONTEXTS_TOOL_DEFINITION,
  GET_MEMORY_GRAPH_TOPOLOGY_TOOL_DEFINITION
];

/**
 * ============================================================================
 * MEMORY TOOL CONTROLLER
 * Dispatches and coordinates tool calls with resilient execution & validation
 * ============================================================================
 */
export class MemoryToolController {
  private service: MemoryDetectService;

  constructor(service?: MemoryDetectService) {
    this.service = service || new MemoryDetectService();
  }

  /**
   * Dispatches structured tool calls received from LLM
   */
  public async handleToolCall(
    toolName: string,
    args: any,
    context: { userId?: string | null; deviceId?: string | null; currentChatId?: string | null }
  ): Promise<{ success: boolean; result: any; error?: string }> {
    try {
      switch (toolName) {
        case 'memory_detect': {
          const query = String(args.query || '');
          const exactKeywords = Array.isArray(args.exact_keywords) ? args.exact_keywords : [];
          const scope = (args.target_scope || 'all') as SemanticMemoryScope;
          const timeFilter = (args.time_filter || 'all_time') as TimeFilterRange;
          const minConfidence = typeof args.min_relevance === 'number' ? args.min_relevance : 0.25;

          const searchOutput: IterativeSearchOutput = await this.service.iterativeAgenticSearch({
            query,
            exact_keywords: exactKeywords,
            scope,
            time_filter: timeFilter,
            min_confidence: minConfidence,
            userId: context.userId,
            deviceId: context.deviceId
          });

          return {
            success: true,
            result: {
              matched_count: searchOutput.results.length,
              is_confident: searchOutput.isConfident,
              iterations_run: searchOutput.iterationsRun,
              refinement_history: searchOutput.refinementHistory,
              memories: searchOutput.results.map(r => ({
                id: r.id,
                chat_id: r.chat_id,
                scope: r.scope,
                summary: r.summary,
                content: r.content,
                entities: r.entities,
                created_at: r.created_at,
                similarity: r.vector_similarity || r.text_similarity
              })),
              context_block: searchOutput.synthesizedContextBlock
            }
          };
        }

        case 'update_memory_node': {
          const memoryId = String(args.memory_id || '');
          const revisedContent = String(args.revised_content || '');
          const reason = String(args.reason || 'Manual AI update');
          const updatedEntities = Array.isArray(args.updated_entities) ? args.updated_entities : [];

          if (!memoryId || !revisedContent) {
            return { success: false, result: null, error: 'Missing memory_id or revised_content' };
          }

          const res = await this.service.updateMemoryNode({
            nodeId: memoryId,
            newContent: revisedContent,
            newEntities: updatedEntities,
            reason,
            userId: context.userId,
            deviceId: context.deviceId
          });

          return { success: res.success, result: res, error: res.error };
        }

        case 'link_chat_contexts': {
          const sourceChatId = String(args.source_chat_id || context.currentChatId || '');
          const targetChatId = String(args.target_chat_id || '');
          const relationshipType = (args.relationship_type || 'RELATES_TO') as ChatRelationshipType;
          const description = args.description ? String(args.description) : undefined;

          if (!sourceChatId || !targetChatId) {
            return { success: false, result: null, error: 'Missing source_chat_id or target_chat_id' };
          }

          const res = await this.service.linkChatContexts({
            sourceChatId,
            targetChatId,
            relationshipType,
            metadata: description ? { description } : {},
            userId: context.userId,
            deviceId: context.deviceId
          });

          return { success: res.success, result: res, error: res.error };
        }

        case 'get_memory_graph_topology': {
          const chatId = String(args.chat_id || context.currentChatId || '');
          if (!chatId) {
            return { success: false, result: null, error: 'Missing chat_id' };
          }

          const topology = await this.service.getChatGraphTopology(
            chatId,
            context.userId,
            context.deviceId
          );

          return {
            success: true,
            result: {
              chat_id: chatId,
              connected_edges_count: topology.length,
              edges: topology
            }
          };
        }

        default:
          return { success: false, result: null, error: `Unknown tool: ${toolName}` };
      }
    } catch (err: any) {
      return { success: false, result: null, error: err.message || 'Internal tool execution error' };
    }
  }

  /**
   * Pre-execution hook: Detects memory intent in user prompt and triggers autonomous background recall
   */
  public async preDetectAndSynthesize(
    userPrompt: string,
    context: { userId?: string | null; deviceId?: string | null; currentChatId?: string | null }
  ): Promise<{ memoryBlock: string; hasMemory: boolean; matchedCount: number }> {
    if (!userPrompt || typeof userPrompt !== 'string') {
      return { memoryBlock: '', hasMemory: false, matchedCount: 0 };
    }

    const isMemoryIntent = isPersonalMemoryRecallIntent(userPrompt);

    if (!isMemoryIntent) {
      return { memoryBlock: '', hasMemory: false, matchedCount: 0 };
    }

    const output = await this.service.iterativeAgenticSearch({
      query: userPrompt,
      scope: 'all',
      time_filter: 'all_time',
      limit: 6,
      min_confidence: 0.15,
      userId: context.userId,
      deviceId: context.deviceId
    });

    if (output.results.length > 0) {
      return {
        memoryBlock: output.synthesizedContextBlock,
        hasMemory: true,
        matchedCount: output.results.length
      };
    }

    return { memoryBlock: '', hasMemory: false, matchedCount: 0 };
  }
}
