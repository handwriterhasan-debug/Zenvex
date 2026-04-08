import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomTimePickerProps {
  value: string; // "HH:MM" in 24h format
  onChange: (value: string) => void;
  label?: string;
}

export function CustomTimePicker({ value, onChange, label }: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Parse initial value
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: 12, minute: 0, period: 'AM' };
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return { hour, minute: m, period };
  };

  const [time, setTime] = useState(parseTime(value));

  useEffect(() => {
    setTime(parseTime(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSave = (newTime: { hour: number, minute: number, period: string }) => {
    let h = newTime.hour;
    if (newTime.period === 'PM' && h !== 12) h += 12;
    if (newTime.period === 'AM' && h === 12) h = 0;
    
    const formattedHour = h.toString().padStart(2, '0');
    const formattedMinute = newTime.minute.toString().padStart(2, '0');
    onChange(`${formattedHour}:${formattedMinute}`);
  };

  const updateTime = (updates: Partial<typeof time>) => {
    const newTime = { ...time, ...updates };
    setTime(newTime);
    handleSave(newTime);
  };

  // Display format for the input button
  const displayTime = value ? (() => {
    const [h, m] = value.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
  })() : 'Select time';

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods = ['AM', 'PM'];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => { setTime(parseTime(value)); setIsOpen(!isOpen); }}
        className="bg-surface-light border border-border-dim rounded-lg px-4 py-2 text-text-main focus:outline-none focus:border-accent-primary text-left w-full flex justify-between items-center"
      >
        <span className={value ? 'text-text-main' : 'text-text-faint'}>{displayTime}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 bg-surface border border-border-dim rounded-xl shadow-2xl z-[101] w-full flex overflow-hidden h-48"
          >
            {/* Hours */}
            <div className="flex-1 overflow-y-auto scrollbar-hide border-r border-border-dim">
              {hours.map(h => (
                <button
                  key={`h-${h}`}
                  onClick={() => updateTime({ hour: h })}
                  className={`w-full py-2 text-center text-sm transition-colors ${time.hour === h ? 'bg-accent-primary text-white font-bold' : 'text-text-muted hover:bg-surface-hover hover:text-text-main'}`}
                >
                  {h.toString().padStart(2, '0')}
                </button>
              ))}
            </div>

            {/* Minutes */}
            <div className="flex-1 overflow-y-auto scrollbar-hide border-r border-border-dim">
              {minutes.map(m => (
                <button
                  key={`m-${m}`}
                  onClick={() => updateTime({ minute: m })}
                  className={`w-full py-2 text-center text-sm transition-colors ${time.minute === m ? 'bg-accent-primary text-white font-bold' : 'text-text-muted hover:bg-surface-hover hover:text-text-main'}`}
                >
                  {m.toString().padStart(2, '0')}
                </button>
              ))}
            </div>

            {/* AM/PM */}
            <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
              {periods.map(p => (
                <button
                  key={`p-${p}`}
                  onClick={() => updateTime({ period: p })}
                  className={`flex-1 py-2 text-center text-sm transition-colors ${time.period === p ? 'bg-accent-primary text-white font-bold' : 'text-text-muted hover:bg-surface-hover hover:text-text-main'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
