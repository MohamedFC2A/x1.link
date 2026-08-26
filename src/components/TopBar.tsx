import React, { useState, useRef, useEffect } from 'react';
import { ModelType } from '../types';
import { User } from '@supabase/supabase-js';
import { 
  Menu, 
  MessageSquarePlus, 
  MessageSquare, 
  CreditCard, 
  Activity, 
  User as UserIcon, 
  Database, 
  Trash2, 
  Zap,
  ChevronDown
} from 'lucide-react';

interface TopBarProps {
  isX1Active?: boolean;
  isX1Unlocked?: boolean;
  activeModel?: ModelType;
  user?: User | null;
  currentView?: 'landing' | 'chat' | 'pricing' | 'limits' | 'profile';
  currentChatTokens?: number;
  totalTokens?: number;
  cloudChatsCount?: number;
  onToggleX1?: () => void;
  onSelectModel?: (model: ModelType) => void;
  onOpenSidebar: () => void;
  onNewChat?: () => void;
  onClearChat?: () => void;
  onGoHome?: () => void;
  onNavigateToPricing?: () => void;
  onNavigateToLimits?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToChat?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  currentView = 'chat',
  currentChatTokens = 0,
  totalTokens = 0,
  cloudChatsCount = 0,
  onOpenSidebar,
  onNewChat,
  onClearChat,
  onGoHome,
  onNavigateToPricing,
  onNavigateToLimits,
  onNavigateToProfile,
  onNavigateToChat,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full glass-header px-3 sm:px-8 py-2 sm:py-2.5 select-none transition-colors pt-safe shrink-0" dir="rtl">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Right (Start in RTL) - 3 Lines Menu Button & Dropdown */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 border ${
              isMenuOpen 
                ? 'bg-white text-zinc-950 border-white shadow-md' 
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border-white/[0.08]'
            }`}
            title="خيارات المحادثة والتوكنس"
          >
            {/* 3 Lines Hamburger Icon */}
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline font-sans text-xs">خيارات المحادثة</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* 3-Line Menu Popover Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-[#08080d]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-right font-sans">
              
              {/* Option 1: Start New Chat */}
              <button
                type="button"
                onClick={() => {
                  onNewChat?.();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.08] text-zinc-100 hover:text-white transition-colors cursor-pointer text-xs font-semibold text-right"
              >
                <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                  <MessageSquarePlus className="w-4 h-4" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-white font-bold">بدء محادثة جديدة</div>
                  <div className="text-[10px] text-zinc-400 font-mono">تفريغ الجلسة وبدء حوار نظيف</div>
                </div>
              </button>

              {/* Option 2: Cloud Conversations Drawer */}
              <button
                type="button"
                onClick={() => {
                  onOpenSidebar();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.08] text-zinc-100 hover:text-white transition-colors cursor-pointer text-xs font-semibold text-right mt-1"
              >
                <div className="size-8 rounded-lg bg-white/10 flex items-center justify-center text-zinc-300 shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-white font-bold flex items-center justify-between">
                    <span>سجل المحادثات السحابية</span>
                    {cloudChatsCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-300">
                        {cloudChatsCount} محادثة
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">استعراض وإدارة الحوارات السابقة</div>
                </div>
              </button>

              <div className="my-2 border-t border-white/[0.06]" />

              {/* Option 3: Real Chat Tokens Counter Card */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-right">
                <div className="flex items-center justify-between text-xs text-zinc-300 mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-zinc-400" />
                    <span>توكنس المحادثة الحالية:</span>
                  </span>
                  <span className="font-mono font-bold text-white">
                    {currentChatTokens.toLocaleString()} Token
                  </span>
                </div>

                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden my-2">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(Math.max((currentChatTokens / 100000) * 100, 2), 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mt-1">
                  <span>إجمالي الذاكرة الافتراضية:</span>
                  <span className="text-zinc-300">1,000,000 Token</span>
                </div>
              </div>

              {/* Option 4: Clear current chat */}
              <button
                type="button"
                onClick={() => {
                  onClearChat?.();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-rose-950/30 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer text-xs font-semibold text-right mt-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>مسح رسائل المحادثة الحالية</span>
              </button>

            </div>
          )}
        </div>

        {/* Center / Fast Navigation Pills (Fixed & Persistent) */}
        <nav className="flex items-center gap-1 sm:gap-1.5 bg-[#08080d] p-1 rounded-2xl border border-white/[0.08] shadow-inner">
          <button
            type="button"
            onClick={onNavigateToChat}
            className={`px-2.5 sm:px-3.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              currentView === 'chat'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>الشات</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToPricing}
            className={`px-2.5 sm:px-3.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              currentView === 'pricing'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">الاشتراكات</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToLimits}
            className={`px-2.5 sm:px-3.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              currentView === 'limits'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">الاستهلاك</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToProfile}
            className={`px-2.5 sm:px-3.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              currentView === 'profile'
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">الحساب</span>
          </button>
        </nav>

        {/* Left (End in RTL) / Pure Typographic Luxury Brand Wordmark */}
        <div
          onClick={onGoHome}
          className="flex items-center cursor-pointer group shrink-0 select-none py-1"
          title="matany.one"
          dir="ltr"
        >
          <div className="flex items-baseline gap-0.5 leading-none">
            <span className="font-['Space_Grotesk'] font-black text-lg sm:text-2xl tracking-tight brand-shimmer-text">
              matany
            </span>
            <span className="font-['Space_Grotesk'] font-bold text-[10px] sm:text-sm text-zinc-400 font-mono tracking-tight group-hover:text-zinc-200 transition-colors">
              .one
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
