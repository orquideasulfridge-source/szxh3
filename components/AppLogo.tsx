
import React from 'react';

export const AppLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo_grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0062BD" /> {/* Legacy Blue */}
        <stop offset="100%" stopColor="#22D3EE" /> {/* Digital Cyan */}
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* The "C" Swoop - Representing the Hardware/Platform Base */}
    <path 
      d="M70 20 C 35 20 10 40 10 65 C 10 90 35 100 60 98" 
      stroke="url(#logo_grad)" 
      strokeWidth="10" 
      strokeLinecap="round"
      filter="url(#glow)"
    />
    
    {/* Data Dots on the tail of C */}
    <circle cx="78" cy="92" r="3.5" fill="#22D3EE" className="animate-pulse" />
    <circle cx="88" cy="85" r="2.5" fill="#22D3EE" fillOpacity="0.7" />
    <circle cx="95" cy="76" r="1.5" fill="#22D3EE" fillOpacity="0.4" />

    {/* The Central "A" / Tower Shape */}
    <g transform="translate(0, 5)">
        {/* Left Side: Solid (Physical Asset) */}
        <path d="M50 15 L 30 80 L 42 80 L 46 68 L 50 68 Z" fill="white" />
        
        {/* Right Side: Wireframe (Digital Twin) */}
        <path d="M50 15 L 70 80 L 58 80 L 54 68 L 50 68" stroke="white" strokeWidth="3" strokeLinejoin="round" fill="none" strokeDasharray="3 2" />
        
        {/* Horizontal Bar */}
        <rect x="38" y="68" width="24" height="5" fill="white" />
    </g>
  </svg>
);
