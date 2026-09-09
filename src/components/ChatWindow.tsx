import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChatMessageItem, ModelType } from '../types';
import { ChatMessage } from './ChatMessage';
import { getConversationGlobalUrls, getConversationGlobalImages } from '../lib/utils';
import { Sparkles, ShieldOff, Eye, Camera, ShieldCheck, ChevronDown, ArrowDown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quant3PerfectionIcon } from './ui/Quant3PerfectionIcon';
import { getModelDisplayName, getModelSubtitle } from '../lib/modelUtils';

interface ChatWindowProps {
  messages: ChatMessageItem[];
  isStreaming: boolean;
  isRestoringChat?: boolean;
  isX1Active: boolean;
  activeModel?: ModelType;
  onSendPreset: (presetText: string) => void;
  onOpenArchitecture?: () => void;
  onToggleX1?: () => void;
  onImageGenerated?: (messageId: string | undefined, imageUrl: string) => void;
}

function extractPriorImageFromHistory(precedingMessages: ChatMessageItem[]): string | undefined {
  for (let i = precedingMessages.length - 1; i >= 0; i--) {
    const msg = precedingMessages[i];
    // 1. Attached image in message or media attachments
    if (msg.image && !msg.image.includes('pollinations.ai')) return msg.image;
    if (msg.images && msg.images.length > 0 && !msg.images[0].includes('pollinations.ai')) return msg.images[0];
    if (msg.mediaAttachments && msg.mediaAttachments.length > 0) {
      const imgAttachment = msg.mediaAttachments.find(a => a.type === 'image' || a.dataUrl?.startsWith('data:image'));
      if (imgAttachment?.dataUrl && !imgAttachment.dataUrl.includes('pollinations.ai')) return imgAttachment.dataUrl;
    }
    // 2. Check local storage cache by message id
    if (typeof window !== 'undefined' && window.localStorage && msg.id) {
      const cached = localStorage.getItem(`fathom_img_${msg.id}`);
      if (cached && !cached.includes('pollinations.ai') && (cached.startsWith('data:image') || cached.startsWith('http'))) {
        return cached;
      }
    }
    // 3. Neural image code fence in content
    if (msg.content) {
      const neuralBlockMatch = /```(?:neural-image|neural_image|image-studio|image_studio)?\s*(\{[\s\S]*?\})\s*```/i.exec(msg.content);
      if (neuralBlockMatch) {
        try {
          const parsed = JSON.parse(neuralBlockMatch[1]);
          if (parsed.imageUrl && !parsed.imageUrl.includes('pollinations.ai')) return parsed.imageUrl;
          if (parsed.processedImage && !parsed.processedImage.includes('pollinations.ai')) return parsed.processedImage;
        } catch {}
      }
      // 4. Direct image link in content
      const urlMatch = msg.content.match(/https?:\/\/[^\s)]+?\.(?:png|jpg|jpeg|webp)(?:\?[^\s)]*)?/i);
      if (urlMatch && !urlMatch[0].includes('pollinations.ai')) return urlMatch[0];
    }
  }
  return undefined;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isStreaming,
  isRestoringChat = false,
  isX1Active,
  activeModel = 'deepseek-v4-flash',
  onSendPreset,
  onImageGenerated,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);

  const modelDisplayName = getModelDisplayName(activeModel, isX1Active);
  const modelSubtitle = getModelSubtitle(activeModel, isX1Active);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const isAutoScrollLockedRef = useRef(true);
  const isUserInteractingRef = useRef(false);
  const lastScrollHeightRef = useRef(0);
  const lastScrollTopRef = useRef(0);
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
    lastScrollTopRef.current = container.scrollTop;
  }, [setAutoScrollLocked]);

  // Intelligent scroll threshold tracking
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const distFromBottom = container.scrollHeight - currentScrollTop - container.clientHeight;
    
    // Only show scroll button when user is noticeably away from bottom (> 160px) or scrolls up with margin (> 60px)
    const isAwayFromBottom = distFromBottom > 160;
    const isNoticeableScrollUp = currentScrollTop < lastScrollTopRef.current - 12;

    if (isAwayFromBottom || (isNoticeableScrollUp && distFromBottom > 60)) {
      if (isAutoScrollLockedRef.current) {
        isAutoScrollLockedRef.current = false;
      }
      setShowScrollBottom(true);
    } else if (distFromBottom <= 40) {
      // User naturally scrolled back down near bottom
      if (!isAutoScrollLockedRef.current) {
        isAutoScrollLockedRef.current = true;
      }
      setShowScrollBottom(false);
    }
    lastScrollTopRef.current = currentScrollTop;
  }, []);

  // Decouple user touch / wheel gestures to prevent violent jitter during streaming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (e.deltaY < 0) {
        // Scrolling UP: release auto-scroll lock if scrolled up significantly
        if (dist > 80) {
          setAutoScrollLocked(false);
        }
      } else if (e.deltaY > 0) {
        if (dist <= 40) {
          setAutoScrollLocked(true);
        }
      }
    };

    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      isUserInteractingRef.current = true;
      if (e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const currentY = e.touches[0].clientY;
        const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
        // Dragging finger downwards significantly means user intends to scroll upwards
        if (currentY > touchStartY + 24 && dist > 100) {
          setAutoScrollLocked(false);
        }
      }
    };

    const onTouchEnd = () => {
      isUserInteractingRef.current = false;
      setTimeout(handleScroll, 50);
    };

    container.addEventListener('wheel', onWheel, { passive: true });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
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
        const currentDist = currentHeight - container.scrollTop - container.clientHeight;
        // ONLY follow if auto-scroll is locked and we are legitimately within latch range of bottom
        if (currentDist <= 40 && currentHeight !== lastScrollHeightRef.current) {
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
        {isRestoringChat && messages.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center max-w-sm mx-auto py-12 px-4 text-center select-none animate-in fade-in zoom-in-95 duration-200">
            <div className="w-full flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-zinc-950/95 border border-zinc-800/90 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-center">
              {/* Sleek metallic loader spinner */}
              <div className="relative flex items-center justify-center size-10">
                <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
                <div className="absolute inset-0 rounded-full border-2 border-t-zinc-200 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="size-1.5 rounded-full bg-zinc-300 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-zinc-100 font-sans tracking-wide">
                  جارٍ استعادة المحادثة...
                </h3>
                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  يرجى الانتظار لحظات ريثما يتم تحميل سجل الرسائل
                </p>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="min-h-[45vh] flex flex-col items-center justify-center max-w-lg mx-auto py-8 sm:py-12 text-center animate-in fade-in duration-300 px-4 relative select-none">
            {/* Active Model Icon Visualizer */}
            <div className="mb-4 inline-flex items-center justify-center size-12 sm:size-14 rounded-2xl bg-white/[0.04] border border-white/[0.1] text-white shadow-lg backdrop-blur-md">
              {activeModel === 'fathom-quant-3' ? (
                <Quant3PerfectionIcon size={26} className="text-zinc-200" />
              ) : activeModel === 'deepseek-v4-flash-cyber-2.6' ? (
                <Zap className="w-6 h-6 text-amber-400" />
              ) : activeModel === 'deepseek-v4-pro-cyber-2.6' || activeModel === 'deepseek-v4-pro-cyber-2.1' ? (
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              ) : activeModel === 'deepseek-v4-flash-cyber' ? (
                <ShieldCheck className="w-6 h-6 text-cyan-400" />
              ) : activeModel === 'deepseek-v4-flash-vision-exp' ? (
                <Camera className="w-6 h-6 text-emerald-400" />
              ) : activeModel === 'meta/muse-spark-1.2-contributor' ? (
                <Sparkles className="w-6 h-6 text-violet-400" />
              ) : isX1Active ? (
                <ShieldOff className="w-6 h-6 text-rose-400" />
              ) : (
                <Zap className="w-6 h-6 text-zinc-200 fill-zinc-200/20" />
              )}
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2.5 font-sans">
              ابدأ محادثة مع {modelDisplayName}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-zinc-400 font-sans leading-relaxed max-w-md">
              {modelSubtitle}
            </p>
          </div>
        ) : (
          <div ref={messagesListRef} className="space-y-4 pb-24 sm:pb-32">
            {messages.map((message, index) => {
              const precedingMessages = messages.slice(0, index);
              const previousUserPrompt = message.role === 'assistant' 
                ? [...precedingMessages].reverse().find(m => m.role === 'user')?.content || ''
                : '';
              const priorImage = message.role === 'assistant'
                ? extractPriorImageFromHistory(precedingMessages)
                : undefined;

              return (
                <ChatMessage
                  key={message.id || index}
                  message={message}
                  isStreaming={isStreaming && index === messages.length - 1}
                  globalUrlIndexMap={globalUrlIndexMap}
                  globalImageIndexMap={globalImageIndexMap}
                  previousUserPrompt={previousUserPrompt}
                  priorImage={priorImage}
                  onImageGenerated={onImageGenerated}
                />
              );
            })}
            <div ref={bottomAnchorRef} className="h-6 sm:h-8" />
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
            className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto shadow-2xl"
          >
            <button
              type="button"
              onClick={() => {
                setShowScrollBottom(false);
                scrollToBottom(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950/95 hover:bg-zinc-900 text-zinc-200 hover:text-white border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)] backdrop-blur-2xl text-xs font-sans font-medium transition-all active:scale-95 cursor-pointer group select-none min-h-[36px]"
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
              <span className="leading-none">{isStreaming ? 'جارٍ التوليد • الانتقال للأسفل' : 'الانتقال لآخر رسالة'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
