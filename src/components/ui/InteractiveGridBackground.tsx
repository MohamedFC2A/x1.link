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
    : activeModel === 'deepseek-v4-flash-cyber'
    ? 'cyber'
    : activeModel === 'deepseek-v4-flash-vision-exp'
    ? 'vision'
    : activeModel === 'deepseek-v4-flash-media'
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
      ? 'bg-grid-cyber-laser opacity-70'
      : theme === 'vision'
      ? 'bg-grid-vision-laser opacity-70'
      : theme === 'media'
      ? 'bg-grid-media-laser opacity-70'
      : theme === 'x1'
      ? 'bg-grid-x1-laser opacity-70'
      : 'bg-grid-laser opacity-55';

  const macroClass =
    theme === 'cyber'
      ? 'bg-grid-cyber-macro opacity-60'
      : theme === 'vision'
      ? 'bg-grid-vision-macro opacity-60'
      : theme === 'media'
      ? 'bg-grid-media-macro opacity-60'
      : theme === 'x1'
      ? 'bg-grid-x1-macro opacity-60'
      : 'bg-grid-macro opacity-40';

  const crosshairsClass =
    theme === 'cyber'
      ? 'bg-grid-cyber-crosshairs opacity-60'
      : theme === 'vision'
      ? 'bg-grid-vision-crosshairs opacity-60'
      : theme === 'media'
      ? 'bg-grid-media-crosshairs opacity-60'
      : theme === 'x1'
      ? 'bg-grid-x1-crosshairs opacity-60'
      : 'bg-grid-crosshairs opacity-35';

  const brightClass =
    theme === 'cyber'
      ? 'bg-grid-cyber-bright opacity-95'
      : theme === 'vision'
      ? 'bg-grid-vision-bright opacity-95'
      : theme === 'media'
      ? 'bg-grid-media-bright opacity-95'
      : theme === 'x1'
      ? 'bg-grid-x1-bright opacity-95'
      : 'bg-grid-laser-bright opacity-95';

  const haloGradient =
    theme === 'cyber'
      ? 'radial-gradient(580px circle at var(--mouse-x) var(--mouse-y), rgba(6,182,212,0.11), rgba(6,182,212,0.02) 45%, transparent 75%)'
      : theme === 'vision'
      ? 'radial-gradient(580px circle at var(--mouse-x) var(--mouse-y), rgba(16,185,129,0.11), rgba(16,185,129,0.02) 45%, transparent 75%)'
      : theme === 'media'
      ? 'radial-gradient(580px circle at var(--mouse-x) var(--mouse-y), rgba(168,85,247,0.11), rgba(168,85,247,0.02) 45%, transparent 75%)'
      : theme === 'x1'
      ? 'radial-gradient(580px circle at var(--mouse-x) var(--mouse-y), rgba(244,63,94,0.11), rgba(244,63,94,0.02) 45%, transparent 75%)'
      : 'radial-gradient(550px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.08), rgba(255,255,255,0.01) 40%, transparent 75%)';

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none fixed inset-0 z-0 select-none overflow-hidden transition-colors duration-700 ${className}`}
      style={{
        '--mouse-x': '-1000px',
        '--mouse-y': '-1000px',
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

      {/* 3. Glowing Laser Crosshair / Intersection Nodes (+) Pattern */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${crosshairsClass}`}
        style={{
          backgroundSize: `${macroSize}px ${macroSize}px`,
        }}
      />

      {/* 4. Dynamic Cursor Spotlight (Reveals razor-sharp illuminated grid) */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${brightClass}`}
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
          maskImage: 'radial-gradient(440px circle at var(--mouse-x) var(--mouse-y), rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 45%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(440px circle at var(--mouse-x) var(--mouse-y), rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 45%, transparent 80%)',
        }}
      />

      {/* 5. Ambient Atmospheric Spotlight Halo Following Pointer */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: haloGradient,
        }}
      />

      {/* 6. Soft Radial Vignette for Content Readability */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* 7. Subtle Ambient Breathing Wave for mobile / idle aura */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-700 bg-grid-wave opacity-25" />
    </div>
  );
};
