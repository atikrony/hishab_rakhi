'use client';

import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      className="fixed z-50 bottom-[145px] left-1/2 -translate-x-1/2 bg-[#202124] text-white px-[15px] py-[10px] rounded-[10px] text-[13px] shadow-lg pointer-events-none transition-all duration-200 whitespace-nowrap animate-slide-up"
      role="status"
    >
      {message}
    </div>
  );
};
