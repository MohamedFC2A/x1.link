import React from 'react';
import { ModelType } from '../types';
import { User } from '@supabase/supabase-js';
import { MessageSquare, Plus } from 'lucide-react';

interface TopBarProps {
  isX1Active: boolean;
  isX1Unlocked?: boolean;
  activeModel?: ModelType;
  user?: User | null;
  onToggleX1: () => void;
  onSelectModel?: (model: ModelType) => void;
  onOpenSidebar: () => void;
  onNewChat?: () => void;
  onClearChat?: () => void;
  onGoHome?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isX1Active,
  activeModel = 'deepseek-v4-flash',
  onSelectModel,
  user,
  onToggleX1,
  onOpenSidebar,
  onNewChat,
  onClearChat,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-header px-4 sm:px-6 py-2.5 sm:py-3.5 select-none transition-colors pt-safe">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Right / Pure Typographic Luxury Brand Wordmark */}
        <div
          onClick={onGoHome}
          className="flex flex-col text-left justify-center cursor-pointer group shrink-0 select-none py-0.5"
          title="Matany.one"
          dir="ltr"
        >
          <div className="flex items-baseline gap-1 leading-none">
            <span className="font-['Space_Grotesk'] font-black text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent group-hover:from-white group-hover:to-white transition-all">
              Matany
            </span>
            <span className="font-['Space_Grotesk'] font-bold text-xs sm:text-sm text-zinc-400 font-mono tracking-tight">
              .one
            </span>
          </div>
          <span className="text-[8.5px] sm:text-[9.5px] text-zinc-400 font-mono mt-1 font-semibold tracking-[0.22em] uppercase">
            {activeModel === 'deepseek-v4-flash-cyber'
              ? 'CYBER INTELLIGENCE'
              : activeModel === 'deepseek-v4-flash-vision-exp'
              ? 'VISION PERCEPTION'
              : 'FATHOM AI CORE'}
          </span>
        </div>

        {/* Left / History & New Chat Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onNewChat || onClearChat}
            className="glass-button flex items-center justify-center size-10 sm:size-auto sm:px-3.5 sm:py-2 rounded-xl text-zinc-200 hover:text-white text-xs sm:text-sm font-medium cursor-pointer active:scale-95 shadow-sm"
            title="محادثة جديدة"
          >
            <Plus className="w-4 h-4 text-zinc-200" />
            <span className="hidden sm:inline mr-1.5 font-sans">محادثة جديدة</span>
          </button>

          <button
            type="button"
            onClick={onOpenSidebar}
            className="glass-button flex items-center justify-center size-10 sm:size-auto sm:px-3.5 sm:py-2 rounded-xl text-zinc-200 hover:text-white text-xs sm:text-sm font-medium cursor-pointer active:scale-95 relative shadow-sm"
            title="سجل المحادثات"
          >
            <MessageSquare className="w-4 h-4 text-zinc-200" />
            <span className="hidden sm:inline mr-1.5 font-sans">المحادثات</span>
            {user && <span className="absolute top-2 right-2 sm:static sm:mr-1.5 w-2 h-2 rounded-full bg-emerald-400" />}
          </button>
        </div>

      </div>
    </header>
  );
};
