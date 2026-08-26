import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessageItem } from '../types';
import { ChatMessage } from './ChatMessage';
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
  const touchStartYRef = useRef(0);

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

  // Handle scroll events cleanly (user scroll vs auto scroll)
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    
    // If within 70px from bottom, consider user pinned to the bottom
    if (distFromBottom <= 70) {
      isPinnedToBottomRef.current = true;
      setShowScrollBottom(false);
    } else {
      // User scrolled up! Immediately detach pinning so user can read earlier text peacefully
      isPinnedToBottomRef.current = false;
      setShowScrollBottom(true);
    }
  }, []);

  // Detect explicit user mouse wheel intent
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    if (e.deltaY < 0) {
      // Scrolling up intentionally
      isPinnedToBottomRef.current = false;
      setShowScrollBottom(true);
    } else if (e.deltaY > 0) {
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (dist <= 70) {
        isPinnedToBottomRef.current = true;
        setShowScrollBottom(false);
      }
    }
  }, []);

  // Detect touch gesture start on mobile
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  }, []);

  // Detect touch swipe direction on mobile
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container || e.touches.length === 0) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current; // positive means swipe DOWN -> scroll content UP

    if (deltaY > 8) {
      // Scrolling up to view older messages -> unpin immediately
      isPinnedToBottomRef.current = false;
      setShowScrollBottom(true);
    } else if (deltaY < -8) {
      // Scrolling down toward newest
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (dist <= 70) {
        isPinnedToBottomRef.current = true;
        setShowScrollBottom(false);
      }
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

  // ResizeObserver: Only auto-scroll if the user is actively pinned at the bottom
  useEffect(() => {
    const messagesEl = messagesListRef.current;
    const container = containerRef.current;
    if (!messagesEl || !container) return;

    const observer = new ResizeObserver(() => {
      if (isPinnedToBottomRef.current) {
        container.scrollTop = container.scrollHeight;
      }
    });

    observer.observe(messagesEl);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Scrollable Container with Hardware Accelerated Scrolling */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="flex-1 overflow-y-auto px-2.5 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4 select-text smooth-scroll scroll-container-optimized"
        style={{
          scrollBehavior: 'auto',
          overflowAnchor: 'none', // We manage exact anchoring via ResizeObserver
          overscrollBehaviorY: 'contain'
        }}
      >
        {messages.length === 0 ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center max-w-xl mx-auto py-8 text-center animate-in fade-in duration-300 px-4">
            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 font-sans tracking-tight">
              كيف يمكن لـ <span className="brand-shimmer-text font-['Space_Grotesk'] font-black">matany.one</span> مساعدتك اليوم؟
            </h2>
            
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto font-sans leading-relaxed">
              اكتب رسالتك في الحقل بالأسفل للبدء، أو ارفع صورة للتحليل، أو ابدأ الاستكشاف والبحث المباشر.
            </p>
          </div>
        ) : (
          <div ref={messagesListRef} className="max-w-3xl mx-auto space-y-3 sm:space-y-4 pb-20 sm:pb-24">
            {messages.map((msg, index) => (
              <ChatMessage
                key={msg.id || index}
                message={msg}
                isStreaming={isStreaming && index === messages.length - 1}
              />
            ))}
            <div ref={bottomAnchorRef} className="h-1" />
          </div>
        )}
      </div>

      {/* Floating Smart "Scroll to Bottom" Pill Button */}
      <AnimatePresence>
        {showScrollBottom && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto shadow-2xl"
          >
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-950/90 hover:bg-zinc-900 text-zinc-200 hover:text-white border border-white/[0.15] shadow-2xl backdrop-blur-2xl text-xs font-sans font-medium transition-all active:scale-95 cursor-pointer group"
            >
              {isStreaming ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-zinc-300 group-hover:translate-y-0.5 transition-transform" />
              )}
              <span>{isStreaming ? 'جاري كتابة الرد • انقر للنزول' : 'الانتقال لأحدث رسالة'}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
