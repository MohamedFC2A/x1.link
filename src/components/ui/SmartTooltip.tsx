import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export interface SmartTooltipProps {
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  icon?: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
  disabled?: boolean;
}

export const SmartTooltip: React.FC<SmartTooltipProps> = ({
  title,
  description,
  badge,
  badgeColor = 'bg-white/10 text-white border-white/20',
  icon,
  children,
  side = 'top',
  className = '',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPressingRef = useRef(false);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const safeX = Math.max(150, Math.min(window.innerWidth - 150, centerX));
    const targetY = side === 'top' ? rect.top - 10 : rect.bottom + 10;
    setCoords({ top: targetY, left: safeX });
  }, [side]);

  const clearTimers = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    isPressingRef.current = false;
  }, []);

  // Hover detection: 2.0 seconds
  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    clearTimers();
    hoverTimerRef.current = setTimeout(() => {
      calculatePosition();
      setIsVisible(true);
    }, 800);
  }, [disabled, clearTimers, calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    clearTimers();
    setIsVisible(false);
  }, [clearTimers]);

  // Press / Hold detection: 1.5 seconds (Mouse & Touch)
  const startPressTimer = useCallback(() => {
    if (disabled) return;
    clearTimers();
    isPressingRef.current = true;
    pressTimerRef.current = setTimeout(() => {
      if (isPressingRef.current) {
        calculatePosition();
        setIsVisible(true);
      }
    }, 600);
  }, [disabled, clearTimers, calculatePosition]);

  const endPressTimer = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    isPressingRef.current = false;
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    startPressTimer();
  };

  const handleTouchStart = () => {
    startPressTimer();
  };

  const handleTouchEnd = () => {
    endPressTimer();
  };

  const handleTouchMove = () => {
    endPressTimer();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsVisible(false);
    };
    const handleGlobalClick = () => {
      setIsVisible(false);
    };
    const handleScrollOrResize = () => {
      setIsVisible(false);
    };

    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('click', handleGlobalClick);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
    }

    return () => {
      clearTimers();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible, clearTimers]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`relative inline-flex items-center justify-center ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={endPressTimer}
        onPointerCancel={endPressTimer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onContextMenu={(e) => {
          if (isVisible) {
            e.preventDefault();
          }
        }}
      >
        {children}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isVisible && !disabled && (
              <div
                style={{
                  position: 'fixed',
                  top: `${coords.top}px`,
                  left: `${coords.left}px`,
                  transform: side === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0%)',
                  zIndex: 999999,
                  pointerEvents: 'auto',
                }}
                dir="rtl"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: side === 'top' ? 8 : -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: side === 'top' ? 4 : -4 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="w-64 sm:w-72 p-3 rounded-2xl bg-[#09090d]/95 backdrop-blur-2xl border border-white/[0.18] shadow-[0_20px_50px_rgba(0,0,0,0.95)] text-right select-none relative overflow-hidden"
                >
                  {/* Subtle Ambient Radial Glow */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/[0.06] rounded-full blur-xl pointer-events-none" />

                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {icon && (
                        <div className="size-6 rounded-lg bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0">
                          {icon}
                        </div>
                      )}
                      <span className="font-sans font-bold text-xs text-white truncate">
                        {title}
                      </span>
                    </div>
                    {badge && (
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 ${badgeColor}`}>
                        {badge}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] font-sans text-zinc-300 leading-relaxed font-normal">
                    {description}
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-white/[0.08] flex items-center justify-between text-[9px] text-zinc-500 font-sans">
                    <span>تلميح ذكي توضيحي</span>
                    <span className="font-mono text-zinc-400">FATHOM AI</span>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
