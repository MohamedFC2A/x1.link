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
  const containerRef = useRef<HTMLDivElement>(null);

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
    let animationFrameId: number;
    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;

    const handlePointerMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    // Smooth lerp interpolation for silky 60/120fps tracking
    const updatePosition = () => {
      if (targetX !== -1000) {
        if (currentX === -1000) {
          currentX = targetX;
          currentY = targetY;
        } else {
          currentX += (targetX - currentX) * 0.18;
          currentY += (targetY - currentY) * 0.18;
        }

        if (containerRef.current) {
          containerRef.current.style.setProperty('--mouse-x', `${currentX.toFixed(1)}px`);
          containerRef.current.style.setProperty('--mouse-y', `${currentY.toFixed(1)}px`);
        }
      }
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(animationFrameId);
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

  const brightClass =
    theme === 'cyber'
      ? 'bg-grid-cyber-bright opacity-30'
      : theme === 'vision'
      ? 'bg-grid-vision-bright opacity-30'
      : theme === 'media'
      ? 'bg-grid-media-bright opacity-30'
      : theme === 'x1'
      ? 'bg-grid-x1-bright opacity-35'
      : 'bg-grid-laser-bright opacity-25';

  const haloGradient =
    theme === 'cyber'
      ? 'radial-gradient(550px circle at var(--mouse-x) var(--mouse-y), rgba(6,182,212,0.04), rgba(6,182,212,0.01) 45%, transparent 75%)'
      : theme === 'vision'
      ? 'radial-gradient(550px circle at var(--mouse-x) var(--mouse-y), rgba(16,185,129,0.04), rgba(16,185,129,0.01) 45%, transparent 75%)'
      : theme === 'media'
      ? 'radial-gradient(550px circle at var(--mouse-x) var(--mouse-y), rgba(168,85,247,0.04), rgba(168,85,247,0.01) 45%, transparent 75%)'
      : theme === 'x1'
      ? 'radial-gradient(550px circle at var(--mouse-x) var(--mouse-y), rgba(244,63,94,0.05), rgba(244,63,94,0.01) 45%, transparent 75%)'
      : 'radial-gradient(500px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.03), rgba(255,255,255,0.005) 40%, transparent 75%)';

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none fixed inset-0 z-0 select-none overflow-hidden transition-colors duration-700 ${className}`}
      style={{
        '--mouse-x': '-1000px',
        '--mouse-y': '-1000px',
        maskImage: 'radial-gradient(ellipse 80% 65% at 50% 50%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,1) 85%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 65% at 50% 50%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,1) 85%)',
      } as React.CSSProperties}
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

      {/* 4. Dynamic Cursor Spotlight (Subtle ambient illumination) */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${brightClass}`}
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
          maskImage: 'radial-gradient(380px circle at var(--mouse-x) var(--mouse-y), rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(380px circle at var(--mouse-x) var(--mouse-y), rgba(0,0,0,1) 0%, rgba(0,0,0,0.4) 40%, transparent 80%)',
        }}
      />

      {/* 5. Ambient Spotlight Halo Following Pointer */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: haloGradient,
        }}
      />

      {/* 6. Soft Radial Vignette for Content Readability */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* 7. Subtle Ambient Breathing Wave */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-700 bg-grid-wave opacity-[0.08]" />
    </div>
  );
};
