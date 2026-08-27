import { createClient, User } from '@supabase/supabase-js';
import { ChatMessageItem, ModelType } from '../types';
import { formatEnglishTimestamp } from '../lib/utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://gyxlvreqwikpujzpyegm.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGx2cmVxd2lrcHVqenB5ZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NDkwNzMsImV4cCI6MjEwMzEyNTA3M30.vMnY9PcDrB627Tv8Aumy6BKlMfbzg4LX1B_EUigNL2s';

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

// Google Auth Sign In (Prioritizes Google Identity Services Native Popup for matany.one Attribution)
export async function signInWithGoogle(): Promise<{ user: User | null; error?: string }> {
  // Check if Google Identity Services SDK is loaded in window
  if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
    return new Promise((resolve) => {
      try {
        const google = (window as any).google;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          context: 'signin',
          ux_mode: 'popup',
          cancel_on_tap_outside: true,
          callback: async (response: any) => {
            if (response?.credential) {
              const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
              });
              if (error) {
                console.error('[Supabase signInWithIdToken Error]:', error);
                resolve({ user: null, error: error.message });
              } else {
                resolve({ user: data.user, error: undefined });
              }
            } else {
              resolve({ user: null, error: 'لم يتم استلام تصريح الدخول من Google.' });
            }
          },
        });

        // Trigger Google Native Sign-In UI with matany.one branding
        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to direct OAuth redirect if One-Tap is suppressed
            supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: window.location.origin,
                queryParams: { prompt: 'select_account' }
              }
            }).catch(console.error);
          }
        });
      } catch (err: any) {
        console.warn('[GIS Init Catch]:', err);
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
            queryParams: { prompt: 'select_account' }
          }
        }).catch(console.error);
        resolve({ user: null });
      }
    });
  }

  // Standard OAuth Fallback
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      }
    }
  });

  if (error) {
    console.error('[Supabase Auth Error]:', error.message);
    throw error;
  }
  return { user: null };
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
      model: model === 'deepseek-v4-flash-cyber' ? 'Fathom Cyber' : model === 'deepseek-v4-flash-vision-exp' ? 'Fathom Cam' : 'Fathom 1',
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
    const payload: any = {
      chat_id: chatId,
      role: msg.role,
      content: msg.content,
      image_url: msg.image || null,
      media_attachments: msg.mediaAttachments || [],
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

    return (data || []).map(row => ({
      id: row.id,
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content,
      image: row.image_url || undefined,
      mediaAttachments: row.media_attachments && row.media_attachments.length > 0 ? row.media_attachments : undefined,
      isX1: row.is_x1,
      tokensCount: row.tokens_count,
      timestamp: formatEnglishTimestamp(new Date(row.created_at)),
    }));
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
    crossChatNodes: any[];
    keyInsights: string[];
    userProfileFacts: string[];
    targetReconRegistry: string[];
    indexedChatsCount: number;
  }
): Promise<void> {
  if (!userId) return;
  try {
    const { error } = await supabase
      .from('x1_user_memories')
      .upsert({
        user_id: userId,
        cross_chat_nodes: snapshot.crossChatNodes || [],
        key_insights: snapshot.keyInsights || [],
        user_profile_facts: snapshot.userProfileFacts || [],
        target_recon_registry: snapshot.targetReconRegistry || [],
        indexed_chats_count: snapshot.indexedChatsCount || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('[Supabase saveUserMemories Error]:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase saveUserMemories Exception]:', err);
  }
}
