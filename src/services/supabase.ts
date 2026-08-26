import { createClient, User } from '@supabase/supabase-js';
import { ChatMessageItem, ModelType } from '../types';

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

// Generate or retrieve unique device fingerprint ID for non-logged in guest users
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('x1_guest_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('x1_guest_device_id', deviceId);
  }
  return deviceId;
}

// Google / Google Play Auth Sign In (Completely Optional)
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });

  if (error) {
    console.error('[Supabase Auth Error]:', error.message);
    throw error;
  }
  return data;
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
      timestamp: new Date(row.created_at).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
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
