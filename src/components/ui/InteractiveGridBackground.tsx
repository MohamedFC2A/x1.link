import React, { useEffect, useRef } from 'react';

interface InteractiveGridBackgroundProps {
  className?: string;
  gridSize?: number;
  macroSize?: number;
  isCyberActive?: boolean;
}

export const InteractiveGridBackground: React.FC<InteractiveGridBackgroundProps> = ({
  className = '',
  gridSize = 36,
  macroSize = 144,
  isCyberActive = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none fixed inset-0 z-0 select-none overflow-hidden transition-colors duration-700 ${className}`}
      style={{
        '--mouse-x': '-1000px',
        '--mouse-y': '-1000px',
      } as React.CSSProperties}
    >
      {/* 1. Base Static Blueprint Grid Layer (Monochrome or Cyber Cyan) */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${
          isCyberActive ? 'bg-grid-cyber-laser opacity-70' : 'bg-grid-laser opacity-55'
        }`}
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
      />

      {/* 2. Macro Structural Grid Lines */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${
          isCyberActive ? 'bg-grid-cyber-macro opacity-60' : 'bg-grid-macro opacity-40'
        }`}
        style={{
          backgroundSize: `${macroSize}px ${macroSize}px`,
        }}
      />

      {/* 3. Glowing Laser Crosshair / Intersection Nodes (+) Pattern */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${
          isCyberActive ? 'bg-grid-cyber-crosshairs opacity-60' : 'bg-grid-crosshairs opacity-35'
        }`}
        style={{
          backgroundSize: `${macroSize}px ${macroSize}px`,
        }}
      />

      {/* 4. Dynamic Cursor Spotlight (Reveals razor-sharp illuminated grid) */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          isCyberActive ? 'bg-grid-cyber-bright opacity-95' : 'bg-grid-laser-bright opacity-95'
        }`}
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
          background: isCyberActive
            ? 'radial-gradient(580px circle at var(--mouse-x) var(--mouse-y), rgba(6,182,212,0.09), rgba(6,182,212,0.02) 45%, transparent 75%)'
            : 'radial-gradient(550px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.08), rgba(255,255,255,0.01) 40%, transparent 75%)',
        }}
      />

      {/* 6. Soft Radial Vignette for Content Readability */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* 7. Subtle Ambient Breathing Wave for mobile / idle aura */}
      <div className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
        isCyberActive ? 'bg-grid-wave opacity-35' : 'bg-grid-wave opacity-20'
      }`} />
    </div>
  );
};
