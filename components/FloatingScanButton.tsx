'use client';

import React from 'react';

interface FloatingScanButtonProps {
  onScanClick: () => void;
}

export const FloatingScanButton: React.FC<FloatingScanButtonProps> = ({ onScanClick }) => {
  return (
    <button
      onClick={onScanClick}
      className="fixed z-10 bottom-[77px] left-1/2 -translate-x-1/2 h-[38px] px-[16px] border-0 rounded-[22px] bg-[#222] hover:bg-[#111] text-white flex items-center gap-[8px] text-[14px] font-medium shadow-[0_3px_9px_rgba(0,0,0,0.2)] transition-all active:scale-95"
      aria-label="Scan Receipt"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-[18px] h-[18px] stroke-current fill-none stroke-[1.8] stroke-round"
      >
        <path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3M8 12h8" />
      </svg>
      Scan
    </button>
  );
};

