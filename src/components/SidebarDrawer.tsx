import React from 'react';
import { User } from '@supabase/supabase-js';
import { SupabaseChat } from '../services/supabase';
import { X, Plus, Trash2, LogOut, Sparkles, MessageSquare, Database, Shield } from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  chats: SupabaseChat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string, e: React.MouseEvent) => void;
  totalTokens: number;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onGoogleSignIn,
  onSignOut,
  chats,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  totalTokens,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="relative w-full max-w-xs sm:max-w-sm bg-zinc-950 border-l border-zinc-800 text-zinc-100 flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/x1-logo.svg"
              alt="X1 Logo"
              className="w-7 h-7 rounded-lg object-contain drop-shadow-[0_0_6px_rgba(225,29,72,0.4)]"
            />
            <div>
              <h2 className="font-semibold text-sm text-white">
                المحادثات السحابية
              </h2>
              <p className="text-[11px] text-zinc-400">
                {user ? 'متصل بـ Supabase' : 'تخزين محلي'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action: New Chat */}
        <div className="p-3 border-b border-zinc-800/50">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-medium text-xs transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            بدء محادثة جديدة
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="text-[11px] font-medium text-zinc-400 px-2 py-1">
            سجل المحادثات
          </div>

          {chats.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400 bg-zinc-900/40 rounded-xl border border-zinc-850 my-2">
              <MessageSquare className="w-5 h-5 mx-auto mb-2 opacity-50" />
              لا توجد محادثات سابقة حتى الآن.
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  onClose();
                }}
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer border transition-all ${
                  currentChatId === chat.id
                    ? 'bg-zinc-800 text-white border-zinc-700'
                    : 'bg-zinc-900/50 text-zinc-300 border-zinc-850 hover:bg-zinc-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <MessageSquare className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{chat.title || 'محادثة جديدة'}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => onDeleteChat(chat.id, e)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-opacity"
                  title="حذف المحادثة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Memory Ledger Metrics */}
        <div className="p-3 bg-zinc-900/60 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-rose-500" />
              الذاكرة الافتراضية
            </span>
            <span className="font-mono text-zinc-200">1M Token</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Math.max((totalTokens / 1000000) * 100, 1), 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-zinc-400 mt-1 font-mono text-left">
            المستخدم: {totalTokens.toLocaleString()} توكن
          </div>
        </div>

        {/* User Account / Google Sign In Footer */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-rose-600/20 text-rose-400 flex items-center justify-center font-bold text-xs border border-rose-500/30">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
                <div className="truncate text-xs">
                  <div className="font-medium text-white truncate">{user.email}</div>
                  <div className="text-[10px] text-emerald-400">حساب متصل ومحمي</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              تسجيل الدخول بحساب Google
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
