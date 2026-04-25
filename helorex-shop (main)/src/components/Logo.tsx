import React from 'react';

const Logo = ({ className = "h-8", gradient = true }: { className?: string, gradient?: boolean }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-full flex items-center">
        <svg 
          viewBox="0 0 100 100" 
          className="h-full w-auto" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top Left Diamond */}
          <path d="M30 30L45 20V50L30 60V30Z" fill="white" />
          {/* Bottom Left Diamond */}
          <path d="M30 65L45 55V85L30 95V65Z" fill="white" />
          {/* Top Right Diamond */}
          <path d="M70 30V60L55 50V20L70 30Z" fill="white" />
          {/* Bottom Right Diamond */}
          <path d="M70 65V95L55 85V55L70 65Z" fill="white" />
          {/* Center Play Mark */}
          <path d="M45 42L55 50L45 58V42Z" fill="white" />
        </svg>
      </div>

      <div className="flex flex-col gap-0 leading-none ml-2">
        <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white font-sans">
          HELOREX
        </span>
        <div className="flex items-center gap-1">
          <div className="h-px w-4 bg-white/20" />
          <span className="text-[7px] font-black uppercase tracking-[0.5em] text-white/40 italic">
            PREMIUM SHOP
          </span>
        </div>
      </div>
    </div>
  );
};

export default Logo;
