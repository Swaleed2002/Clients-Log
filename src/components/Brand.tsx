import React from 'react';
import reliableLogo from '../assets/reliable-app-icon.png';

export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative w-12 h-10 mb-1">
        <img
          src={reliableLogo}
          alt="Reliable Coding"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="text-center leading-none">
        <h1 className="text-[#E61C24] font-black tracking-widest text-lg sm:text-xl uppercase">
          Reliable
        </h1>
        <p className="text-[#1A1A1A] font-bold text-[8px] sm:text-[10px] tracking-widest mt-1">
          Industrial Coding & Marking
        </p>
        <div className="flex items-center justify-center mt-0.5">
          <div className="h-[1px] bg-[#E61C24] w-4 mr-1"></div>
          <p className="text-[#1A1A1A] font-bold text-[6px] sm:text-[8px] tracking-[0.2em]">
            SYSTEMS CO LLC
          </p>
          <div className="h-[1px] bg-[#E61C24] w-4 ml-1"></div>
        </div>
      </div>
    </div>
  );
}

export function HeaderMinimal() {
  return (
    <div className="flex items-center justify-center py-2 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 relative">
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