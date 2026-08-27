import React from 'react';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { SupabaseChat } from '../services/supabase';
import { 
  X, 
  Plus, 
  Trash2, 
  LogOut, 
  MessageSquare, 
  Database, 
  CreditCard, 
  Activity, 
  User as UserIcon,
  Sparkles,
  ChevronRight
} from 'lucide-react';

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
  onClearChat?: () => void;
  currentChatTokens?: number;
  totalTokens: number;
  onNavigateToPricing?: () => void;
  onNavigateToLimits?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToChat?: () => void;
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
  onClearChat,
  currentChatTokens = 0,
  totalTokens,
  onNavigateToPricing,
  onNavigateToLimits,
  onNavigateToProfile,
  onNavigateToChat,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-start overflow-hidden" dir="rtl">
          {/* Dark Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            onClick={onClose}
          />

          {/* Drawer Panel with Swipe-to-Close Gestures */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="x"
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.6 }}
            onDragEnd={(_event: any, info: PanInfo) => {
              // In RTL, dragging right towards screen edge (info.offset.x > 60 or fast flick info.velocity.x > 250) closes the drawer
              if (info.offset.x > 60 || info.velocity.x > 250) {
                onClose();
              }
            }}
            className="relative w-[85vw] max-w-xs sm:max-w-sm bg-[#080811] border-l border-white/15 text-zinc-100 flex flex-col h-full z-10 shadow-2xl pt-safe pb-safe select-none touch-pan-y"
          >
            {/* Visual Drag Handle on the inner edge */}
            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-14 rounded-full bg-white/20 pointer-events-none hidden sm:block" />
        
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex flex-col text-right">
            <div className="flex items-baseline gap-0.5" dir="ltr">
              <span className="font-['Space_Grotesk'] font-bold text-base tracking-tight brand-shimmer-text">
                matany
              </span>
              <span className="font-['Space_Grotesk'] text-xs text-zinc-400 font-mono">
                .one
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono mt-0.5">
              {user ? 'مزامنة سحابية (Supabase)' : 'سجل محادثات سحابي مشفر'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Grid (Quick Links) */}
        <div className="p-3 border-b border-white/[0.06] space-y-2">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white text-zinc-950 font-bold text-xs shadow-md active:scale-95 cursor-pointer hover:bg-zinc-200 transition-all font-sans"
          >
            <Plus className="w-4 h-4 text-zinc-950" />
            <span>بدء محادثة جديدة</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onNavigateToPricing?.();
                onClose();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/[0.08] hover:border-white/20 text-zinc-200 hover:text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-sm"
              title="خطط الاشتراك"
            >
              <CreditCard className="w-4 h-4 text-zinc-300" />
              <span>الاشتراكات</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigateToProfile?.();
                onClose();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-white/[0.08] hover:border-white/20 text-zinc-200 hover:text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-sm"
              title="الملف الشخصي"
            >
              <UserIcon className="w-4 h-4 text-zinc-300" />
              <span>الحساب</span>
            </button>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 smooth-scroll">
          <div className="text-[11px] font-bold text-zinc-400 px-2 py-1 font-sans flex items-center justify-between">
            <span>سجل المحادثات السحابية</span>
            {chats.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300">
                {chats.length} محادثة
              </span>
            )}
          </div>

          {chats.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-400 bg-white/[0.02] border border-white/[0.06] rounded-2xl my-2 font-sans">
              <MessageSquare className="w-5 h-5 mx-auto mb-2 opacity-40 text-zinc-400" />
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
                className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer border transition-all active:scale-[0.98] ${
                  currentChatId === chat.id
                    ? 'bg-white text-zinc-950 border-white shadow-md'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] text-zinc-200 border-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${currentChatId === chat.id ? 'text-zinc-950' : 'text-zinc-400'}`} />
                  <span className="truncate font-sans">{chat.title || 'محادثة جديدة'}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => onDeleteChat(chat.id, e)}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    currentChatId === chat.id ? 'text-zinc-700 hover:text-red-600' : 'text-zinc-500 hover:text-red-400 hover:bg-white/[0.08]'
                  }`}
                  title="حذف المحادثة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Memory Ledger Metrics & Clear Chat */}
        <div className="p-3 bg-black/50 border-t border-white/[0.08] space-y-2.5">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-sans">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-zinc-400" />
                الذاكرة السحابية
              </span>
              <span className="font-mono text-zinc-200 font-bold">1,000,000 Token</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-white/[0.06]">
              <div
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(Math.max((totalTokens / 1000000) * 100, 1), 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 font-mono text-left">
              المستهلك: {totalTokens.toLocaleString()} توكن
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-sans text-zinc-400">
            <span>تطوير: <strong className="text-zinc-200">محمد أحمد مطعني</strong></span>
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-300 border border-white/[0.08]">MatanyLabs</span>
          </div>
        </div>

        {/* User Account / Google Sign In Footer */}
        <div className="p-3 border-t border-white/[0.08] bg-[#000000]">
          {user ? (
            <div className="flex items-center justify-between">
              <div 
                onClick={() => {
                  onNavigateToProfile?.();
                  onClose();
                }}
                className="flex items-center gap-2 min-w-0 cursor-pointer group"
              >
                <div className="size-8 rounded-full bg-white/[0.08] text-white flex items-center justify-center font-bold text-xs border border-white/[0.15] shrink-0 group-hover:border-white/40 transition-colors">
                  {user.email?.[0].toUpperCase() || 'U'}
                </div>
                <div className="truncate text-xs">
                  <div className="font-medium text-white truncate font-sans group-hover:text-zinc-200 transition-colors">{user.email}</div>
                  <div className="text-[10px] text-emerald-400 font-mono">حساب متصل ومحمي</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGoogleSignIn}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer font-sans"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span className="font-sans">تسجيل الدخول بحساب Google</span>
            </button>
          )}
        </div>

      </motion.div>
    </div>
  )}
</AnimatePresence>
  );
};
