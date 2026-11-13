'use client';

import React, { useState } from 'react';

interface CalendarModalProps {
  isOpen: boolean;
  selectedDate: string;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  selectedDate,
  onClose,
  onSelectDate,
}) => {
  const getInitialDate = () => {
    try {
      if (selectedDate) {
        const d = new Date(selectedDate);
        if (!isNaN(d.getTime())) {
          return d.toISOString().slice(0, 10);
        }
      }
    } catch {}
    return new Date().toISOString().slice(0, 10);
  };

  const [tempDate, setTempDate] = useState(getInitialDate);

  if (!isOpen) return null;

  const handleApply = () => {
    onSelectDate(tempDate);
    onClose();
  };

  const handleQuickSelect = (label: string) => {
    const now = new Date();
    if (label === 'Today') {
      const formatted = now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      onSelectDate(formatted);
    } else {
      onSelectDate(label);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-[430px] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between pb-4 border-b border-[#f0f0f2]">
          <h2 className="text-[19px] font-[650] text-[#17191d]">Calendar Filter</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f4f5f7] flex items-center justify-center text-[#666] hover:text-[#111]"
          >
            ✕
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#888] uppercase block mb-1">
              Select Specific Date (No Future Dates)
            </label>
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={tempDate}
              onChange={(e) => {
                const todayStr = new Date().toISOString().split('T')[0];
                if (e.target.value > todayStr) return;
                setTempDate(e.target.value);
              }}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#e2e2e6] text-sm outline-none focus:border-[#079be8]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#888] uppercase block mb-2">
              Quick Filter
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleQuickSelect('Today')}
                className="p-2.5 rounded-xl border border-[#e2e2e6] hover:bg-[#f0f8ff] hover:border-[#079be8] font-medium"
              >
                📅 Today (Default)
              </button>
              <button
                onClick={() => handleQuickSelect('This Week')}
                className="p-2.5 rounded-xl border border-[#e2e2e6] hover:bg-[#f0f8ff] hover:border-[#079be8] font-medium"
              >
                📊 This Week
              </button>
              <button
                onClick={() => handleQuickSelect('This Month')}
                className="p-2.5 rounded-xl border border-[#e2e2e6] hover:bg-[#f0f8ff] hover:border-[#079be8] font-medium"
              >
                🗓️ This Month
              </button>
              <button
                onClick={() => handleQuickSelect('All Time')}
                className="p-2.5 rounded-xl border border-[#e2e2e6] hover:bg-[#f0f8ff] hover:border-[#079be8] font-medium"
              >
                🌐 All Time
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleApply}
              className="w-full h-[48px] rounded-2xl text-white font-semibold text-sm bg-[#079be8] hover:bg-[#0689cf] transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

