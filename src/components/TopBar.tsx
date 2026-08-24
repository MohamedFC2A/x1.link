import React from 'react';
import { ModelType } from '../types';
import { User } from '@supabase/supabase-js';
import { MessageSquare, Plus, Home } from 'lucide-react';
import { NsfwNanoChip } from './NsfwNanoChip';

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
  user,
  onToggleX1,
  onOpenSidebar,
  onNewChat,
  onClearChat,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b]/95 backdrop-blur-md border-b border-zinc-800 px-3 sm:px-6 py-2.5 select-none transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        
        {/* Right / Brand with Home action */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="العودة إلى صفحة الاستقبال"
        >
          <img
            src="/x1-logo.svg"
            alt="X1 Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain"
          />
          <div className="flex flex-col text-right">
            <span className="font-bold text-sm tracking-tight text-white font-mono leading-none group-hover:text-rose-400 transition-colors">
              X1.link
            </span>
            <span className="text-[9px] text-zinc-500 font-mono">
              FATHOM AI
            </span>
          </div>
        </div>

        {/* Center / NSFW NANO Silicon Chip Trigger */}
        <div className="flex items-center">
          <NsfwNanoChip
            isActive={isX1Active}
            onClick={onToggleX1}
          />
        </div>

        {/* Left / History & New Chat */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              title="صفحة الاستقبال"
            >
              <Home className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">الاستقبال</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewChat || onClearChat}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="محادثة جديدة"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">جديدة</span>
          </button>

          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            title="سجل المحادثات والمزامنة السحابية"
          >
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">المحادثات</span>
            {user && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </button>
        </div>

      </div>
    </header>
  );
};
