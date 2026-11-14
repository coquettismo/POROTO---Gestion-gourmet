import React from 'react';

interface PorotoIconProps {
  className?: string;
  size?: number;
}

export const PorotoIcon: React.FC<PorotoIconProps> = ({ className = 'w-6 h-6', size }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="porotoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      {/* Organic bean body */}
      <path
        d="M 50 12 
           C 72 12, 88 28, 88 50 
           C 88 72, 72 88, 54 88 
           C 38 88, 24 78, 19 66 
           C 14 54, 16 38, 24 26 
           C 32 14, 42 12, 50 12 Z"
        fill="url(#porotoGrad)"
      />
      {/* Gentle hilum curve (ojo del poroto) */}
      <path
        d="M 28 42 C 30 48, 30 54, 27 60"
        stroke="#fff7ed"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
};
