import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, CheckCircle, Clock, Activity, DollarSign, Info, Plus, PieChart as PieChartIcon, Sparkles, BrainCircuit, Calendar, TrendingUp, Play, Pause, BookOpen } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link, useOutletContext } from 'react-router';
import { formatTime12Hour } from '../utils/timeUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '../supabaseClient';

export default function Dashboard() {
  const { userSettings, currentDayData, userProfile, history } = useAppContext();
  const { schedule, habits, expenses, notes } = currentDayData;
  const { showTimer, setShowTimer, timeLeft, setTimeLeft, isTimerRunning, setIsTimerRunning } = useOutletContext<any>() || {};

  const [timeFilter, setTimeFilter] = useState('Today');
  const filters = ['Today', 'This Week', 'Month', '6 Months', 'Yearly'];

  // Calculate work hours helper
  const calculateHours = (start: string, end: string) => {
    if (!start || !end || typeof start !== 'string' || typeof end !== 'string') return 0;
    if (start.toLowerCase().includes('am') || start.toLowerCase().includes('pm')) return 0;

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
    
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60;
    return diff / 60;
  };

  // Combine history and current day for filtering
  const allData = [...history.filter(h => h.date !== currentDayData.date), currentDayData];

  const getFilteredData = () => {
    const currentDate = new Date(currentDayData.date);

    return allData.filter(day => {
      const dayDate = new Date(day.date);
      const diffTime = Math.abs(currentDate.getTime() - dayDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (timeFilter) {
        case 'Today':
          return day.date === currentDayData.date;
        case 'This Week':
          return diffDays <= 7;
        case 'Month':
          return diffDays <= 30;
        case '6 Months':
          return diffDays <= 180;
        case 'Yearly':
          return diffDays <= 365;
        default:
          return day.date === currentDayData.date;
      }
    });
  };

  const filteredData = getFilteredData();

  // Calculate totals based on filtered data
  let absoluteTotalTasks = 0;
  let absoluteTotalHabits = 0;
  let absoluteTotalExpenses = 0;
  let absoluteTotalNotes = 0;

  filteredData.forEach(day => {
    absoluteTotalTasks += (day.schedule || []).length;
    absoluteTotalHabits += (day.habits || []).length;
    absoluteTotalExpenses += (day.expenses || []).filter(e => e.type === 'expense').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    absoluteTotalNotes += (day.notes || []).length;
  });

  let completedTasks = 0;
  let totalTasks = 0;
  let completedHabits = 0;
  let totalHabits = 0;
  let totalExpenses = 0;
  let totalPlannedHours = 0;
  let totalCompletedHours = 0;
  let hasValidExcuse = false;
  const hoursByCategory: Record<string, number> = {};

  filteredData.forEach(day => {
    completedTasks += (day.schedule || []).filter(s => s.status === 'completed' || s.status === 'incomplete').length;
    totalTasks += (day.schedule || []).length;
    completedHabits += (day.habits || []).filter(h => h.completedToday).length;
    totalHabits += (day.habits || []).length;
    
    if ((day.notes || []).some(n => n.isExcuse)) {
      hasValidExcuse = true;
    }

    (day.schedule || []).forEach(curr => {
      const plannedHours = calculateHours(curr.timeStart, curr.timeEnd);
      totalPlannedHours += plannedHours;
      
      if (curr.status === 'completed' || curr.status === 'incomplete') {
        const hours = curr.actualHours != null ? Number(curr.actualHours) : plannedHours;
        totalCompletedHours += hours;
        const cat = curr.category || 'Uncategorized';
        hoursByCategory[cat] = (hoursByCategory[cat] || 0) + hours;
      }
    });

    totalExpenses += (day.expenses || [])
      .filter(e => e.type === 'expense')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  });

  const workHours = hoursByCategory['Work'] || 0;
  
  // Calculate discipline score
  let taskScore = 0;
  let habitScore = 0;
  
  if (totalPlannedHours > 0 && totalHabits > 0) {
    taskScore = (totalCompletedHours / totalPlannedHours) * 50;
    habitScore = (completedHabits / totalHabits) * 50;
  } else if (totalPlannedHours > 0) {
    taskScore = (totalCompletedHours / totalPlannedHours) * 100;
  } else if (totalHabits > 0) {
    habitScore = (completedHabits / totalHabits) * 100;
  } else {
    taskScore = 100; // If nothing to do, you're perfect!
  }
  
  if (hasValidExcuse) {
    if (totalPlannedHours > 0 && totalHabits > 0) {
      taskScore = Math.max(taskScore, 40);
      habitScore = Math.max(habitScore, 40);
    } else if (totalPlannedHours > 0) {
      taskScore = Math.max(taskScore, 80);
    } else if (totalHabits > 0) {
      habitScore = Math.max(habitScore, 80);
    }
  }
  
  const disciplineScore = Math.round(taskScore + habitScore);

  // Chart Data Generation
  const generateChartData = (metric: 'discipline' | 'tasks' | 'hours' | 'habits' | 'expenses' | 'notes') => {
    // Always use real data, aggregate by day
    let dataToUse = filteredData;
    if (timeFilter === 'Today') {
      // For 'Today', show the last 7 days to provide a trend context
      dataToUse = history.slice(-7);
      if (dataToUse.length === 0 || dataToUse[dataToUse.length - 1].date !== currentDayData.date) {
        dataToUse = [...dataToUse, currentDayData];
      }
    } else {
      dataToUse = filteredData.slice(-10);
    }

    let chartData = dataToUse.map((day, index) => {
      const dTasks = (day.schedule || []).filter(s => s.status === 'completed' || s.status === 'incomplete').length;
      const dTotalTasks = (day.schedule || []).length;
      const dHabits = (day.habits || []).filter(h => h.completedToday).length;
      const dTotalHabits = (day.habits || []).length;
      const dNotes = (day.notes || []).length;
      
      let dTaskScore = 0;
      let dHabitScore = 0;
      
      if (dTotalTasks > 0 && dTotalHabits > 0) {
        dTaskScore = (dTasks / dTotalTasks) * 50;
        dHabitScore = (dHabits / dTotalHabits) * 50;
      } else if (dTotalTasks > 0) {
        dTaskScore = (dTasks / dTotalTasks) * 100;
      } else if (dTotalHabits > 0) {
        dHabitScore = (dHabits / dTotalHabits) * 100;
      } else {
        dTaskScore = 100;
      }
      
      let dScore = Math.round(dTaskScore + dHabitScore);
      
      if ((day.notes || []).some(n => n.isExcuse)) {
        if (dTotalTasks > 0 && dTotalHabits > 0) {
          dScore = Math.max(dScore, 80); // 40 + 40
        } else {
          dScore = Math.max(dScore, 80);
        }
      }

      let dHours = 0;
      (day.schedule || []).filter(s => (s.status === 'completed' || s.status === 'incomplete') && s.category === 'Work').forEach(curr => {
        dHours += curr.actualHours != null ? Number(curr.actualHours) : calculateHours(curr.timeStart, curr.timeEnd);
      });

      const dExpenses = (day.expenses || []).filter(e => e.type === 'expense').reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      const dateObj = new Date(day.date);
      const name = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      return {
        id: `day-${index}-${day.date}`,
        name: name,
        value: metric === 'discipline' ? dScore : metric === 'tasks' ? dTasks : metric === 'hours' ? dHours : metric === 'habits' ? dHabits : metric === 'notes' ? dNotes : dExpenses
      };
    });

    if (chartData.length === 1) {
      // Duplicate the single data point to draw a line, but keep the same value
      chartData = [
        { ...chartData[0], id: chartData[0].id + '-start', name: 'Start' },
        { ...chartData[0], id: chartData[0].id + '-end', name: 'Now' }
      ];
    }

    return chartData;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Focus Timer Dashboard */}
      {(showTimer || isTimerRunning || (timeLeft > 0 && timeLeft !== 25 * 60)) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden bg-black border border-accent-primary-border shadow-[0_0_50px_rgba(var(--accent-primary-rgb),0.15)] mb-8 p-8 md:p-16 flex flex-col items-center justify-center text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent-primary-dim)_0%,transparent_70%)] pointer-events-none" />
          <h2 className="text-accent-primary font-bold tracking-widest uppercase text-sm md:text-base mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Focus Session Active
          </h2>
          <div className="text-7xl md:text-9xl font-mono font-bold tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] mb-8">
            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 z-10 w-full sm:w-auto">
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-accent-primary hover:bg-accent-primary-hover text-white font-bold text-lg transition-all shadow-lg shadow-accent-shadow hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              {isTimerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              {isTimerRunning ? 'Pause Focus' : 'Resume Focus'}
            </button>
            <button 
              onClick={() => { setIsTimerRunning(false); setTimeLeft(25 * 60); setShowTimer(false); }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-surface-light border border-border-dim hover:border-border-strong text-text-muted hover:text-text-main font-bold text-lg transition-all"
            >
              End Session
            </button>
          </div>
        </motion.div>
      )}

      {/* Hero / Lobby Section */}
      <div className="relative rounded-3xl overflow-visible bg-surface border border-border-dim shadow-sm mb-4 md:mb-8">
        <div className="relative z-10 p-4 sm:p-6 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-4 md:gap-8">
          <div className="max-w-2xl text-center lg:text-left w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-accent-primary-dim border border-accent-primary-border text-accent-primary text-[10px] md:text-xs font-bold mb-2 md:mb-6 uppercase tracking-widest"
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-accent-primary" /> Zenvex
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-clamp-h1 font-display font-bold mb-2 md:mb-6 tracking-tight leading-tight text-white"
            >
              Welcome back,<br/>{userSettings.name}
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-4 md:mb-8 max-w-xl border-l-4 border-accent-primary pl-3 md:pl-6 py-1 md:py-2 mx-auto lg:mx-0 hidden sm:block"
            >
              <p className="text-clamp-p text-text-muted leading-relaxed italic">
                "You are in danger of living a life so comfortable and soft, that you will die without ever realizing your true potential."
              </p>
              <p className="text-accent-primary font-bold mt-1 md:mt-2 tracking-wider uppercase text-[10px] md:text-sm">— David Goggins</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-row gap-2 md:gap-3 justify-center lg:justify-start w-full"
            >
              <Link to="/schedule" className="flex-1 sm:flex-none px-4 py-2.5 md:px-8 md:py-4 bg-accent-primary text-white rounded-xl md:rounded-2xl font-bold hover:bg-accent-primary-hover transition-all text-center text-sm md:text-base min-h-[44px] flex items-center justify-center">
                Start Day
              </Link>
              <Link to="/habits" className="flex-1 sm:flex-none px-4 py-2.5 md:px-8 md:py-4 bg-surface-hover text-text-main border border-border-dim rounded-xl md:rounded-2xl font-bold hover:bg-surface-light transition-all text-center text-sm md:text-base min-h-[44px] flex items-center justify-center">
                Habits
              </Link>
            </motion.div>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{ overflow: 'visible', border: 'none', outline: 'none' }}
            className="flex flex-col md:flex-row lg:flex-col gap-4 relative shrink-0 w-full md:w-auto items-center justify-center lg:items-start mt-4 lg:mt-0"
          >
            <div className="discipline-wrapper border-none outline-none w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 mx-auto md:mx-0 shrink-0 relative overflow-visible rounded-full">
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100" style={{ overflow: 'visible', border: 'none', outline: 'none' }}>
                <defs>
                  <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="blur1" />
                    <feGaussianBlur stdDeviation="8" result="blur2" />
                    <feComponentTransfer in="blur2" result="dimBlur2">
                      <feFuncA type="linear" slope="0.4" />
                    </feComponentTransfer>
                    <feComponentTransfer in="blur1" result="dimBlur1">
                      <feFuncA type="linear" slope="0.6" />
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode in="dimBlur2" />
                      <feMergeNode in="dimBlur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  className="text-accent-primary"
                  filter="url(#neon-glow)"
                  initial={{ strokeDasharray: "0 283" }}
                  animate={{ strokeDasharray: `${(disciplineScore / 100) * 283} 283` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 border-none outline-none">
                <div className="text-[20px] sm:text-[20px] md:text-3xl lg:text-4xl font-bold text-text-main tracking-tight drop-shadow-md leading-none flex items-center justify-center">{disciplineScore}%</div>
                <div className="text-[10px] md:text-[10px] lg:text-xs text-text-muted uppercase tracking-widest mt-1 font-bold leading-none flex items-center justify-center">Discipline</div>
              </div>
            </div>
            
            {/* Added Infographics */}
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 md:gap-4 w-full md:max-w-none mx-auto md:mx-0">
              <div className="bg-surface-light border border-border-dim rounded-xl md:rounded-2xl p-[12px] md:p-[16px] flex flex-col shadow-sm gap-2 w-full min-h-[80px]">
                <div className="flex items-center gap-1.5 w-full justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <div className="text-[10px] md:text-xs text-text-muted uppercase tracking-wider font-bold">Habits</div>
                  </div>
                  <div className="text-sm md:text-base font-bold text-text-main">{completedHabits}/{totalHabits}</div>
                </div>
                
                <div className="w-full flex-1 max-h-[160px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 mt-1 pr-1">
                  {habits.length === 0 ? (
                    <div className="text-gray-500 text-xs text-center py-2 italic flex-1 flex items-center justify-center">No habits yet</div>
                  ) : (
                    habits.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 py-0.5">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${h.completedToday ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                        <span className="text-[11px] sm:text-xs text-text-main truncate flex-1 leading-tight">{h.name}</span>
                        <span className="text-[9px] sm:text-[10px] text-text-muted shrink-0 bg-surface px-1.5 py-0.5 rounded border border-border-dim">{h.completedToday ? 'Done' : 'Open'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-surface-light border border-border-dim rounded-xl md:rounded-2xl p-[12px] md:p-[16px] flex flex-col shadow-sm gap-2 w-full min-h-[80px]">
                <div className="flex items-center gap-1.5 w-full justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-blue-500" />
                    <div className="text-[10px] md:text-xs text-text-muted uppercase tracking-wider font-bold">Tasks</div>
                  </div>
                  <div className="text-sm md:text-base font-bold text-text-main">{completedTasks}/{totalTasks}</div>
                </div>
                
                <div className="w-full flex-1 max-h-[160px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 mt-1 pr-1">
                  {(schedule || []).length === 0 ? (
                    <div className="text-gray-500 text-xs text-center py-2 italic flex-1 flex items-center justify-center">No tasks yet</div>
                  ) : (
                    (schedule || []).map((t, i) => (
                      <div key={i} className="flex items-center gap-2 py-0.5">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${t.status === 'completed' ? 'bg-blue-500' : t.status === 'incomplete' ? 'bg-red-500' : 'bg-gray-600'}`} />
                        <span className="text-[11px] sm:text-xs text-text-main truncate flex-1 leading-tight">{t.task}</span>
                        <span className="text-[9px] sm:text-[10px] text-text-muted shrink-0 bg-surface px-1.5 py-0.5 rounded border border-border-dim">
                          {t.status === 'completed' ? 'Done' : t.status === 'incomplete' ? 'Missed' : 'Open'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Analytics Header & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mt-12 mb-6">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-3">
          <Activity className="w-5 h-5 md:w-6 md:h-6 text-accent-primary" />
          Performance Analytics
        </h2>
        <div className="flex flex-wrap bg-surface border border-white/5 rounded-xl p-1 shadow-xl w-full md:w-auto">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`flex-1 md:flex-none px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                timeFilter === filter 
                  ? 'bg-white/10 text-white shadow-md' 
                  : 'text-text-faint hover:text-text-muted hover:bg-white/5'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-8">
        <MetricCard 
          title="Discipline Score" 
          value={`${disciplineScore}%`} 
          icon={Target} 
          accentColor="#39ff14"
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generateChartData('discipline')}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39ff14" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#39ff14" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff1a', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#39ff14' }} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="value" name="Score" stroke="#39ff14" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard 
          title="Total Tasks" 
          value={absoluteTotalTasks} 
          icon={CheckCircle} 
          accentColor="#1f8c0a"
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={generateChartData('tasks')}>
                <defs>
                  <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#39ff14" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#1f8c0a" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff1a', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#1f8c0a' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" name="Tasks" fill="url(#tasksGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard 
          title="Work Hours" 
          value={`${workHours.toFixed(1).replace(/\.0$/, '')}h`} 
          icon={Clock} 
          accentColor="#a3ff94"
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generateChartData('hours')}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a3ff94" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a3ff94" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff1a', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#a3ff94' }} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="value" name="Hours" stroke="#a3ff94" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard 
          title="Total Habits" 
          value={absoluteTotalHabits} 
          icon={Activity} 
          accentColor="#29b314"
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={generateChartData('habits')}>
                <defs>
                  <linearGradient id="habitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a3ff94" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#29b314" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff1a', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#29b314' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" name="Habits" fill="url(#habitsGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard 
          title="Total Expenses" 
          value={`${absoluteTotalExpenses} ${userSettings.currency || 'PKR'}`} 
          icon={DollarSign} 
          accentColor="#66ff4d"
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generateChartData('expenses')}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#66ff4d" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#66ff4d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff1a', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#66ff4d' }} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="value" name="Amount" stroke="#66ff4d" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard 
          title="Total Notes" 
          value={absoluteTotalNotes} 
          icon={BookOpen} 
          accentColor="#5ce638"
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={generateChartData('notes')}>
                <defs>
                  <linearGradient id="notesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5ce638" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#1f8c0a" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff1a', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: '#5ce638' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" name="Notes" fill="url(#notesGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
      </div>

      {/* Performance Overview Chart */}
      <div className="bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm relative overflow-hidden mb-8 group hover:border-accent-primary-border transition-all duration-500">
        <div className="absolute top-0 left-0 w-64 h-64 bg-accent-primary-dim rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4 relative z-10">
          <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight flex items-center gap-3">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-accent-primary" />
            Performance Overview
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-accent-primary shadow-[0_0_8px_rgba(57,255,20,0.5)]"></div>
              <span className="text-xs md:text-sm text-text-muted font-medium">Discipline Score</span>
            </div>
          </div>
        </div>
        <div className="h-48 sm:h-64 md:h-72 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={generateChartData('discipline')}>
              <defs>
                <linearGradient id="colorDisciplineMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#39ff14" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#39ff14" stopOpacity={0}/>
                </linearGradient>
                <filter id="areaGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
              <XAxis dataKey="name" stroke="#a3a3a3" tick={{ fill: '#a3a3a3', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#a3a3a3" tick={{ fill: '#a3a3a3', fontSize: 12, fontWeight: 500 }} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(10px)', borderColor: '#ffffff1a', borderRadius: '12px', padding: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }} 
                itemStyle={{ color: '#fff', fontWeight: 'bold' }} 
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} 
              />
              <Area type="monotone" dataKey="value" name="Discipline Score" stroke="#39ff14" strokeWidth={3} fillOpacity={1} fill="url(#colorDisciplineMain)" activeDot={{ r: 6, fill: '#39ff14', stroke: '#000', strokeWidth: 2 }} filter="url(#areaGlow)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-8 mt-4 md:mt-8">
        
        {/* Left Column - Schedule & Tasks */}
        <div className="lg:col-span-2 xl:col-span-2 space-y-4 md:space-y-8">
          <div className="bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight">Today's Schedule</h2>
              <Link to="/schedule" className="text-xs md:text-sm text-accent-primary hover:text-accent-primary-hover font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl bg-accent-primary-dim border border-accent-primary-border transition-colors">View All</Link>
            </div>
            
            <div className="space-y-3">
              {schedule.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-black/40">
                  <p className="text-gray-400 mb-4">Your schedule is empty for today.</p>
                  <Link to="/schedule" className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl hover:opacity-80 transition-colors font-semibold shadow-lg shadow-white/10">
                    <Plus className="w-4 h-4" /> Set Your Schedule
                  </Link>
                </div>
              ) : (
                schedule.map((item, i) => (
                  <div key={`${item.id}-${i}`} className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-surface border border-border-dim hover:border-accent-primary-border hover:bg-accent-primary-dim transition-all group">
                    <div className="w-auto sm:w-24 text-xs md:text-sm font-mono text-gray-400 bg-black/60 px-2 py-1 md:py-1.5 rounded-lg text-center border border-white/5 self-start sm:self-auto">{formatTime12Hour(item.timeStart)}</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white group-hover:text-accent-primary transition-colors text-sm md:text-base">{item.task}</h3>
                      <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider">{item.category}</span>
                    </div>
                    <div className="self-end sm:self-auto">
                      {item.status === 'completed' && <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(255,165,0,0.4)]" title="Completed"></div>}
                      {item.status === 'incomplete' && <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(255,0,0,0.4)] border border-red-400" title="Incomplete"></div>}
                      {item.status === 'in-progress' && <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-accent-primary shadow-[0_0_12px_rgba(57,255,20,0.4)] animate-pulse" title="In Progress"></div>}
                      {item.status === 'pending' && <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-700 border-2 border-gray-600" title="Pending"></div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Habits & AI Insights */}
        <div className="space-y-4 md:space-y-8">
          
          {userProfile.plan === 'Premium' && (
            <div className="bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-sm group hover:border-accent-primary-border transition-colors">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4 relative z-10">
                <div className="p-1.5 md:p-2 bg-accent-primary-dim border border-accent-primary-border rounded-lg md:rounded-xl">
                  <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-accent-primary" />
                </div>
                <h2 className="text-base md:text-lg font-bold font-display text-accent-primary tracking-tight">Premium Reward</h2>
              </div>
              <p className="text-text-muted text-xs md:text-sm leading-relaxed relative z-10">
                <strong className="text-text-main">Daily Goods:</strong> You've earned a +10% Productivity Boost badge for maintaining your streak! Keep up the excellent work as a Premium Planner.
              </p>
            </div>
          )}

          {/* AI Insight Card */}
          <div className="bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-4 sm:p-6 relative overflow-hidden shadow-sm group hover:border-accent-primary-border transition-colors">
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 bg-accent-primary-dim border border-accent-primary-border rounded-xl">
                <BrainCircuit className="w-5 h-5 text-accent-primary" />
              </div>
              <h2 className="text-lg font-bold font-display text-accent-primary tracking-tight">AI Insight</h2>
            </div>
            <p className="text-text-muted text-sm leading-relaxed relative z-10">
              {Object.keys(hoursByCategory).length > 0 ? (
                (() => {
                  const entries = Object.entries(hoursByCategory).sort(([, a], [, b]) => (b as number) - (a as number));
                  const topCategory = entries[0];
                  const totalHours = entries.reduce((sum, [, h]) => sum + (h as number), 0);
                  const percentage = Math.round(((topCategory[1] as number) / totalHours) * 100);
                  return <>You spend <strong className="text-white">{percentage}%</strong> of your time on {topCategory[0]}. Try splitting these tasks into shorter sessions to maintain a high discipline score.</>;
                })()
              ) : (
                <>Start completing tasks to receive personalized AI insights on your productivity and habits.</>
              )}
            </p>
          </div>

          {/* Habits Overview */}
          <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display tracking-tight">Habit Streaks</h2>
              <Link to="/habits" className="text-sm text-accent-primary hover:text-accent-primary-hover font-medium px-3 py-1 rounded-lg bg-accent-primary-dim border border-accent-primary-border transition-colors">Manage</Link>
            </div>
            <div className="space-y-6">
              {habits.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-black/40">
                  <p className="text-gray-400 text-sm mb-4">No habits set yet.</p>
                  <Link to="/habits" className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl hover:opacity-80 transition-colors text-sm font-semibold shadow-lg shadow-white/10">
                    <Plus className="w-4 h-4" /> Set Habits
                  </Link>
                </div>
              ) : (
                habits.map((habit, i) => (
                  <div key={`${habit.id}-${i}`} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-white group-hover:text-accent-primary transition-colors">{habit.name}</span>
                      <span className="text-gray-400 font-mono bg-black/40 border border-white/10 px-2 py-0.5 rounded-md">{habit.streak} days</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${habit.streak <= 0 ? 0 : Math.max(2, Math.min(100, (habit.streak / habit.target) * 100))}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={`h-full rounded-full ${habit.color.replace('bg-', 'bg-').replace('500', '400')} shadow-[0_0_10px_rgba(255,255,255,0.1)]`}
                      ></motion.div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Time Distribution */}
          <div className="bg-surface border border-border-dim rounded-3xl p-6 relative shadow-sm overflow-hidden min-h-[350px] group hover:border-accent-primary-border transition-all duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary-dim rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                Time Distribution <span className="text-xs text-accent-primary font-medium bg-accent-primary-dim px-2 py-0.5 rounded-full border border-accent-primary-border">({timeFilter})</span>
              </h2>
              <PieChartIcon className="w-5 h-5 text-accent-primary" />
            </div>
            
            {userProfile.plan === 'Free' ? (
              <div className="absolute inset-0 z-10 backdrop-blur-md bg-black/60 flex items-center justify-center rounded-3xl p-6">
                <div className="bg-surface border border-border-dim p-8 text-center max-w-sm w-full shadow-2xl rounded-3xl flex flex-col items-center">
                  <div className="w-16 h-16 bg-accent-primary-dim border border-accent-primary-border rounded-full flex items-center justify-center shadow-inner mb-4">
                    <PieChartIcon className="w-8 h-8 text-accent-primary" />
                  </div>
                  
                  <h3 className="font-bold mb-2 tracking-tight text-xl text-white">Smart Infographics Locked</h3>
                  <p className="text-sm text-text-muted mb-6 leading-relaxed">Upgrade to Pro to unlock beautiful data visualizations and advanced analytics.</p>
                  
                  <Link to="/subscription" className="w-full py-3 bg-white text-black rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors shadow-md">
                    Upgrade to Pro
                  </Link>
                </div>
              </div>
            ) : null}
            
            {Object.keys(hoursByCategory).length === 0 ? (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl bg-black/40">
                <p className="text-gray-400 text-sm">No tasks completed in this period.</p>
              </div>
            ) : (
              <>
                <div className="h-48 w-full mb-8 relative flex items-center justify-center">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 pt-2">
                    <span className="text-3xl font-bold font-display text-white tracking-tight drop-shadow-md">
                      {Object.values(hoursByCategory).reduce((a, b) => a + (b as number), 0).toFixed(1).replace(/\.0$/, '')}h
                    </span>
                    <span className="text-[10px] text-accent-primary uppercase tracking-[0.2em] mt-1 font-bold">Total Time</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {[
                          { start: '#39ff14', end: '#1f8c0a' },
                          { start: '#66ff4d', end: '#29b314' },
                          { start: '#99ff85', end: '#3ddb1f' },
                          { start: '#ccffbd', end: '#5ce638' },
                          { start: '#e6ffdb', end: '#7fe864' },
                          { start: '#ffffff', end: '#a2ed8f' }
                        ].map((c, i) => (
                          <linearGradient key={`grad-${i}`} id={`dashPieGrad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={c.start} />
                            <stop offset="100%" stopColor={c.end} />
                          </linearGradient>
                        ))}
                        <filter id="pieGlowDash" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="4" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      <Pie
                        data={Object.entries(hoursByCategory).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={6}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={12}
                        animationBegin={0}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      >
                        {Object.entries(hoursByCategory).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#dashPieGrad-${index % 6})`} filter="url(#pieGlowDash)" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-strong)', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                        formatter={(value: number) => [`${value.toFixed(1).replace(/\.0$/, '')}h`, 'Time']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {Object.entries(hoursByCategory)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([category, hours], index) => {
                      const scheme = ['#39ff14', '#66ff4d', '#99ff85', '#ccffbd', '#e6ffdb', '#ffffff'];
                      const color = scheme[index % scheme.length];
                      return (
                      <div key={category} className="flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-border-dim hover:border-accent-primary-border hover:bg-accent-primary-dim transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-3.5 h-3.5 rounded-full shadow-md" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}66` }}></div>
                          <span className="text-[15px] font-semibold text-white tracking-wide">{category}</span>
                        </div>
                        <span className="text-sm font-mono font-medium text-white bg-black/60 border border-white/10 px-3 py-1 rounded-lg">{(hours as number).toFixed(1).replace(/\.0$/, '')}h</span>
                      </div>
                    )})}
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-4 sm:p-6 shadow-sm relative overflow-hidden mt-4 md:mt-8">
            <h2 className="text-lg md:text-xl font-bold font-display mb-4 tracking-tight">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <Link to="/notes" className="flex flex-col items-center justify-center p-4 md:p-6 rounded-xl md:rounded-2xl bg-surface border border-border-dim hover:border-accent-primary-border hover:bg-accent-primary-dim transition-all group">
                <Plus className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mb-2 md:mb-3 group-hover:text-accent-primary transition-colors group-hover:scale-110" />
                <span className="text-xs md:text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">Add Note</span>
              </Link>
              <Link to="/expenses" className="flex flex-col items-center justify-center p-4 md:p-6 rounded-xl md:rounded-2xl bg-surface border border-border-dim hover:border-accent-primary-border hover:bg-accent-primary-dim transition-all group">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mb-2 md:mb-3 group-hover:text-accent-primary transition-colors group-hover:scale-110" />
                <span className="text-xs md:text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">Log Expense</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ title, value, icon: Icon, colorClass, chart, accentColor = '#0a84ff' }: any) {
  return (
    <div className="relative p-4 md:p-6 rounded-2xl md:rounded-3xl bg-surface border border-border-dim overflow-hidden group hover:border-accent-primary-border transition-all duration-500 shadow-sm">
      <div 
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] opacity-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-30 transform translate-x-1/2 -translate-y-1/2"
        style={{ backgroundColor: accentColor }}
      ></div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <div>
            <h3 className="font-medium text-gray-500 text-[10px] md:text-xs uppercase tracking-widest mb-1">{title}</h3>
            <div className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">{value}</div>
          </div>
          <div className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-surface/50 border border-border-dim shadow-inner backdrop-blur-sm relative overflow-hidden group-hover:border-white/10 transition-colors">
            <Icon className="w-4 h-4 md:w-5 md:h-5 relative z-10" style={{ color: accentColor }} />
          </div>
        </div>
        {chart && (
          <div className="h-12 md:h-16 w-full mt-2 md:mt-4 -mx-1">
            {chart}
          </div>
        )}
      </div>
    </div>
  );
}
