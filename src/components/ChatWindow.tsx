import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessageItem, ModelType } from '../types';
import { ChatMessage } from './ChatMessage';
import { getConversationGlobalUrls, getConversationGlobalImages } from '../lib/utils';
import { Sparkles, ShieldOff, Eye, Camera, ShieldCheck, ChevronDown, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWindowProps {
  messages: ChatMessageItem[];
  isStreaming: boolean;
  isX1Active: boolean;
  activeModel?: ModelType;
  onSendPreset: (presetText: string) => void;
  onOpenArchitecture?: () => void;
  onToggleX1?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isStreaming,
  isX1Active,
  activeModel = 'deepseek-v4-flash',
  onSendPreset,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  const modelDisplayName = isX1Active
    ? 'matany.one'
    : activeModel === 'deepseek-v4-pro-cyber-2.1' || activeModel === 'deepseek-v4-flash-cyber-2.1'
    ? 'Fathom Cyber 2.1'
    : activeModel === 'deepseek-v4-flash-cyber'
    ? 'Fathom Cyber 2.0'
    : activeModel === 'deepseek-v4-flash-vision-exp'
    ? 'Fathom Cam'
    : activeModel === 'meta/muse-spark-1.2-contributor'
    ? 'Fathom Spark'
    : 'Fathom 1.1';

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isAutoScrollLockedRef = useRef(true);
  const isUserInteractingRef = useRef(false);
  const lastScrollHeightRef = useRef(0);
  const prevMessagesLength = useRef(messages.length);

  // Synchronize locking state
  const setAutoScrollLocked = useCallback((locked: boolean) => {
    isAutoScrollLockedRef.current = locked;
    setShowScrollBottom(!locked);
  }, []);

  // Instant or smooth scroll to absolute bottom
  const scrollToBottom = useCallback((smooth = false) => {
    const container = containerRef.current;
    if (!container) return;

    setAutoScrollLocked(true);

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [setAutoScrollLocked]);

  // Intelligent scroll threshold tracking
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    
    // If user scrolled up by more than 50px, release lock so user can read smoothly without interruptions!
    if (distFromBottom > 60) {
      if (isAutoScrollLockedRef.current) {
        setAutoScrollLocked(false);
      }
    } else if (distFromBottom <= 20) {
      // User naturally scrolled back down to bottom
      if (!isAutoScrollLockedRef.current) {
        setAutoScrollLocked(true);
      }
    }
  }, [setAutoScrollLocked]);

  // Decouple user touch / wheel gestures to prevent violent jitter during streaming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      // If user is scrolling UP with wheel
      if (e.deltaY < -2) {
        setAutoScrollLocked(false);
      }
    };

    const onTouchStart = () => {
      isUserInteractingRef.current = true;
    };

    const onTouchEnd = () => {
      isUserInteractingRef.current = false;
      setTimeout(handleScroll, 60);
    };

    container.addEventListener('wheel', onWheel, { passive: true });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleScroll, setAutoScrollLocked]);

  // Lock to bottom immediately on new user message submission
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'user') {
        scrollToBottom(false);
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, scrollToBottom]);

  // High-performance intelligent stream follower using RequestAnimationFrame
  // Eliminates layout thrashing and jitter during thinking or token streaming
  useEffect(() => {
    if (!isStreaming) return;

    const container = containerRef.current;
    if (!container) return;

    let rafId: number;

    const streamFollower = () => {
      if (isStreaming && isAutoScrollLockedRef.current && !isUserInteractingRef.current) {
        const currentHeight = container.scrollHeight;
        if (currentHeight !== lastScrollHeightRef.current) {
          lastScrollHeightRef.current = currentHeight;
          container.scrollTop = currentHeight - container.clientHeight;
        }
      }
      if (isStreaming) {
        rafId = requestAnimationFrame(streamFollower);
      }
    };

    rafId = requestAnimationFrame(streamFollower);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isStreaming]);

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
          overflowAnchor: 'auto', // Native smooth scroll anchoring
          overscrollBehaviorY: 'contain'
        }}
      >
        {messages.length === 0 ? (
          <div className="min-h-[45vh] flex flex-col items-center justify-center max-w-md mx-auto py-8 sm:py-12 text-center animate-in fade-in duration-300 px-4 relative select-none">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2.5 font-sans">
              ابدأ محادثة مع {modelDisplayName}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-zinc-400 font-sans leading-relaxed">
              اكتب سؤالك، أرفق صورة، أو الصق أي رابط للتحليل الفوري
            </p>
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
