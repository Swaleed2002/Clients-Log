import React from 'react';

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative w-12 h-10 mb-1">
        {/* Simplified R Logo */}
        <div className="absolute top-0 left-0 w-full h-full">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path d="M 10 70 L 60 20 C 75 10 90 15 95 30 C 98 40 85 55 60 55 L 40 55 L 10 70 Z" fill="#E61C24"/>
            <path d="M 30 90 L 35 45 L 85 85 L 75 80 L 40 50 L 30 90 Z" fill="#1A1A1A"/>
          </svg>
        </div>
      </div>
      <div className="text-center leading-none">
        <h1 className="text-[#E61C24] font-black tracking-widest text-lg sm:text-xl uppercase">Reliable</h1>
        <p className="text-[#1A1A1A] font-bold text-[8px] sm:text-[10px] tracking-widest mt-1">Industrial Coding & Marking</p>
        <div className="flex items-center justify-center mt-0.5">
          <div className="h-[1px] bg-[#E61C24] w-4 mr-1"></div>
          <p className="text-[#1A1A1A] font-bold text-[6px] sm:text-[8px] tracking-[0.2em]">SYSTEMS CO LLC</p>
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
           <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
             <path d="M 5 65 L 55 15 C 70 5 85 10 90 25 C 93 35 80 50 55 50 L 35 50 L 5 65 Z" fill="#E61C24"/>
             <path d="M 25 85 L 30 40 L 80 80 L 70 75 L 35 45 L 25 85 Z" fill="#1A1A1A"/>
           </svg>
         </div>
         <div className="flex flex-col">
           <span className="text-[#E61C24] font-black tracking-wider text-base leading-none">RELIABLE</span>
           <span className="text-[#1A1A1A] font-bold text-[8px] tracking-widest mt-0.5 leading-none">INDUSTRIAL CODING</span>
         </div>
      </div>
    </div>
  );
}
