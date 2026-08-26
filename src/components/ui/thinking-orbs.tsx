import React, { useEffect, useRef } from "react";

export interface ThinkingOrbProps {
  state?: "working" | "searching" | "solving" | "listening" | "connecting" | "weaving" | "composing" | "breathing" | "shaping";
  size?: number;
  theme?: "dark" | "light" | "auto";
  speed?: number;
  paused?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const ThinkingOrb: React.FC<ThinkingOrbProps> = ({
  state = "working",
  size = 20,
  speed = 1.5,
  paused = false,
  className = "",
  style = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    let animationFrameId: number;
    let startTime = performance.now();

    // Color palletes for different states
    const getColor = (t: number, index: number, total: number) => {
      const angle = (index / total) * Math.PI * 2 + t * speed * 2;
      if (state === "searching") {
        // Cyan / Sky electric
        return `hsla(${185 + Math.sin(angle) * 30}, 95%, 60%, ${0.6 + Math.cos(angle) * 0.4})`;
      } else if (state === "solving" || state === "shaping") {
        // Amber / Rose
        return `hsla(${350 + Math.sin(angle) * 40}, 90%, 65%, ${0.6 + Math.cos(angle) * 0.4})`;
      } else if (state === "working") {
        // Emerald / Teal / Violet
        return `hsla(${150 + Math.sin(angle) * 50}, 85%, 60%, ${0.6 + Math.cos(angle) * 0.4})`;
      } else {
        // Holographic Rainbow / Composing
        return `hsla(${(t * 50 + (index / total) * 360) % 360}, 90%, 65%, ${0.7 + Math.sin(angle) * 0.3})`;
      }
    };

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const radius = size * 0.32;
      const dotCount = size <= 24 ? 6 : 10;
      const dotRadius = size <= 24 ? 1.6 : 2.5;

      // Draw active orbiting particle nodes
      for (let i = 0; i < dotCount; i++) {
        const phi = (i / dotCount) * Math.PI * 2;
        const timeOffset = elapsed * speed * 2.5;
        
        // Fluid Lissajous harmonic orbit
        const rVar = radius * (0.8 + 0.25 * Math.sin(timeOffset * 1.5 + phi * 2));
        const x = cx + rVar * Math.cos(phi + timeOffset);
        const y = cy + rVar * Math.sin(phi * 2 + timeOffset * 0.8) * 0.85;

        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = getColor(elapsed, i, dotCount);
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 6;
        ctx.fill();
      }

      // Draw faint center core pulse
      ctx.beginPath();
      const corePulse = (Math.sin(elapsed * speed * 3) + 1) * 0.5;
      ctx.arc(cx, cy, 2 + corePulse * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + corePulse * 0.4})`;
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = 8;
      ctx.fill();

      if (!paused) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, size, speed, paused]);

  return (
    <canvas
      ref={canvasRef}
      className={`shrink-0 pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        display: "block",
        ...style,
      }}
    />
  );
};

export default ThinkingOrb;
