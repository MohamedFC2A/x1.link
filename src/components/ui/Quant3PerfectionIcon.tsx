import React from 'react';

interface Quant3PerfectionIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Quant 3 Perfection Icon (رمز الكمال والتوازن الهندسي والكمومي المطلق)
 * Represents Sacred Geometric Vector Equilibrium, Dimensional Crystalline Octahedron,
 * and Mathematical Harmony.
 */
export const Quant3PerfectionIcon: React.FC<Quant3PerfectionIconProps> = ({
  size = 16,
  className = '',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="q3-grad-primary" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="q3-grad-facet-top" x1="12" y1="2.5" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="q3-grad-facet-right" x1="20.2" y1="12" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="q3-grad-facet-left" x1="3.8" y1="12" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Outer Sacred Hexagonal Hull */}
      <polygon
        points="12,2.5 20.2,7.2 20.2,16.8 12,21.5 3.8,16.8 3.8,7.2"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-80"
      />

      {/* Internal Harmonic Facets (Shaded Geometric Planes) */}
      <polygon
        points="12,2.5 20.2,7.2 12,12"
        fill="url(#q3-grad-facet-top)"
      />
      <polygon
        points="20.2,7.2 20.2,16.8 12,12"
        fill="url(#q3-grad-facet-right)"
      />
      <polygon
        points="12,12 20.2,16.8 12,21.5"
        fill="url(#q3-grad-facet-right)"
        opacity="0.6"
      />
      <polygon
        points="3.8,16.8 12,21.5 12,12"
        fill="url(#q3-grad-facet-left)"
        opacity="0.8"
      />
      <polygon
        points="3.8,7.2 3.8,16.8 12,12"
        fill="url(#q3-grad-facet-left)"
      />
      <polygon
        points="12,2.5 3.8,7.2 12,12"
        fill="url(#q3-grad-facet-top)"
        opacity="0.7"
      />

      {/* Equilateral Spoke Vectors (Convergence to Quantum Center) */}
      <line x1="12" y1="2.5" x2="12" y2="21.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" className="opacity-70" />
      <line x1="3.8" y1="7.2" x2="20.2" y2="16.8" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" className="opacity-70" />
      <line x1="3.8" y1="16.8" x2="20.2" y2="7.2" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" className="opacity-70" />

      {/* Inner Concentric Diamond Core (Sacred Vector Equilibrium) */}
      <polygon
        points="12,6.8 16.5,12 12,17.2 7.5,12"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-90"
      />

      {/* Central Singularity Equilibrium Point */}
      <circle cx="12" cy="12" r="1.4" fill="currentColor" className="opacity-95" />
    </svg>
  );
};

export default Quant3PerfectionIcon;
