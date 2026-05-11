import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Approximate global events for 2026
const GLOBAL_EVENTS: Record<string, { name: string; type: 'islamic' | 'hindu' | 'global' | 'christian' }> = {
  '2026-01-01': { name: "New Year's Day", type: 'global' },
  '2026-02-14': { name: "Valentine's Day", type: 'global' },
  '2026-02-17': { name: "Maha Shivaratri", type: 'hindu' },
  '2026-02-18': { name: "First Day of Ramadan", type: 'islamic' },
  '2026-03-03': { name: "Holi", type: 'hindu' },
  '2026-03-17': { name: "St. Patrick's Day", type: 'global' },
  '2026-03-20': { name: "Eid al-Fitr", type: 'islamic' },
  '2026-04-05': { name: "Easter Sunday", type: 'christian' },
  '2026-05-27': { name: "Eid al-Adha", type: 'islamic' },
  '2026-06-16': { name: "Islamic New Year", type: 'islamic' },
  '2026-07-04': { name: "US Independence Day", type: 'global' },
  '2026-10-31': { name: "Halloween", type: 'global' },
  '2026-11-08': { name: "Diwali", type: 'hindu' },
  '2026-12-25': { name: "Christmas Day", type: 'christian' },
};

const EVENT_COLORS = {
  islamic: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  hindu: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  global: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  christian: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function LiveCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const todayStr = new Date().toISOString().split('T')[0];

  const renderDays = () => {
    const days = [];
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square md:h-24 md:aspect-auto border border-[#222]/50 bg-[#0a0a0a]/30 rounded-lg"></div>);
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const event = GLOBAL_EVENTS[dateStr];
      const isSelected = selectedDate === dateStr;

      days.push(
        <div 
          key={i} 
          onClick={() => setSelectedDate(isSelected ? null : dateStr)}
          className={`relative aspect-square md:h-24 md:aspect-auto border p-1 md:p-2 rounded-lg cursor-pointer transition-all duration-200
            ${isToday ? 'border-[#ff2a2a] bg-[#ff2a2a]/5' : 'border-[#222] bg-[#111] hover:border-[#444]'}
            ${isSelected ? 'ring-2 ring-white scale-105 z-10' : ''}
          `}
        >
          <div className="flex justify-between items-start">
            <span className={`text-xs md:text-sm font-medium ${isToday ? 'text-[#ff2a2a]' : 'text-gray-300'}`}>
              {i}
            </span>
            {event && (
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-current" style={{ color: event.type === 'islamic' ? '#10b981' : event.type === 'hindu' ? '#f97316' : event.type === 'christian' ? '#a855f7' : '#3b82f6' }}></span>
            )}
          </div>
          
          {event && (
            <div className="hidden md:block mt-1">
              <div className={`text-[10px] leading-tight px-1.5 py-0.5 rounded border truncate ${EVENT_COLORS[event.type]}`}>
                {event.name}
              </div>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="bg-surface border border-border-dim p-4 md:p-6 rounded-3xl shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg md:text-xl font-bold font-display flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#ff2a2a]" />
          Live Global Calendar
        </h2>
        <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 bg-[#111] p-1 rounded-xl border border-[#222]">
          <button onClick={prevMonth} className="p-2 hover:bg-[#222] rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-sm md:text-base w-28 md:w-32 text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-[#222] rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-[10px] md:text-xs font-medium text-gray-500 py-1 md:py-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {renderDays()}
      </div>

      <AnimatePresence>
        {selectedDate && GLOBAL_EVENTS[selectedDate] && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`mt-4 p-4 rounded-xl border ${EVENT_COLORS[GLOBAL_EVENTS[selectedDate].type]} flex items-start gap-3`}
          >
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold">{GLOBAL_EVENTS[selectedDate].name}</h4>
              <p className="text-sm opacity-80 mt-1">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
