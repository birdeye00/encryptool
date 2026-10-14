import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 26, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Chassis Background Gradient */}
        <linearGradient id="logo-chassis" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#0B0F19" />
        </linearGradient>

        {/* Chassis Perimeter Highlight */}
        <linearGradient id="logo-border" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#6366F1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.7" />
        </linearGradient>

        {/* Left Vertical Beam (Cyan to Indigo) */}
        <linearGradient id="beam-v1" x1="14" y1="6" x2="11" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        {/* Right Vertical Beam (Indigo to Violet) */}
        <linearGradient id="beam-v2" x1="21" y1="6" x2="18" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>

        {/* Top Horizontal Bar (Cyan to Violet) */}
        <linearGradient id="bar-h1" x1="6" y1="12" x2="26" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>

        {/* Bottom Horizontal Bar (Indigo to Cyan) */}
        <linearGradient id="bar-h2" x1="5" y1="20" x2="25" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* Rounded Squircle Chassis */}
      <rect
        x="1.25"
        y="1.25"
        width="29.5"
        height="29.5"
        rx="7.5"
        fill="url(#logo-chassis)"
        stroke="url(#logo-border)"
        strokeWidth="1.2"
      />

      {/* Subtle Inner Ambient Glow */}
      <circle
        cx="16"
        cy="16"
        r="7"
        fill="#6366F1"
        fillOpacity="0.12"
      />

      {/* Vertical Hash Beams (Angled) */}
      <path
        d="M14 6.5L11 25.5"
        stroke="url(#beam-v1)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M21 6.5L18 25.5"
        stroke="url(#beam-v2)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Horizontal Crossbars */}
      <path
        d="M6.5 12H25.5"
        stroke="url(#bar-h1)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M5.5 20H24.5"
        stroke="url(#bar-h2)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      {/* Central Cryptographic Precision Aperture */}
      <circle
        cx="16"
        cy="16"
        r="1.4"
        fill="#FFFFFF"
      />
    </svg>
  );
};
