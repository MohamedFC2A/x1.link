import React, { useEffect, useRef } from 'react';

export type GridTheme = 'fathom' | 'cyber' | 'vision' | 'media' | 'x1';

interface InteractiveGridBackgroundProps {
  className?: string;
  gridSize?: number;
  macroSize?: number;
  activeModel?: string;
  isX1Active?: boolean;
}

export const InteractiveGridBackground: React.FC<InteractiveGridBackgroundProps> = ({
  className = '',
  gridSize = 36,
  macroSize = 144,
  activeModel = 'deepseek-v4-flash',
  isX1Active = false,
}) => {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);

  const theme: GridTheme = isX1Active
    ? 'x1'
    : (activeModel === 'deepseek-v4-flash-cyber' || activeModel === 'deepseek-v4-pro-cyber-2.1' || activeModel === 'deepseek-v4-flash-cyber-2.1')
    ? 'cyber'
    : activeModel === 'deepseek-v4-flash-vision-exp'
    ? 'vision'
    : (activeModel === 'meta/muse-spark-1.2-contributor' || activeModel === 'deepseek-v4-flash-media')
    ? 'media'
    : 'fathom';

  useEffect(() => {
    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;

    const startAnimationLoop = () => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;
      
      const updatePosition = () => {
        if (targetX !== -1000) {
          if (currentX === -1000) {
            currentX = targetX;
            currentY = targetY;
          } else {
            const dx = targetX - currentX;
            const dy = targetY - currentY;
            
            // Fast settling threshold - pause RAF when mouse is stationary
            if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) {
              currentX = targetX;
              currentY = targetY;
              if (spotlightRef.current) {
                spotlightRef.current.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0)`;
              }
              isRunningRef.current = false;
              rafIdRef.current = null;
              return;
            }

            currentX += dx * 0.22;
            currentY += dy * 0.22;
          }

          if (spotlightRef.current) {
            spotlightRef.current.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0)`;
          }
        }

        rafIdRef.current = requestAnimationFrame(updatePosition);
      };

      rafIdRef.current = requestAnimationFrame(updatePosition);
    };

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      startAnimationLoop();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      isRunningRef.current = false;
    };
  }, []);

  const laserClass =
    theme === 'cyber'
      ? 'bg-grid-cyber-laser opacity-[0.06]'
      : theme === 'vision'
      ? 'bg-grid-vision-laser opacity-[0.06]'
      : theme === 'media'
      ? 'bg-grid-media-laser opacity-[0.06]'
      : theme === 'x1'
      ? 'bg-grid-x1-laser opacity-[0.08]'
      : 'bg-grid-laser opacity-[0.05]';

  const macroClass =
    theme === 'cyber'
      ? 'bg-grid-cyber-macro opacity-[0.05]'
      : theme === 'vision'
      ? 'bg-grid-vision-macro opacity-[0.05]'
      : theme === 'media'
      ? 'bg-grid-media-macro opacity-[0.05]'
      : theme === 'x1'
      ? 'bg-grid-x1-macro opacity-[0.06]'
      : 'bg-grid-macro opacity-[0.04]';

  const crosshairsClass =
    theme === 'cyber'
      ? 'bg-grid-cyber-crosshairs opacity-[0.05]'
      : theme === 'vision'
      ? 'bg-grid-vision-crosshairs opacity-[0.05]'
      : theme === 'media'
      ? 'bg-grid-media-crosshairs opacity-[0.05]'
      : theme === 'x1'
      ? 'bg-grid-x1-crosshairs opacity-[0.06]'
      : 'bg-grid-crosshairs opacity-[0.035]';

  const spotlightGlowGradient =
    theme === 'cyber'
      ? 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.06) 0%, rgba(6,182,212,0.015) 45%, transparent 70%)'
      : theme === 'vision'
      ? 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.015) 45%, transparent 70%)'
      : theme === 'media'
      ? 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.06) 0%, rgba(168,85,247,0.015) 45%, transparent 70%)'
      : theme === 'x1'
      ? 'radial-gradient(circle at 50% 50%, rgba(244,63,94,0.08) 0%, rgba(244,63,94,0.02) 45%, transparent 70%)'
      : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.01) 40%, transparent 70%)';

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 select-none overflow-hidden transition-colors duration-700 ${className}`}
      style={{
        contain: 'strict',
      }}
    >
      {/* 1. Base Static Blueprint Grid Layer */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${laserClass}`}
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      />

      {/* 2. Macro Structural Grid Lines */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${macroClass}`}
        style={{
          backgroundSize: `${macroSize}px ${macroSize}px`,
        }}
      />

      {/* 3. Laser Crosshair / Intersection Nodes (+) Pattern */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${crosshairsClass}`}
        style={{
          backgroundSize: `${macroSize}px ${macroSize}px`,
        }}
      />

      {/* 4. Hardware-Accelerated Ambient Spotlight Following Pointer (GPU composite only - 0 CPU/Mask cost) */}
      <div
        ref={spotlightRef}
        className="absolute top-0 left-0 -ml-[250px] -mt-[250px] w-[500px] h-[500px] rounded-full pointer-events-none transition-opacity duration-500"
        style={{
          willChange: 'transform',
          transform: 'translate3d(-1000px, -1000px, 0)',
          background: spotlightGlowGradient,
        }}
      />

      {/* 5. Soft Radial Vignette for Content Readability */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* 6. Subtle Ambient Breathing Wave */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-700 bg-grid-wave opacity-[0.08]" />
    </div>
  );
};
