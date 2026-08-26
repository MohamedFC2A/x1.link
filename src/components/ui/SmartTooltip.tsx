import React, { useState, useRef, useEffect, ReactNode } from 'react';
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
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPressingRef = useRef(false);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const targetY = side === 'top' ? rect.top - 12 : rect.bottom + 12;
    setCoords({ top: targetY, left: centerX });
  };

  const clearTimers = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    isPressingRef.current = false;
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    clearTimers();
    // 2.0 seconds continuous mouse hover requirement
    hoverTimerRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, 2000);
  };

  const handleMouseLeave = () => {
    clearTimers();
    setIsVisible(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    if (e.button !== 0) return;
    isPressingRef.current = true;
    // 1.5 seconds press / hold requirement
    pressTimerRef.current = setTimeout(() => {
      if (isPressingRef.current) {
        updatePosition();
        setIsVisible(true);
      }
    }, 1500);
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    isPressingRef.current = false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsVisible(false);
    };
    const handleScrollOrResize = () => {
      if (isVisible) setIsVisible(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      clearTimers();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible]);

  return (
    <>
      <div
        ref={triggerRef}
        className={`relative inline-flex ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (isVisible) {
            setIsVisible(false);
          }
        }}
      >
        {children}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isVisible && !disabled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: side === 'top' ? 6 : -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: coords.top,
                  left: coords.left,
                  transform: side === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
                  zIndex: 999999,
                }}
                className="pointer-events-auto select-none"
                dir="rtl"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                }}
              >
                <div className="w-64 sm:w-72 p-3 rounded-2xl bg-[#09090d]/95 backdrop-blur-2xl border border-white/[0.16] shadow-[0_20px_50px_rgba(0,0,0,0.95)] text-right relative overflow-hidden">
                  {/* Subtle Ambient Radial Glow */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/[0.05] rounded-full blur-xl pointer-events-none" />

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
                    <span>معلومات توضيحية</span>
                    <span className="font-mono text-zinc-400">FATHOM AI</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
