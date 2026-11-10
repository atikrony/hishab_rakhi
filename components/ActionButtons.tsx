'use client';

import React from 'react';

interface ActionButtonsProps {
  onAddTransaction: () => void;
  onAddSaving: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAddTransaction,
  onAddSaving,
}) => {
  return (
    <div className="grid grid-cols-2 gap-[9px] my-[13px] mb-[22px]">
      <button
        onClick={onAddTransaction}
        className="h-[53px] border-0 rounded-[17px] text-white text-[18px] font-[500] flex items-center justify-center gap-[10px] bg-gradient-to-b from-[#19aaf5] to-[#008fe0] shadow-[inset_0_2px_4px_#ffffff60,inset_0_-2px_4px_#00000022,0_1px_2px_#00000012] active:scale-[0.98] transition-transform"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[21px] h-[21px] stroke-current fill-none stroke-[2] stroke-round"
        >
          <path d="M12 19V5m-6 6 6-6 6 6" />
        </svg>
        Add
      </button>

      <button
        onClick={onAddSaving}
        className="h-[53px] border-0 rounded-[17px] text-white text-[18px] font-[500] flex items-center justify-center gap-[10px] bg-gradient-to-b from-[#3b3b3b] to-[#171717] shadow-[inset_0_2px_4px_#ffffff60,inset_0_-2px_4px_#00000022,0_1px_2px_#00000012] active:scale-[0.98] transition-transform"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-[21px] h-[21px] stroke-current fill-none stroke-[2] stroke-round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Saving
      </button>
    </div>
  );
};

