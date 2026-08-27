import { createClient, User } from '@supabase/supabase-js';
import { ChatMessageItem, ModelType } from '../types';
import { formatEnglishTimestamp } from '../lib/utils';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined) || 'https://gyxlvreqwikpujzpyegm.supabase.co';
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export interface SupabaseChat {
  id: string;
  user_id: string | null;
  device_id?: string;
  title: string;
  mode: string;
  model: string;
  created_at: string;
  updated_at: string;
}

// Pure 100% Cloud-First Architecture: Purge and wipe all local storage chat remnants
export function purgeAllLocalChatArtifacts(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith('x1_chat') ||
        key.startsWith('x1_msg') ||
        key.startsWith('x1_memory') ||
        key.startsWith('x1_cloud_memory') ||
        key.startsWith('x1_local') ||
        key.startsWith('x1_guest') ||
        key.startsWith('chat_') ||
        key.startsWith('messages_') ||
        key.includes('chat_history') ||
        key.includes('conversation')
      ) {
        if (!key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    if (keysToRemove.length > 0) {
      console.log(`[Zero Local Storage] Purged (${keysToRemove.length}) obsolete local chat keys.`);
    }
  } catch (err) {
    console.warn('[Zero Local Storage Purge Catch]:', err);
  }
}

// Generate or retrieve unique device fingerprint ID for cloud device identification
export function getOrCreateDeviceId(): string {
  purgeAllLocalChatArtifacts();
  let deviceId = sessionStorage.getItem('x1_session_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    sessionStorage.setItem('x1_session_device_id', deviceId);
  }
  return deviceId;
}

const GOOGLE_CLIENT_ID = '953416509444-1e8gq6n84hbsrkncn8lkk8mio75pge87.apps.googleusercontent.com';

// Google Auth Sign In (Direct High-Reliability Supabase OAuth)
export async function signInWithGoogle(): Promise<{ user: User | null; error?: string }> {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://matany.one';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        }
      }
    });

    if (error) {
      console.error('[Supabase signInWithOAuth Error]:', error);
      return { user: null, error: error.message };
    }
    return { user: null };
  } catch (err: any) {
    console.error('[signInWithGoogle Exception]:', err);
    return { user: null, error: err.message || 'فشل الاتصال بخدمة Google' };
  }
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('[Supabase SignOut Error]:', error.message);
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user ?? null;
  } catch {
    return null;
  }
}

// Save or Create a Chat Session in Supabase (Supports Both Logged-in & Guest Users)
export async function createCloudChat(userId: string | null, title: string, model: ModelType, isX1: boolean): Promise<string | null> {
  const deviceId = getOrCreateDeviceId();
  try {
    const payload: any = {
      title: title.slice(0, 60),
      mode: isX1 ? 'x1' : 'base',
      model: (model === 'deepseek-v4-pro-cyber-2.1' || model === 'deepseek-v4-flash-cyber-2.1') ? 'Fathom Cyber 2.1' : model === 'deepseek-v4-flash-cyber' ? 'Fathom Cyber 2.0' : model === 'deepseek-v4-flash-vision-exp' ? 'Fathom Cam' : 'Fathom 1.1',
      device_id: deviceId,
    };

    if (userId) {
      payload.user_id = userId;
    }

    const { data, error } = await supabase
      .from('x1_chats')
      .insert(payload)
      .select('id')
      .single();

    if (error) {
      console.warn('[Supabase createChat Error]:', error.message);
      return null;
    }
    return data?.id || null;
  } catch (err) {
    console.warn('[Supabase createChat Exception]:', err);
    return null;
  }
}

// Save Message to Supabase (Supports Both Logged-in & Guest Users)
export async function saveCloudMessage(chatId: string, userId: string | null, msg: ChatMessageItem): Promise<void> {
  const deviceId = getOrCreateDeviceId();
  try {
    // Encode reasoning into content if assistant message to guarantee persistence
    let finalContent = msg.content || '';
    if (msg.role === 'assistant' && msg.reasoning && !finalContent.includes('<think>')) {
      finalContent = `<think>\n${msg.reasoning}\n</think>\n\n${finalContent}`;
    }

    // Deduplication safeguard: if assistant message was already auto-persisted by server, skip duplicate insert
    if (msg.role === 'assistant') {
      const { data: existing } = await supabase
        .from('x1_messages')
        .select('id, content')
        .eq('chat_id', chatId)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        const existingText = (existing[0].content || '').trim();
        const newText = finalContent.trim();
        if (
          existingText === newText ||
          (existingText.length > 20 && newText.includes(existingText.slice(0, 50))) ||
          (newText.length > 20 && existingText.includes(newText.slice(0, 50)))
        ) {
          return;
        }
      }
    }

    // Preserve full image array in media_attachments if multiple images exist
    const mediaAttachments: any[] = [...(msg.mediaAttachments || [])];
    if (msg.images && msg.images.length > 0) {
      msg.images.forEach((img, idx) => {
        if (!mediaAttachments.some((m: any) => m.url === img || m.dataUrl === img)) {
          mediaAttachments.push({
            id: `img-${idx}-${Date.now()}`,
            name: `صورة ${idx + 1}`,
            type: 'image',
            mimeType: 'image/jpeg',
            size: 0,
            url: img,
            dataUrl: img,
          });
        }
      });
    }

    const payload: any = {
      chat_id: chatId,
      role: msg.role,
      content: finalContent,
      image_url: msg.image || (msg.images && msg.images[0]) || null,
      media_attachments: mediaAttachments,
      is_x1: !!msg.isX1,
      tokens_count: msg.tokensCount || 0,
      device_id: deviceId,
    };

    if (userId) {
      payload.user_id = userId;
    }

    const { error } = await supabase
      .from('x1_messages')
      .insert(payload);

    if (error) {
      console.warn('[Supabase saveMessage Error]:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase saveMessage Exception]:', err);
  }
}

// Fetch all chats for user or guest device
export async function fetchUserChats(userId: string | null): Promise<SupabaseChat[]> {
  const deviceId = getOrCreateDeviceId();
  try {
    let query = supabase.from('x1_chats').select('*');

    if (userId) {
      query = query.or(`user_id.eq.${userId},device_id.eq.${deviceId}`);
    } else {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      console.warn('[Supabase fetchChats Error]:', error.message);
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

// Fetch messages for a specific chat
export async function fetchChatMessages(chatId: string): Promise<ChatMessageItem[]> {
  try {
    const { data, error } = await supabase
      .from('x1_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Supabase fetchMessages Error]:', error.message);
      return [];
    }

    return (data || []).map(row => {
      let content = row.content || '';
      let reasoning: string | undefined = row.reasoning || undefined;

      // Extract reasoning embedded in <think>...</think>
      if (!reasoning && content.includes('<think>') && content.includes('</think>')) {
        const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/i);
        if (thinkMatch) {
          reasoning = thinkMatch[1].trim();
          content = content.replace(/<think>[\s\S]*?<\/think>/i, '').trim();
        }
      }

      // Restore images array from media_attachments or image_url
      const imageAttachments = Array.isArray(row.media_attachments)
        ? row.media_attachments.filter((m: any) => m.type === 'image').map((m: any) => m.url || m.dataUrl).filter(Boolean)
        : [];
      
      const images = imageAttachments.length > 0
        ? imageAttachments
        : (row.image_url ? [row.image_url] : undefined);

      const nonImageAttachments = Array.isArray(row.media_attachments)
        ? row.media_attachments.filter((m: any) => m.type !== 'image')
        : undefined;

      return {
        id: row.id,
        role: row.role as 'user' | 'assistant' | 'system',
        content,
        reasoning,
        image: images?.[0] || row.image_url || undefined,
        images: images && images.length > 0 ? images : undefined,
        mediaAttachments: nonImageAttachments && nonImageAttachments.length > 0 ? nonImageAttachments : undefined,
        isX1: row.is_x1,
        tokensCount: row.tokens_count,
        timestamp: formatEnglishTimestamp(new Date(row.created_at)),
      };
    });
  } catch {
    return [];
  }
}

// Delete Chat Session from Supabase
export async function deleteCloudChat(chatId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('x1_chats')
      .delete()
      .eq('id', chatId);

    return !error;
  } catch {
    return false;
  }
}

// Fetch cross-chat summary for up to 50 cloud conversations for the memory engine
export async function fetchCrossChatHistoryForMemory(
  userId: string | null,
  limitCount: number = 50
): Promise<Array<{ chat: SupabaseChat; messages: ChatMessageItem[] }>> {
  try {
    const chats = await fetchUserChats(userId);
    const targetChats = chats.slice(0, limitCount);
    
    // Batch fetch top recent messages for the top chats in parallel
    const results = await Promise.all(
      targetChats.slice(0, 30).map(async (chat) => {
        try {
          const msgs = await fetchChatMessages(chat.id);
          return { chat, messages: msgs };
        } catch {
          return { chat, messages: [] };
        }
      })
    );

    return results;
  } catch (err) {
    console.warn('[Supabase fetchCrossChatHistory Error]:', err);
    return [];
  }
}

// 100% Cloud-First User Memory Graph Sync on Supabase
export async function fetchCloudUserMemories(userId: string | null): Promise<any | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('x1_user_memories')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase fetchUserMemories Error]:', error.message);
      return null;
    }
    return data || null;
  } catch (err) {
    console.warn('[Supabase fetchUserMemories Exception]:', err);
    return null;
  }
}

export async function saveCloudUserMemories(
  userId: string | null,
  snapshot: {
    workingMemory?: any;
    episodicEpisodes?: any[];
    semanticConcepts?: Record<string, any>;
    semanticTriples?: any[];
    resolvedConflicts?: any[];
    crossChatNodes?: any[];
    keyInsights?: string[];
    userProfileFacts?: string[];
    targetReconRegistry?: string[];
    indexedChatsCount?: number;
  }
): Promise<void> {
  if (!userId) return;
  try {
    const payload: any = {
      user_id: userId,
      cross_chat_nodes: snapshot.crossChatNodes || [],
      key_insights: snapshot.keyInsights || [],
      user_profile_facts: snapshot.userProfileFacts || [],
      target_recon_registry: snapshot.targetReconRegistry || [],
      indexed_chats_count: snapshot.indexedChatsCount || 0,
      updated_at: new Date().toISOString()
    };

    if (snapshot.workingMemory) payload.working_memory = snapshot.workingMemory;
    if (snapshot.episodicEpisodes) payload.episodic_episodes = snapshot.episodicEpisodes;
    if (snapshot.semanticConcepts) payload.semantic_concepts = snapshot.semanticConcepts;
    if (snapshot.semanticTriples) payload.semantic_triples = snapshot.semanticTriples;
    if (snapshot.resolvedConflicts) payload.resolved_conflicts = snapshot.resolvedConflicts;
    if ((snapshot as any).axioms) payload.axioms = (snapshot as any).axioms;

    const { error } = await supabase
      .from('x1_user_memories')
      .upsert(payload, { onConflict: 'user_id' });

    if (error) {
      console.warn('[Supabase saveUserMemories Error]:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase saveUserMemories Exception]:', err);
  }
}

// ============================================================================
// MEMORY DETECT 2.0: HYBRID VECTOR SEARCH & KNOWLEDGE GRAPH SUPABASE CLIENT
// ============================================================================

export interface HybridMemorySearchOptions {
  query: string;
  scope?: string;
  timeFilter?: string;
  matchThreshold?: number;
  matchCount?: number;
  userId?: string | null;
}

export async function searchCloudMemoriesHybrid(
  options: HybridMemorySearchOptions
): Promise<any[]> {
  const deviceId = getOrCreateDeviceId();
  try {
    const { data, error } = await supabase.rpc('match_chat_history', {
      query_text: options.query,
      query_embedding: null,
      match_threshold: options.matchThreshold || 0.15,
      match_count: options.matchCount || 8,
      p_user_id: options.userId || null,
      p_device_id: deviceId,
      p_scope: options.scope || 'all',
      p_time_filter: options.timeFilter || 'all_time',
      rrf_k: 60
    });

    if (error) {
      console.warn('[Supabase searchCloudMemoriesHybrid RPC Error]:', error.message);
      // Direct text fallback
      let query = supabase
        .from('x1_semantic_memories')
        .select('*')
        .eq('is_latest', true)
        .order('created_at', { ascending: false })
        .limit(options.matchCount || 8);

      if (options.userId) {
        query = query.eq('user_id', options.userId);
      } else {
        query = query.eq('device_id', deviceId);
      }

      if (options.query) {
        query = query.ilike('content', `%${options.query}%`);
      }

      const { data: fallbackData } = await query;
      return fallbackData || [];
    }

    return data || [];
  } catch (err) {
    console.warn('[Supabase searchCloudMemoriesHybrid Exception]:', err);
    return [];
  }
}

export async function updateCloudMemoryNode(
  nodeId: string,
  newContent: string,
  reason: string,
  userId?: string | null
): Promise<{ success: boolean; updatedId?: string; error?: string }> {
  const deviceId = getOrCreateDeviceId();
  try {
    const { data, error } = await supabase.rpc('update_memory_node_content', {
      p_node_id: nodeId,
      p_new_content: newContent,
      p_reason: reason,
      p_user_id: userId || null,
      p_device_id: deviceId
    });

    if (error) {
      console.warn('[Supabase updateCloudMemoryNode Error]:', error.message);
      return { success: false, error: error.message };
    }
    return data || { success: true, updatedId: nodeId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function linkCloudChatSessions(
  sourceChatId: string,
  targetChatId: string,
  relationshipType: string,
  userId?: string | null,
  metadata?: Record<string, any>
): Promise<{ success: boolean; linkId?: string; error?: string }> {
  const deviceId = getOrCreateDeviceId();
  try {
    const { data, error } = await supabase.rpc('link_chat_sessions', {
      p_source_chat_id: sourceChatId,
      p_target_chat_id: targetChatId,
      p_relationship_type: relationshipType,
      p_confidence: 1.0,
      p_metadata: metadata || {},
      p_user_id: userId || null,
      p_device_id: deviceId
    });

    if (error) {
      console.warn('[Supabase linkCloudChatSessions Error]:', error.message);
      return { success: false, error: error.message };
    }
    return data || { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function fetchChatGraphTopology(
  chatId: string,
  userId?: string | null
): Promise<any[]> {
  const deviceId = getOrCreateDeviceId();
  try {
    const { data, error } = await supabase.rpc('get_chat_graph_topology', {
      p_chat_id: chatId,
      p_user_id: userId || null,
      p_device_id: deviceId,
      p_max_depth: 2
    });

    if (error) {
      console.warn('[Supabase fetchChatGraphTopology Error]:', error.message);
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}

