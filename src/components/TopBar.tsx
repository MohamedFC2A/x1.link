import React from 'react';
import { ModelType } from '../types';
import { User } from '@supabase/supabase-js';
import { MessageSquare, Plus } from 'lucide-react';
import { NsfwNanoChip } from './NsfwNanoChip';

interface TopBarProps {
  isX1Active: boolean;
  isX1Unlocked: boolean;
  activeModel: ModelType;
  user: User | null;
  onToggleX1: () => void;
  onSelectModel: (model: ModelType) => void;
  onOpenSidebar: () => void;
  onClearChat: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isX1Active,
  user,
  onToggleX1,
  onOpenSidebar,
  onClearChat,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-6 py-2.5 select-none transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        
        {/* Right / Brand */}
        <div className="flex items-center gap-2.5">
          <img
            src="/x1-logo.svg"
            alt="X1 Logo"
            className="w-8 h-8 rounded-xl object-contain drop-shadow-[0_0_8px_rgba(225,29,72,0.4)]"
          />
          <span className="font-bold text-sm tracking-tight text-white font-mono">
            X1.link
          </span>
        </div>

        {/* Center / NSFW NANO Silicon Chip Trigger */}
        <div className="flex items-center">
          <NsfwNanoChip
            isActive={isX1Active}
            onToggle={onToggleX1}
          />
        </div>

        {/* Left / History & New Chat */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all"
            title="محادثة جديدة"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">جديدة</span>
          </button>

          <button
            type="button"
            onClick={onOpenSidebar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all"
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
