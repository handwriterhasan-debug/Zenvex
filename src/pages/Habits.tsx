import { motion, AnimatePresence } from 'motion/react';
import { Plus, Flame, Target, Trophy, CheckCircle2, Edit2, X, Trash2, Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function Habits() {
  const { currentDayData, addHabit, updateHabit, toggleHabit, deleteHabit, history } = useAppContext();
  const { habits } = currentDayData;
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState({ name: '', category: 'Fitness', target: 30 });

  const categories = [
    { name: 'Work', color: 'bg-blue-500' },
    { name: 'Fitness', color: 'bg-emerald-500' },
    { name: 'Social', color: 'bg-amber-500' },
    { name: 'Rest', color: 'bg-gray-500' },
    { name: 'Research', color: 'bg-purple-500' },
    { name: 'Religious', color: 'bg-indigo-500' },
    { name: 'Spiritual', color: 'bg-teal-500' },
    { name: 'Hanging out', color: 'bg-pink-500' },
    { name: 'Games', color: 'bg-red-500' },
    { name: 'Reading', color: 'bg-orange-500' }
  ];

  const getCategoryEmoji = (category: string) => {
    switch (category.toLowerCase()) {
      case 'work': return '💼';
      case 'fitness': return '🏋️‍♂️';
      case 'social': return '👥';
      case 'rest': return '😴';
      case 'research': return '🔬';
      case 'religious': return '🕌';
      case 'spiritual': return '🧘‍♂️';
      case 'hanging out': return '🍻';
      case 'games': return '🎮';
      case 'reading': return '📚';
      default: return '🎯';
    }
  };

  const [completedHabitStats, setCompletedHabitStats] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAdd = () => {
    if (newHabit.name) {
      if (editingId) {
        updateHabit(editingId, {
          name: newHabit.name,
          category: newHabit.category,
          target: newHabit.target,
          color: categories.find(c => c.name === newHabit.category)?.color || 'bg-blue-500'
        });
        setEditingId(null);
      } else {
        addHabit({
          id: crypto.randomUUID(),
          name: newHabit.name,
          category: newHabit.category,
          streak: 0,
          target: newHabit.target,
          completedToday: false,
          color: categories.find(c => c.name === newHabit.category)?.color || 'bg-blue-500',
          startDate: currentDayData.date
        });
      }
      setIsAdding(false);
      setNewHabit({ name: '', category: 'Fitness', target: 30 });
    } else {
      showToast('Please enter a habit name');
    }
  };

  const handleEdit = (habit: any) => {
    setNewHabit({ name: habit.name, category: habit.category, target: habit.target });
    setEditingId(habit.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewHabit({ name: '', category: 'Fitness', target: 30 });
  };

  // Calculate stats
  const longestStreak = Math.max(0, ...habits.map(h => h.streak));
  
  // Calculate overall completion rate across all habits and history
  let totalPossible = habits.length;
  let totalCompleted = habits.filter(h => h.completedToday).length;
  
  history.forEach(day => {
    totalPossible += (day.habits || []).length;
    totalCompleted += (day.habits || []).filter(h => h.completedToday).length;
  });
  
  const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

  // Generate calendar data based on habit target and start date
  const generateCalendar = (habit: any) => {
    const calendar = [];
    const startDateStr = habit.startDate || currentDayData.date;
    const [year, month, day] = startDateStr.split('-').map(Number);
    const baseDate = new Date(year, month - 1, day);

    const [cYear, cMonth, cDay] = currentDayData.date.split('-').map(Number);
    const currentDateObj = new Date(cYear, cMonth - 1, cDay);

    const targetDays = Number(habit.target) || 30;

    for (let i = 0; i < targetDays; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      
      const isToday = dateStr === currentDayData.date;
      const isFuture = d > currentDateObj;
      const isPast = d < currentDateObj;

      let completed = false;
      let exists = false;

      if (isToday) {
        completed = habit.completedToday;
        exists = true;
      } else if (isPast) {
        const historyDay = history.find(h => h.date === dateStr);
        const habitInHistory = (historyDay?.habits || []).find(h => h.id === habit.id);
        completed = habitInHistory ? habitInHistory.completedToday : false;
        exists = !!habitInHistory;
      }

      calendar.push({
        dateStr,
        day: d.getDate(),
        completed,
        isPast,
        isFuture,
        isToday,
        exists
      });
    }
    return calendar;
  };

  const handleToggle = (habit: any, dateStr?: string) => {
    const calendar = generateCalendar(habit);
    const currentlyCompleted = calendar.filter(d => d.completed).length;
    
    const targetDay = calendar.find(d => d.dateStr === (dateStr || currentDayData.date));
    const willBeCompleted = targetDay ? !targetDay.completed : false;
    
    const newCompletedCount = currentlyCompleted + (willBeCompleted ? 1 : -1);
    
    toggleHabit(habit.id, dateStr);

    if (newCompletedCount === habit.target && willBeCompleted) {
      const daysPassed = calendar.filter(d => d.isPast || d.isToday).length;
      const score = Math.round((newCompletedCount / habit.target) * 100);
      const discipline = daysPassed === habit.target ? "Perfect" : daysPassed < habit.target * 1.2 ? "Excellent" : "Good";
      
      setCompletedHabitStats({
        ...habit,
        score,
        discipline,
        daysTaken: daysPassed
      });
    }
  };

  const habitChartData = [...history.slice(-6), currentDayData].map(day => {
    const completed = (day.habits || []).filter(h => h.completedToday).length;
    const total = (day.habits || []).length;
    const dateObj = new Date(day.date);
    return {
      name: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      completed,
      total
    };
  });

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Habits</h1>
          <p className="text-gray-400">Build momentum. Never break the chain.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setNewHabit({ name: '', category: 'Fitness', target: 30 });
            setIsAdding(true);
          }}
          className="bg-white text-black hover:opacity-80 px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-white/10"
        >
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-accent-primary-dim blur-[40px] md:blur-[50px] rounded-full pointer-events-none"></div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-2 relative z-10">
            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-accent-primary-dim text-accent-primary border border-accent-primary-border self-start md:self-auto">
              <Flame className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-gray-500 text-xs md:text-sm font-medium">Longest Streak</h3>
              <p className="text-2xl md:text-3xl font-display font-bold text-white">{longestStreak} <span className="text-sm md:text-lg text-gray-500 font-normal">Days</span></p>
            </div>
          </div>
        </div>
        
        <div className="bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-emerald-500/10 blur-[40px] md:blur-[50px] rounded-full pointer-events-none"></div>
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-2 relative z-10">
            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start md:self-auto">
              <Target className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-gray-500 text-xs md:text-sm font-medium">Completion Rate</h3>
              <p className="text-2xl md:text-3xl font-display font-bold text-white">{completionRate}<span className="text-sm md:text-lg text-gray-500 font-normal">%</span></p>
            </div>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-amber-500/10 blur-[40px] md:blur-[50px] rounded-full pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 mb-2 relative z-10">
            <div className="p-2 md:p-3 rounded-xl md:rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 self-start sm:self-auto">
              <Trophy className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-gray-500 text-xs md:text-sm font-medium">Badges Earned</h3>
              <p className="text-2xl md:text-3xl font-display font-bold text-white">{Math.floor(longestStreak / 7)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Habit Completion Chart */}
      <div className="bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
        <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500" />
          Completion History (Last 7 Days)
        </h2>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={habitChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
              <RechartsTooltip 
                cursor={{ fill: '#222' }}
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
              />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="total" name="Total Habits" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-border-dim rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-surface-light border border-border-dim flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2 text-text-main">No habits yet</h3>
            <p className="text-text-muted">Start building your future by adding a new habit.</p>
          </div>
        ) : habits.map((habit, i) => (
          <div key={`${habit.id}-${i}`} className="bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-4 md:p-6 relative group shadow-sm hover:border-accent-primary-border transition-all">
            <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-1 md:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEdit(habit)}
                className="p-1.5 md:p-2 bg-surface-light hover:bg-surface-hover rounded-lg md:rounded-xl text-text-muted hover:text-text-main transition-colors"
                title="Edit Habit"
              >
                <Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <button 
                onClick={() => deleteHabit(habit.id)}
                className="p-1.5 md:p-2 bg-surface-light hover:bg-accent-primary-dim rounded-lg md:rounded-xl text-text-muted hover:text-accent-primary transition-colors"
                title="Delete Habit"
              >
                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="flex items-center gap-4 md:gap-5 pr-16 md:pr-0">
                <div className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-2xl bg-surface-light border border-border-dim flex items-center justify-center font-display font-bold text-xl md:text-2xl ${habit.color.replace('bg-', 'text-').replace('500', '500')}`}>
                  {habit.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg md:text-xl font-bold tracking-tight truncate text-text-main">{habit.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-text-muted mt-1 md:mt-1.5 font-medium">
                    <span className="bg-white/5 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md">{habit.category}</span>
                    <span className="flex items-center gap-1 md:gap-1.5 text-accent-primary bg-accent-primary-dim px-2 py-0.5 md:px-2.5 md:py-1 rounded-md">
                      <Flame className="w-3 md:w-3.5 h-3 md:h-3.5" /> {habit.streak} day streak
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto">
                <div className="text-left md:text-right flex items-center md:block gap-2 md:gap-0">
                  <div className="text-xs md:text-sm text-gray-500 md:mb-1 font-medium">Target:</div>
                  <div className="font-mono font-bold text-base md:text-lg">{habit.target} <span className="text-xs md:text-sm text-gray-500 font-sans font-normal">Days</span></div>
                </div>
                <button 
                  onClick={() => handleToggle(habit)}
                  className={`w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-xl md:rounded-2xl border transition-all flex items-center justify-center text-xl md:text-2xl ${
                    habit.completedToday 
                      ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                      : 'bg-black/40 border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 opacity-50 grayscale hover:grayscale-0 hover:opacity-100'
                  }`}
                  title={habit.completedToday ? "Mark as incomplete" : "Mark as complete"}
                >
                  {getCategoryEmoji(habit.category)}
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-wrap gap-1.5 md:gap-2 pb-2">
              {generateCalendar(habit).map((day, i) => {
                let stateClass = '';
                if (day.completed) {
                  stateClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30';
                } else if (day.isFuture) {
                  stateClass = 'bg-black/20 text-gray-700 border-white/5 opacity-50 cursor-not-allowed';
                } else if (day.isPast) {
                  stateClass = 'bg-accent-primary-dim text-accent-primary border-accent-primary-border hover:bg-accent-primary-dim';
                } else {
                  stateClass = 'bg-black/40 text-gray-400 border-white/10 hover:border-white/20';
                }

                return (
                  <button 
                    key={day.dateStr} 
                    onClick={() => !day.isFuture && handleToggle(habit, day.dateStr)}
                    disabled={day.isFuture}
                    className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-xs md:text-sm font-mono border transition-colors ${stateClass}`}
                    title={`${day.dateStr}: ${day.completed ? 'Completed' : day.isFuture ? 'Future' : day.isPast ? 'Missed' : 'Pending'}`}
                  >
                    {day.day}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      </motion.div>

      {/* Completion Modal */}
      <AnimatePresence>
        {completedHabitStats && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-surface border border-border-dim p-8 rounded-3xl max-w-md w-full text-center relative overflow-hidden shadow-lg"
            >
              
              <div className="w-24 h-24 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 relative z-10">
                <Trophy className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-display font-bold tracking-tight text-white mb-3 relative z-10">Challenge Completed!</h2>
              <p className="text-gray-400 mb-8 relative z-10">You successfully completed your target for <strong className="text-white font-semibold">{completedHabitStats.name}</strong>.</p>
              
              <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <div className="text-sm text-gray-500 mb-1 font-medium">Score</div>
                  <div className="text-2xl font-display font-bold text-emerald-400">{completedHabitStats.score}%</div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <div className="text-sm text-gray-500 mb-1 font-medium">Target</div>
                  <div className="text-2xl font-display font-bold text-white">{completedHabitStats.target}d</div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <div className="text-sm text-gray-500 mb-1 font-medium">Discipline</div>
                  <div className="text-lg font-display font-bold text-amber-400">{completedHabitStats.discipline}</div>
                </div>
              </div>
              
              <button 
                onClick={() => setCompletedHabitStats(null)}
                className="w-full bg-white text-black hover:opacity-80 font-bold py-3.5 rounded-xl transition-colors relative z-10"
              >
                Awesome!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 w-full max-w-md relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <button onClick={handleCancel} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold font-display text-xl mb-6">{editingId ? 'Edit Habit' : 'Add New Habit'}</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Habit Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Read 10 pages" 
                    value={newHabit.name}
                    onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                  <select 
                    value={newHabit.category}
                    onChange={e => setNewHabit({...newHabit, category: e.target.value})}
                    className="w-full bg-surface-light border border-border-dim rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent-primary-border transition-colors appearance-none"
                  >
                    {categories.map(c => <option key={c.name} value={c.name} className="bg-surface text-text-main">{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Target Days</label>
                  <input 
                    type="number" 
                    placeholder="e.g., 30" 
                    value={newHabit.target}
                    onChange={e => setNewHabit({...newHabit, target: parseInt(e.target.value) || 30})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button onClick={handleCancel} className="px-6 py-2.5 text-gray-400 hover:text-white font-medium transition-colors">Cancel</button>
                <button onClick={handleAdd} className="bg-white text-black hover:opacity-80 px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-white/10">
                  {editingId ? 'Update Habit' : 'Save Habit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 right-8 bg-[#0a0a0a] border border-white/10 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
