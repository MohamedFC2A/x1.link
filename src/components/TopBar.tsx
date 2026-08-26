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
    <header className="sticky top-0 z-40 w-full glass-header px-3 sm:px-6 py-2 sm:py-2.5 select-none transition-colors pt-safe">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        
        {/* Right / Brand */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
          title="X1.link"
        >
          <img
            src="/x1-logo.svg"
            alt="X1 Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain"
          />
          <div className="flex flex-col text-right">
            <span className="font-bold text-sm sm:text-base tracking-tight text-white font-mono leading-none group-hover:text-zinc-300 transition-colors">
              X1.link
            </span>
            <span className="text-[9px] text-zinc-400 font-mono mt-0.5">
              {activeModel === 'deepseek-v4-flash-cyber'
                ? 'FATHOM CYBER'
                : activeModel === 'deepseek-v4-flash-vision-exp'
                ? 'FATHOM CAM'
                : 'FATHOM AI'}
            </span>
          </div>
        </div>

        {/* Left / History & New Chat Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onNewChat || onClearChat}
            className="glass-button flex items-center justify-center size-9 sm:size-auto sm:px-3 sm:py-1.5 rounded-xl text-zinc-300 hover:text-white text-xs font-medium cursor-pointer active:scale-95 shadow-sm"
            title="محادثة جديدة"
          >
            <Plus className="w-4 h-4 text-zinc-300" />
            <span className="hidden sm:inline mr-1.5 font-sans">محادثة جديدة</span>
          </button>

          <button
            type="button"
            onClick={onOpenSidebar}
            className="glass-button flex items-center justify-center size-9 sm:size-auto sm:px-3 sm:py-1.5 rounded-xl text-zinc-300 hover:text-white text-xs font-medium cursor-pointer active:scale-95 relative shadow-sm"
            title="سجل المحادثات"
          >
            <MessageSquare className="w-4 h-4 text-zinc-300" />
            <span className="hidden sm:inline mr-1.5 font-sans">المحادثات</span>
            {user && <span className="absolute top-1.5 right-1.5 sm:static sm:mr-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>
        </div>

      </div>
    </header>
  );
};
