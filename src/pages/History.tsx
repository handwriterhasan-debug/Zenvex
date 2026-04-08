import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, History as HistoryIcon, ChevronLeft, ChevronRight, CheckCircle2, Circle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, subMonths, addMonths } from 'date-fns';

export default function History() {
  const { history, currentDayData } = useAppContext();
  const allData = [...history, currentDayData];

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Group data by month
  const monthlyDataMap: Record<string, { score: number, tasks: number, habits: number, days: number }> = {};
  
  allData.forEach(day => {
    const date = new Date(day.date);
    const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    
    if (!monthlyDataMap[monthKey]) {
      monthlyDataMap[monthKey] = { score: 0, tasks: 0, habits: 0, days: 0 };
    }
    
    const totalTasks = (day.schedule || []).length;
    const completedTasks = (day.schedule || []).filter(s => s.status === 'completed').length;
    const totalHabits = (day.habits || []).length;
    const completedHabits = (day.habits || []).filter(h => h.completedToday).length;
    
    const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 50 : 0;
    const habitScore = totalHabits > 0 ? (completedHabits / totalHabits) * 50 : 0;
    
    monthlyDataMap[monthKey].score += (taskScore + habitScore);
    monthlyDataMap[monthKey].tasks += completedTasks;
    monthlyDataMap[monthKey].habits += (totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0);
    monthlyDataMap[monthKey].days += 1;
  });

  const pastMonths = Object.keys(monthlyDataMap).map(month => {
    const data = monthlyDataMap[month];
    return {
      month,
      score: Math.round(data.score / data.days),
      tasks: data.tasks,
      habits: `${Math.round(data.habits / data.days)}%`
    };
  }).reverse(); // Show newest first

  // Calculate yearly data
  const monthlyScores: Record<string, { total: number, count: number }> = {};
  allData.forEach(day => {
    const dateObj = new Date(day.date);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    
    const totalTasks = (day.schedule || []).length;
    const completedTasks = (day.schedule || []).filter(s => s.status === 'completed').length;
    const totalHabits = (day.habits || []).length;
    const completedHabits = (day.habits || []).filter(h => h.completedToday).length;
    
    const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 50 : 0;
    const habitScore = totalHabits > 0 ? (completedHabits / totalHabits) * 50 : 0;
    const score = taskScore + habitScore;

    if (!monthlyScores[monthKey]) {
      monthlyScores[monthKey] = { total: 0, count: 0 };
    }
    monthlyScores[monthKey].total += score;
    monthlyScores[monthKey].count += 1;
  });

  const yearlyData = Object.entries(monthlyScores)
    .sort(([keyA], [keyB]) => (keyA || '').localeCompare(keyB || ''))
    .map(([key, data]) => {
      const [year, month] = key.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1);
      return {
        month: dateObj.toLocaleDateString('en-US', { month: 'short' }),
        score: Math.round(data.total / data.count)
      };
    });

  if (yearlyData.length === 0) {
    yearlyData.push({ month: 'Jan', score: 0 });
  } else if (yearlyData.length === 1) {
    const prevMonthDate = subMonths(new Date(), 1);
    const prevMonth = prevMonthDate.toLocaleDateString('en-US', { month: 'short' });
    yearlyData.unshift({ month: prevMonth, score: 0 });
  }

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getDayData = (date: Date) => {
    return allData.find(d => {
      // Parse the stored date string (YYYY-MM-DD)
      const parts = d.date.split('-');
      if (parts.length === 3) {
        const dDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return isSameDay(dDate, date);
      }
      return false;
    });
  };

  const selectedDayData = selectedDate ? getDayData(selectedDate) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">History & Backup</h1>
          <p className="text-gray-400">Look back at how far you've come.</p>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-display">Schedule Calendar</h2>
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs sm:text-sm text-gray-500 font-medium py-1 sm:py-2">
              <span className="sm:hidden">{day}</span>
              <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2 opacity-0"></div>
          ))}
          
          {daysInMonth.map(date => {
            const dayData = getDayData(date);
            const hasData = dayData && ((dayData.schedule || []).length > 0 || (dayData.habits || []).length > 0);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            
            let completionRate = 0;
            if (hasData && dayData) {
              const total = (dayData.schedule || []).length + (dayData.habits || []).length;
              const completed = (dayData.schedule || []).filter(s => s.status === 'completed').length + 
                               (dayData.habits || []).filter(h => h.completedToday).length;
              completionRate = total > 0 ? completed / total : 0;
            }

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`
                  relative p-2 h-14 rounded-xl flex flex-col items-center justify-center transition-all
                  ${!hasData ? 'opacity-50 hover:bg-white/5 cursor-pointer' : 'hover:bg-white/10 cursor-pointer'}
                  ${isSelected ? 'ring-2 ring-accent-primary bg-accent-primary-dim' : 'bg-surface border border-border-dim'}
                  ${isToday && !isSelected ? 'border-rose-500/50' : ''}
                `}
              >
                <span className={`text-sm font-medium ${isToday ? 'text-rose-500' : 'text-white'}`}>
                  {format(date, 'd')}
                </span>
                {hasData && (
                  <div className="absolute bottom-2 flex gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${completionRate === 1 ? 'bg-emerald-500' : completionRate > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Modal/Section */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-surface border border-accent-primary-border rounded-3xl p-6 relative shadow-sm">
              <button 
                onClick={() => setSelectedDate(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-500" />
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </h3>

              {!selectedDayData || ((selectedDayData.schedule || []).length === 0 && (selectedDayData.habits || []).length === 0) ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">You didn't do anything on this day.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Schedule */}
                  <div>
                    <h4 className="font-bold text-gray-300 mb-4 flex items-center gap-2">
                      <HistoryIcon className="w-4 h-4" /> Schedule
                    </h4>
                    {(selectedDayData.schedule || []).length > 0 ? (
                      <div className="space-y-3">
                        {(selectedDayData.schedule || []).map((task, i) => (
                          <div key={`${task.id}-${i}`} className="flex items-center gap-3 p-3 bg-surface border border-border-dim rounded-2xl shadow-sm">
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-600 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}`}>
                                {task.task}
                              </p>
                              <p className="text-xs text-gray-500">
                                {task.timeStart} - {task.timeEnd} • {task.category}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No tasks scheduled for this day.</p>
                    )}
                  </div>

                  {/* Habits */}
                  <div>
                    <h4 className="font-bold text-gray-300 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Habits
                    </h4>
                    {(selectedDayData.habits || []).length > 0 ? (
                      <div className="space-y-3">
                        {(selectedDayData.habits || []).map((habit, i) => (
                          <div key={`${habit.id}-${i}`} className="flex items-center gap-3 p-3 bg-surface border border-border-dim rounded-2xl shadow-sm">
                            {habit.completedToday ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-600 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${habit.completedToday ? 'text-gray-400 line-through' : 'text-white'}`}>
                                {habit.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Streak: {habit.streak} days
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No habits tracked for this day.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-display">Yearly Productivity Chart</h2>
          <HistoryIcon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="month" stroke="#666" tick={{fill: '#666'}} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" tick={{fill: '#666'}} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip 
                cursor={{fill: '#1a1a1a'}}
                contentStyle={{backgroundColor: '#111', borderColor: '#333', borderRadius: '8px', color: '#fff'}}
              />
              <Bar dataKey="score" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pastMonths.length > 0 ? pastMonths.map((record, i) => (
          <div key={i} className="bg-surface border border-border-dim rounded-3xl p-6 hover:border-accent-primary-border transition-colors shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/5 text-gray-400">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{record.month}</h3>
                <p className="text-sm text-gray-400">Monthly Report</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-gray-400">Avg Discipline Score</span>
                <span className="font-display font-bold text-rose-500">{record.score}%</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-gray-400">Tasks Done</span>
                <span className="font-bold">{record.tasks}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Avg Habits Completion</span>
                <span className="font-bold">{record.habits}</span>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-3 text-center py-10 text-gray-500 border border-dashed border-[#333] rounded-xl">
            No history data available yet. Complete your daily tasks to see reports here.
          </div>
        )}
      </div>
    </motion.div>
  );
}
