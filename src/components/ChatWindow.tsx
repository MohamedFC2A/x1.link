import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessageItem } from '../types';
import { ChatMessage } from './ChatMessage';
import { getConversationGlobalUrls, getConversationGlobalImages } from '../lib/utils';
import { Sparkles, ShieldOff, Eye, Camera, ShieldCheck, ChevronDown, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  messages: ChatMessageItem[];
  isStreaming: boolean;
  isX1Active: boolean;
  onSendPreset: (presetText: string) => void;
  onOpenArchitecture?: () => void;
  onToggleX1?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isStreaming,
  isX1Active,
  onSendPreset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isPinnedToBottomRef = useRef(true);

  // Instant or smooth scroll to absolute bottom
  const scrollToBottom = useCallback((smooth = false) => {
    const container = containerRef.current;
    if (!container) return;

    isPinnedToBottomRef.current = true;
    setShowScrollBottom(false);

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Intelligent, accurate scroll detection based on actual distance
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    
    // Only show scroll-to-bottom button when genuinely scrolled up (> 220px)
    if (distFromBottom > 220) {
      isPinnedToBottomRef.current = false;
      setShowScrollBottom(true);
    } else if (distFromBottom <= 80) {
      isPinnedToBottomRef.current = true;
      setShowScrollBottom(false);
    }
  }, []);

  // Lock to bottom immediately on new user message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'user') {
        scrollToBottom(false);
      }
    }
  }, [messages.length, scrollToBottom]);

  // Keep pinned while streaming if user hasn't deliberately scrolled up
  useEffect(() => {
    if (isStreaming && isPinnedToBottomRef.current) {
      scrollToBottom(false);
    }
  }, [isStreaming, messages, scrollToBottom]);

  // ResizeObserver to handle content height expansions smoothly
  useEffect(() => {
    const container = containerRef.current;
    const list = messagesListRef.current;
    if (!container || !list) return;

    const ro = new ResizeObserver(() => {
      if (isPinnedToBottomRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });

    ro.observe(list);
    return () => ro.disconnect();
  }, []);

  const globalUrlIndexMap = React.useMemo(() => {
    const urls = getConversationGlobalUrls(messages);
    const map: Record<string, number> = {};
    urls.forEach((u, idx) => {
      map[u] = idx + 1;
    });
    return map;
  }, [messages]);

  const globalImageIndexMap = React.useMemo(() => {
    const imgs = getConversationGlobalImages(messages);
    const map: Record<string, number> = {};
    imgs.forEach((img, idx) => {
      map[img] = idx + 1;
    });
    return map;
  }, [messages]);

  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Scrollable Container with Hardware Accelerated Scrolling */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2.5 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 select-text smooth-scroll scroll-container-optimized no-scrollbar"
        style={{
          scrollBehavior: 'auto',
          overflowAnchor: 'none', // We manage exact anchoring via ResizeObserver
          overscrollBehaviorY: 'contain'
        }}
      >
        {messages.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center max-w-lg mx-auto py-12 text-center animate-in fade-in duration-300 px-4 relative select-none">
            {/* Master Brand M Emblem with Glassmorphic Squircle */}
            <div className="mb-4 relative group cursor-default">
              <div className="size-18 sm:size-20 rounded-3xl p-1 bg-gradient-to-b from-white/20 via-white/10 to-white/5 shadow-[0_12px_36px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.25)] border border-white/20 flex items-center justify-center backdrop-blur-2xl group-hover:scale-105 transition-transform duration-300">
                <img src="/matany-logo.svg" alt="matany.one" className="size-full rounded-[20px] object-contain drop-shadow" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              ابدأ محادثة مع {isX1Active ? 'matany.one' : 'Fathom'}
            </h2>
          </div>
        ) : (
          <div ref={messagesListRef} className="space-y-4 pb-24 sm:pb-32">
            {messages.map((message, index) => {
              const previousUserPrompt = message.role === 'assistant' 
                ? [...messages.slice(0, index)].reverse().find(m => m.role === 'user')?.content || ''
                : '';

              return (
                <ChatMessage
                  key={message.id || index}
                  message={message}
                  isStreaming={isStreaming && index === messages.length - 1}
                  globalUrlIndexMap={globalUrlIndexMap}
                  globalImageIndexMap={globalImageIndexMap}
                  previousUserPrompt={previousUserPrompt}
                />
              );
            })}
            <div ref={bottomAnchorRef} className="h-1" />
          </div>
        )}
      </div>

      {/* Floating Smart "Scroll to Bottom" Button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto shadow-2xl"
          >
            <button
              type="button"
              onClick={() => {
                setShowScrollBottom(false);
                scrollToBottom(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950/90 hover:bg-zinc-900 text-zinc-200 hover:text-white border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-2xl text-xs font-sans font-medium transition-all active:scale-95 cursor-pointer group select-none"
            >
              {isStreaming ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <div className="size-4 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <ArrowDown className="w-2.5 h-2.5 text-zinc-200 group-hover:translate-y-0.5 transition-transform shrink-0" />
                </div>
              )}
              <span className="leading-none">{isStreaming ? 'جاري الكتابة • انزل للأسفل' : 'الانتقال لأحدث رسالة'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
