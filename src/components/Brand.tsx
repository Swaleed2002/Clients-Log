import React from 'react';
import reliableLogo from '../assets/reliable-app-icon.png';

export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative w-40 h-40 max-w-full">
        <img
          src={reliableLogo}
          alt="Reliable Coding - Simply the best"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}

export function HeaderMinimal() {
  return (
    <div className="flex items-center justify-center py-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 relative">
          <img
            src={reliableLogo}
            alt="Reliable Coding"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[#E61C24] font-black tracking-wider text-base leading-none">
            RELIABLE
          </span>
          <span className="text-[#1A1A1A] font-bold text-[8px] tracking-widest mt-0.5 leading-none">
            INDUSTRIAL CODING
          </span>
        </div>
      </div>
    </div>
  );
}
