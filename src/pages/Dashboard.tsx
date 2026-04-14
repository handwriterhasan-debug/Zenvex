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
  const allData = [...history, currentDayData];

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
  let hasValidExcuse = false;
  const hoursByCategory: Record<string, number> = {};

  filteredData.forEach(day => {
    completedTasks += (day.schedule || []).filter(s => s.status === 'completed').length;
    totalTasks += (day.schedule || []).length;
    completedHabits += (day.habits || []).filter(h => h.completedToday).length;
    totalHabits += (day.habits || []).length;
    
    if ((day.notes || []).some(n => n.isExcuse)) {
      hasValidExcuse = true;
    }

    (day.schedule || []).filter(s => s.status === 'completed').forEach(curr => {
      const hours = curr.actualHours !== undefined ? Number(curr.actualHours) : calculateHours(curr.timeStart, curr.timeEnd);
      const cat = curr.category || 'Uncategorized';
      hoursByCategory[cat] = (hoursByCategory[cat] || 0) + hours;
    });

    totalExpenses += (day.expenses || [])
      .filter(e => e.type === 'expense')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  });

  const workHours = hoursByCategory['Work'] || 0;
  
  // Calculate discipline score
  let taskScore = 0;
  let habitScore = 0;
  
  if (totalTasks > 0 && totalHabits > 0) {
    taskScore = (completedTasks / totalTasks) * 50;
    habitScore = (completedHabits / totalHabits) * 50;
  } else if (totalTasks > 0) {
    taskScore = (completedTasks / totalTasks) * 100;
  } else if (totalHabits > 0) {
    habitScore = (completedHabits / totalHabits) * 100;
  } else {
    taskScore = 100; // If nothing to do, you're perfect!
  }
  
  if (hasValidExcuse) {
    if (totalTasks > 0 && totalHabits > 0) {
      taskScore = Math.max(taskScore, 40);
      habitScore = Math.max(habitScore, 40);
    } else if (totalTasks > 0) {
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
      const dTasks = (day.schedule || []).filter(s => s.status === 'completed').length;
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
      (day.schedule || []).filter(s => s.status === 'completed' && s.category === 'Work').forEach(curr => {
        dHours += curr.actualHours !== undefined ? Number(curr.actualHours) : calculateHours(curr.timeStart, curr.timeEnd);
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
      <div className="relative rounded-3xl overflow-hidden bg-surface border border-border-dim shadow-sm mb-4 md:mb-8">
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
            className="flex flex-row lg:flex-col gap-4 md:gap-4 relative shrink-0 w-full md:w-auto items-center justify-center md:items-start mt-2 md:mt-0"
          >
            <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 relative flex items-center justify-center mx-auto md:mx-0 shrink-0">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  className="text-surface-hover"
                />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  strokeLinecap="round"
                  className="text-accent-primary drop-shadow-[0_0_8px_rgba(225,29,72,0.5)]"
                  initial={{ strokeDasharray: "0 283" }}
                  animate={{ strokeDasharray: `${(disciplineScore / 100) * 283} 283` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              <div className="text-center z-10">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-text-main tracking-tight drop-shadow-md">{disciplineScore}%</div>
                <div className="text-[8px] md:text-[10px] lg:text-xs text-text-muted uppercase tracking-widest mt-0.5 md:mt-1 font-bold">Discipline</div>
              </div>
            </div>
            
            {/* Added Infographics */}
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 md:gap-4 w-full max-w-[140px] sm:max-w-[180px] md:max-w-none mx-auto md:mx-0">
              <div className="bg-surface-light border border-border-dim rounded-xl md:rounded-2xl p-2 md:p-4 flex flex-col items-center justify-center shadow-sm gap-2 w-full">
                <div className="flex items-center gap-1.5 sm:mb-1 w-full justify-between sm:justify-center">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                    <div className="text-[10px] text-text-muted uppercase tracking-wider sm:hidden">Habits</div>
                  </div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold text-text-main sm:hidden">{completedHabits}/{totalHabits}</div>
                </div>
                <div className="text-sm sm:text-lg md:text-2xl font-bold text-text-main hidden sm:block">{completedHabits}/{totalHabits}</div>
                <div className="w-full bg-surface rounded-full h-1.5 md:h-2 mt-1 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completedHabits <= 0 ? 0 : Math.max(2, Math.min(100, totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0))}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
                <div className="text-[8px] md:text-[10px] text-text-muted uppercase tracking-wider mt-0.5 md:mt-1 hidden sm:block">Habits</div>
              </div>
              <div className="bg-surface-light border border-border-dim rounded-xl md:rounded-2xl p-2 md:p-4 flex flex-col items-center justify-center shadow-sm gap-2 w-full">
                <div className="flex items-center gap-1.5 sm:mb-1 w-full justify-between sm:justify-center">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                    <div className="text-[10px] text-text-muted uppercase tracking-wider sm:hidden">Tasks</div>
                  </div>
                  <div className="text-sm sm:text-lg md:text-xl font-bold text-text-main sm:hidden">{completedTasks}/{totalTasks}</div>
                </div>
                <div className="text-sm sm:text-lg md:text-2xl font-bold text-text-main hidden sm:block">{completedTasks}/{totalTasks}</div>
                <div className="w-full bg-surface rounded-full h-1.5 md:h-2 mt-1 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${completedTasks <= 0 ? 0 : Math.max(2, Math.min(100, totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0))}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-blue-500 rounded-full"
                  />
                </div>
                <div className="text-[8px] md:text-[10px] text-text-muted uppercase tracking-wider mt-0.5 md:mt-1 hidden sm:block">Tasks</div>
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
          accentColor="#3b82f6" // blue
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generateChartData('discipline')}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#e11d48' }} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="value" name="Score" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard 
          title="Total Tasks" 
          value={absoluteTotalTasks} 
          icon={CheckCircle} 
          accentColor="#22c55e" // green
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={generateChartData('tasks')}>
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#f43f5e' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" name="Tasks" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard 
          title="Work Hours" 
          value={`${workHours.toFixed(1).replace(/\.0$/, '')}h`} 
          icon={Clock} 
          accentColor="#eab308" // yellow
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generateChartData('hours')}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fb7185' }} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="value" name="Hours" stroke="#fb7185" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard 
          title="Total Habits" 
          value={absoluteTotalHabits} 
          icon={Activity} 
          accentColor="#ef4444" // red
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={generateChartData('habits')}>
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fda4af' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" name="Habits" fill="#fda4af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard 
          title="Total Expenses" 
          value={`${absoluteTotalExpenses} ${userSettings.currency || 'PKR'}`} 
          icon={DollarSign} 
          accentColor="#06b6d4" // cyan
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generateChartData('expenses')}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fecdd3" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fecdd3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fecdd3' }} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Area type="monotone" dataKey="value" name="Amount" stroke="#fecdd3" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          }
        />
        <MetricCard 
          title="Total Notes" 
          value={absoluteTotalNotes} 
          icon={BookOpen} 
          accentColor="#3b82f6" // blue-500
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={generateChartData('notes')}>
                <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#3b82f6' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="value" name="Notes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
      </div>

      {/* Performance Overview Chart */}
      <div className="bg-surface border border-border-dim rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm relative overflow-hidden mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight flex items-center gap-3">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-accent-primary" />
            Performance Overview
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-accent-primary"></div>
              <span className="text-xs md:text-sm text-text-muted font-medium">Discipline Score</span>
            </div>
          </div>
        </div>
        <div className="h-48 sm:h-64 md:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={generateChartData('discipline')}>
              <defs>
                <linearGradient id="colorDisciplineMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#84cc16" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }} 
                itemStyle={{ color: '#fff', fontWeight: 'bold' }} 
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} 
              />
              <Area type="monotone" dataKey="value" name="Discipline Score" stroke="#84cc16" strokeWidth={3} fillOpacity={1} fill="url(#colorDisciplineMain)" activeDot={{ r: 6, fill: '#84cc16', stroke: '#fff', strokeWidth: 2 }} />
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
                      {item.status === 'completed' && <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(255,165,0,0.4)]"></div>}
                      {item.status === 'in-progress' && <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(255,42,42,0.4)] animate-pulse"></div>}
                      {item.status === 'pending' && <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-gray-700 border-2 border-gray-600"></div>}
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
          <div className="bg-surface border border-border-dim rounded-3xl p-6 relative shadow-sm overflow-hidden min-h-[350px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display tracking-tight">Time Distribution ({timeFilter})</h2>
              <PieChartIcon className="w-5 h-5 text-gray-500" />
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
                <div className="h-48 w-full mb-6 relative flex items-center justify-center">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <span className="text-2xl font-bold font-display text-white">
                      {Object.values(hoursByCategory).reduce((a, b) => a + (b as number), 0).toFixed(1).replace(/\.0$/, '')}h
                    </span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest mt-1">Total</span>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(hoursByCategory).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {Object.entries(hoursByCategory).map(([category], index) => {
                          const colors: Record<string, string> = {
                            'Work': '#3b82f6', // blue
                            'Fitness': '#22c55e', // green
                            'Social': '#eab308', // yellow
                            'Rest': '#ef4444', // red
                            'Research': '#06b6d4', // cyan
                            'Religious': '#8b5cf6', // purple
                            'Spiritual': '#d946ef', // fuchsia
                            'Hanging out': '#f97316', // orange
                            'Games': '#14b8a6', // teal
                            'Reading': '#6366f1', // indigo
                          };
                          return <Cell key={`cell-${index}`} fill={colors[category] || '#3b82f6'} />;
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`${value.toFixed(1).replace(/\.0$/, '')}h`, 'Time']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {Object.entries(hoursByCategory)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([category, hours]) => (
                    <div key={category} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-dim hover:bg-accent-primary-dim transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${category === 'Work' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : category === 'Fitness' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : category === 'Social' || category === 'Hanging out' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : category === 'Rest' ? 'bg-red-500' : category === 'Research' ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : category === 'Religious' || category === 'Spiritual' ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : category === 'Games' ? 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]' : category === 'Reading' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-gray-500'}`}></div>
                        <span className="text-sm font-medium text-white">{category}</span>
                      </div>
                      <span className="text-sm font-mono text-gray-400 bg-black/60 border border-white/5 px-2 py-0.5 rounded-md">{(hours as number).toFixed(1).replace(/\.0$/, '')}h</span>
                    </div>
                  ))}
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
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-3 md:mb-4">
          <div>
            <h3 className="font-medium text-gray-500 text-[10px] md:text-xs uppercase tracking-widest mb-1">{title}</h3>
            <div className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">{value}</div>
          </div>
          <div className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-surface border border-border-dim">
            <Icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: accentColor }} />
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
