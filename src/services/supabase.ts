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
  user_id: string;
  title: string;
  mode: string;
  model: string;
  created_at: string;
  updated_at: string;
}

// Google / Google Play Auth Sign In
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
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

// Save or Create a Chat Session in Supabase
export async function createCloudChat(userId: string, title: string, model: ModelType, isX1: boolean): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('x1_chats')
      .insert({
        user_id: userId,
        title: title.slice(0, 60),
        mode: isX1 ? 'x1' : 'base',
        model: model
      })
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

// Save Message to Supabase
export async function saveCloudMessage(chatId: string, userId: string, msg: ChatMessageItem): Promise<void> {
  try {
    const { error } = await supabase
      .from('x1_messages')
      .insert({
        chat_id: chatId,
        user_id: userId,
        role: msg.role,
        content: msg.content,
        image_url: msg.image || null,
        is_x1: !!msg.isX1,
        tokens_count: msg.tokensCount || 0
      });

    if (error) {
      console.warn('[Supabase saveMessage Error]:', error.message);
    }
  } catch (err) {
    console.warn('[Supabase saveMessage Exception]:', err);
  }
}

// Fetch all user chats from Supabase
export async function fetchUserChats(userId: string): Promise<SupabaseChat[]> {
  try {
    const { data, error } = await supabase
      .from('x1_chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

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
      timestamp: new Date(row.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isX1: row.is_x1,
      tokensCount: row.tokens_count
    }));
  } catch {
    return [];
  }
}

// Delete a chat
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
