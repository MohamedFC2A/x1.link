import React from 'react';
import { ModelType } from '../types';
import { User } from '@supabase/supabase-js';
import { 
  Menu, 
  MessageSquarePlus, 
  MessageSquare, 
  CreditCard, 
  Activity, 
  User as UserIcon, 
  ArrowRight,
  Award
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
  onOpenBenchmark?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView = 'chat',
  cloudChatsCount = 0,
  onOpenSidebar,
  onNewChat,
  onGoHome,
  onNavigateToPricing,
  onNavigateToLimits,
  onNavigateToProfile,
  onNavigateToChat,
  onOpenBenchmark,
}) => {
  const isSecondaryPage = currentView !== 'chat' && currentView !== 'landing';

  const getViewTitle = () => {
    switch (currentView) {
      case 'pricing': return 'الاشتراكات';
      case 'limits': return 'الاستهلاك';
      case 'profile': return 'الحساب';
      default: return '';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#060709]/80 backdrop-blur-xl border-b border-white/[0.05] px-3 sm:px-8 py-2 sm:py-2.5 select-none transition-colors pt-safe shrink-0 shadow-[0_4px_24px_rgba(0,0,0,0.5)]" dir="rtl">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 relative z-40">
        
        {/* Right (Start in RTL) - Menu Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 border bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border-white/[0.08]"
            title="سجل المحادثات والقائمة"
          >
            <Menu className="w-4 h-4 text-zinc-200" />
            <span className="hidden sm:inline font-sans text-xs">السجل والقائمة</span>
          </button>
        </div>

        {/* Center - Mobile View Title / Indicator */}
        <div className="flex md:hidden items-center justify-center flex-1 min-w-0">
          {isSecondaryPage && (
            <span className="text-xs font-bold text-zinc-200 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 truncate font-sans">
              {getViewTitle()}
            </span>
          )}
        </div>

        {/* Center / Fast Navigation Pills (Desktop & Tablet Only) */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-2xl border border-white/[0.06] backdrop-blur-md shadow-inner">
          <button
            type="button"
            onClick={onNavigateToChat}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentView === 'chat'
                ? 'bg-white/[0.12] border border-white/[0.15] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>الشات</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToPricing}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentView === 'pricing'
                ? 'bg-white/[0.12] border border-white/[0.15] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>الاشتراكات</span>
          </button>

          {onOpenBenchmark && (
            <button
              type="button"
              onClick={onOpenBenchmark}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/10 border border-cyan-500/20 bg-cyan-500/5 shadow-sm"
              title="مقارنة بينش مارك النماذج والذكاء الاصطناعي"
            >
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>المقارنة والمعايير 👑</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToProfile}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentView === 'profile'
                ? 'bg-white/[0.12] border border-white/[0.15] text-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>الحساب</span>
          </button>
        </nav>

        {/* Left (End in RTL) - Back to Chat / New Chat on Mobile OR Desktop Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          {/* On Mobile Secondary Pages: Prominent Back to Chat button */}
          {isSecondaryPage ? (
            <button
              type="button"
              onClick={onNavigateToChat}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-zinc-950 font-bold text-xs shadow-md active:scale-95 cursor-pointer hover:bg-zinc-200 transition-all font-sans"
              title="الرجوع إلى الشات"
            >
              <ArrowRight className="w-3.5 h-3.5 text-zinc-950" />
              <span>رجوع</span>
            </button>
          ) : (
            /* Quick New Chat Button on Mobile in Chat view */
            <button
              type="button"
              onClick={onNewChat}
              className="md:hidden size-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-zinc-200 hover:text-white active:scale-95 cursor-pointer shadow-sm"
              title="بدء محادثة جديدة"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </button>
          )}

          {/* Typographic Brand Wordmark (Desktop) */}
          <div
            onClick={onGoHome}
            className="hidden md:flex items-center cursor-pointer group shrink-0 select-none py-1"
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

      </div>
    </header>
  );
};
