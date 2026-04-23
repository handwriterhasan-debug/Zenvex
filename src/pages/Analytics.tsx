import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Brain, TrendingUp, Target, Clock, Lock, ArrowUpRight, Activity } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Link } from 'react-router';
import { subDays, subMonths, subYears, isAfter, parseISO, isSameDay } from 'date-fns';

export default function Analytics() {
  const { history, currentDayData, userProfile } = useAppContext();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | '6months' | 'year'>('month');

  if (userProfile.plan === 'Free') {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-surface border border-border-dim rounded-3xl p-10 text-center relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold font-display mb-3 text-white">Pro Feature</h2>
          <p className="text-gray-400 mb-8">
            Advanced Analytics and Smart Infographics are only available on the Pro plan.
          </p>
          <Link
            to="/subscription"
            className="inline-flex items-center justify-center w-full py-3 px-6 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }
  
  // Combine history and current day for analytics
  const allData = [...history.filter(h => h.date !== currentDayData.date), currentDayData];

  // Filter data based on selected time range
  const now = new Date();
  const filteredData = allData.filter(day => {
    const dayDate = new Date(day.date);
    if (timeRange === 'today') return isSameDay(dayDate, now);
    if (timeRange === 'week') return isAfter(dayDate, subDays(now, 7));
    if (timeRange === 'month') return isAfter(dayDate, subMonths(now, 1));
    if (timeRange === '6months') return isAfter(dayDate, subMonths(now, 6));
    return isAfter(dayDate, subYears(now, 1));
  });

  // Calculate productivity data for the chart (Consistency Graph)
  let cumulativeScore = 0;
  let productivityData = filteredData.map(day => {
    const totalTasks = (day.schedule || []).length;
    const completedTasks = (day.schedule || []).filter(s => s.status === 'completed' || s.status === 'incomplete').length;
    const missedTasks = totalTasks - completedTasks;
    
    cumulativeScore += completedTasks;
    cumulativeScore -= missedTasks;
    if (cumulativeScore < 0) cumulativeScore = 0;
    
    const dateObj = new Date(day.date);
    const label = (timeRange === 'week' || timeRange === 'today')
      ? dateObj.toLocaleDateString('en-US', { weekday: 'short' })
      : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return {
      name: label,
      score: cumulativeScore
    };
  });

  if (productivityData.length === 1) {
    productivityData = [
      { ...productivityData[0], name: 'Start' },
      { ...productivityData[0], name: 'Now' }
    ];
  }

  // Calculate time usage (actual hours based on schedule)
  const categoryTime: Record<string, number> = {};
  let totalTime = 0;
  
  const calculateHoursHelper = (start: string, end: string) => {
    if (!start || !end) return 0;
    if (start.toLowerCase().includes('am') || start.toLowerCase().includes('pm')) return 0;
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60;
    return diff / 60;
  };

  filteredData.forEach(day => {
    (day.schedule || []).forEach(s => {
      if (s.status === 'completed' || s.status === 'incomplete') {
        const hours = s.actualHours !== undefined ? Number(s.actualHours) : calculateHoursHelper(s.timeStart, s.timeEnd);
        categoryTime[s.category] = (categoryTime[s.category] || 0) + hours;
        totalTime += hours;
      }
    });
  });

  const timeUsageData = Object.entries(categoryTime).map(([name, value]) => {
    const specificColors: Record<string, string> = {
      'Work': '#22c55e', // Green
      'Fitness': '#22c55e', // Green
      'Social': '#eab308', // Yellow
      'Rest': '#9ca3af', // Grey
      'Research': '#22c55e', // Green
      'Religious': '#22c55e', // Green
      'Spiritual': '#06b6d4', // Cyan
      'Hanging out': '#ec4899', // Pink
      'Games': '#eab308', // Yellow
      'Reading': '#22c55e', // Green
    };
    return {
      name,
      value: Number(value.toFixed(1)),
      color: specificColors[name] || '#22c55e'
    };
  }).sort((a, b) => b.value - a.value);

  if (timeUsageData.length === 0) {
    timeUsageData.push({ name: 'No Data', value: 0, color: '#333' });
  }

  // Calculate monthly improvement
  const monthlyScores: Record<string, { total: number, count: number }> = {};
  allData.forEach(day => {
    const dateObj = new Date(day.date);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    
    const totalTasks = (day.schedule || []).length;
    const completedTasks = (day.schedule || []).filter(s => s.status === 'completed' || s.status === 'incomplete').length;
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

  const monthlyImprovementData = Object.entries(monthlyScores)
    .sort(([keyA], [keyB]) => (keyA || '').localeCompare(keyB || ''))
    .map(([key, data]) => {
      const [year, month] = key.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1);
      return {
        month: dateObj.toLocaleDateString('en-US', { month: 'short' }),
        score: Math.round(data.total / data.count)
      };
    });

  // If we don't have enough data, add some placeholders to make the chart look good
  if (monthlyImprovementData.length === 0) {
    monthlyImprovementData.push({ month: 'Jan', score: 0 });
  } else if (monthlyImprovementData.length === 1) {
    const prevMonthDate = subMonths(new Date(), 1);
    const prevMonth = prevMonthDate.toLocaleDateString('en-US', { month: 'short' });
    monthlyImprovementData.unshift({ month: prevMonth, score: 0 });
  }

  // Overall stats
  const totalTasksCompleted = filteredData.reduce((acc, day) => acc + (day.schedule || []).filter(s => s.status === 'completed' || s.status === 'incomplete').length, 0);
  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return 0;
    
    // Handle AM/PM format if it exists in history
    if (start.toLowerCase().includes('am') || start.toLowerCase().includes('pm')) {
      return 0; // Skip invalid old data for calculation
    }

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
    
    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60; // handle overnight
    return diff / 60;
  };

  const totalWorkHours = filteredData.reduce((acc, day) => {
    return acc + (day.schedule || []).filter(s => s.status === 'completed' || s.status === 'incomplete').reduce((sum, curr) => {
      if (curr.actualHours !== undefined) {
        return sum + Number(curr.actualHours);
      }
      return sum + calculateHours(curr.timeStart, curr.timeEnd);
    }, 0);
  }, 0);
  
  const rawScore = productivityData.length > 0 ? 
    Math.round(productivityData.reduce((acc, curr) => acc + curr.score, 0) / productivityData.length) : 0;
  const currentDisciplineScore = Math.max(0, rawScore);

  // Calculate category balance for Radar Chart
  const categoryBalance: Record<string, number> = {};
  filteredData.forEach(day => {
    (day.schedule || []).forEach(s => {
      if (s.status === 'completed' || s.status === 'incomplete') {
        categoryBalance[s.category] = (categoryBalance[s.category] || 0) + 1;
      }
    });
    (day.habits || []).forEach(h => {
      if (h.completedToday) {
        categoryBalance[h.category] = (categoryBalance[h.category] || 0) + 1;
      }
    });
  });

  const radarData = Object.entries(categoryBalance).map(([subject, A]) => ({
    subject,
    A,
    fullMark: Math.max(...Object.values(categoryBalance)) || 10
  }));

  if (radarData.length < 3) {
    // Radar chart needs at least 3 points to look good
    const defaultCategories = ['Work', 'Health', 'Learning', 'Personal', 'Finance'];
    defaultCategories.forEach(cat => {
      if (!radarData.find(d => d.subject === cat)) {
        radarData.push({ subject: cat, A: 0, fullMark: 10 });
      }
    });
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight mb-2">Analytics</h1>
          <p className="text-gray-400">Measure what matters. Improve every day.</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-surface border border-border-dim text-text-main px-4 py-2 rounded-xl text-sm font-medium outline-none focus:border-accent-primary transition-colors"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* AI Report Card */}
      <div className="bg-surface border border-border-dim rounded-3xl p-8 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-primary-dim blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-primary-dim blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
          <div className="p-4 rounded-2xl bg-accent-primary-dim text-accent-primary border border-accent-primary-border shrink-0">
            <Brain className="w-8 h-8" />
          </div>
          <div className="w-full">
            <h2 className="text-2xl font-bold font-display text-text-main mb-2 tracking-tight">AI Discipline Report</h2>
            <p className="text-text-muted mb-8 max-w-2xl text-lg leading-relaxed">
              {allData.length > 1 ? (
                <>Your discipline score is currently <span className="text-text-main font-semibold">{currentDisciplineScore}%</span>. Keep tracking your habits and schedule to see personalized insights here.</>
              ) : (
                <>Not enough data yet. Complete more days to generate your AI report.</>
              )}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-light p-5 rounded-2xl border border-border-dim hover:border-border-strong transition-colors">
                <div className="text-sm text-text-muted mb-2 font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent-primary" />
                  Score
                </div>
                <div className="text-3xl font-display font-bold text-text-main">{currentDisciplineScore}%</div>
              </div>
              <div className="bg-surface-light p-5 rounded-2xl border border-border-dim hover:border-border-strong transition-colors">
                <div className="text-sm text-text-muted mb-2 font-medium flex items-center gap-2">
                  <Target className="w-4 h-4 text-accent-primary" />
                  Tasks
                </div>
                <div className="text-3xl font-display font-bold text-text-main">{totalTasksCompleted}</div>
              </div>
              <div className="bg-surface-light p-5 rounded-2xl border border-border-dim hover:border-border-strong transition-colors">
                <div className="text-sm text-text-muted mb-2 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  Hours
                </div>
                <div className="text-3xl font-display font-bold text-text-main">{totalWorkHours.toFixed(1).replace(/\.0$/, '')}h</div>
              </div>
              <div className="bg-surface-light p-5 rounded-2xl border border-border-dim hover:border-border-strong transition-colors">
                <div className="text-sm text-text-muted mb-2 font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-accent-primary" />
                  Days
                </div>
                <div className="text-3xl font-display font-bold text-text-main">{filteredData.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* Daily Consistency Area Chart */}
        <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-accent-primary-border transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary-dim rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-lg font-bold font-display tracking-tight text-text-main">
              Consistency Graph
            </h2>
            <div className="p-2 rounded-lg bg-accent-primary-dim text-accent-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productivityData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#666" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} domain={['auto', 'auto']} dx={-10} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0a0a0a', borderColor: '#ffffff1a', borderRadius: '12px', color: '#fff', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                  itemStyle={{color: '#fff'}}
                />
                <Area type="monotone" dataKey="score" stroke="#84cc16" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time Usage Pie Chart */}
        <div className="bg-surface border border-border-dim rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden group hover:border-accent-primary-border transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary-dim rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-xl font-bold font-display tracking-tight text-white">
              Time Distribution
            </h2>
            <div className="p-2 rounded-xl bg-accent-primary-dim text-accent-primary shadow-inner border border-accent-primary-border">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col xl:flex-row items-center justify-center gap-10 h-auto xl:h-[280px]">
            <div className="w-[220px] h-[220px] relative flex items-center justify-center shrink-0">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <span className="text-3xl font-bold font-display text-white drop-shadow-md">
                  {timeUsageData.reduce((a, b) => a + b.value, 0).toFixed(1).replace(/\.0$/, '')}h
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-2 font-bold">Total</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="analyticsPieGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <Pie
                    data={timeUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={8}
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {timeUsageData.map((entry, index) => {
                      const scheme = ['#39ff14', '#1f8c0a', '#a3ff94', '#d1d1d1', '#7a7a7a', '#444444', '#111111'];
                      // Override entry's initial random assignment to use new scheme
                      entry.color = scheme[index % scheme.length];
                      return <Cell key={`cell-${index}`} fill={entry.color} filter="url(#analyticsPieGlow)" />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-strong)', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value: number) => [`${value.toFixed(1).replace(/\.0$/, '')}h`, 'Time']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3 w-full xl:w-auto flex-1 max-w-sm">
              {timeUsageData.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-surface-hover border border-border-dim hover:border-accent-primary-border hover:bg-accent-primary-dim transition-all duration-300 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-3.5 h-3.5 rounded-full shadow-md" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}66` }}></div>
                    <span className="text-[15px] font-semibold text-white tracking-wide">{item.name}</span>
                  </div>
                  <span className="text-sm font-mono font-medium text-white bg-black/60 border border-white/10 px-3 py-1 rounded-lg">{item.value.toFixed(1).replace(/\.0$/, '')}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Balance Radar Chart */}
        <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-accent-primary-border transition-all duration-500">
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-lg font-bold font-display tracking-tight text-text-main">
              Life Balance
            </h2>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#ffffff15" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a3a3a3', fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar name="Completed" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(10px)', borderColor: '#ffffff1a', borderRadius: '12px', color: '#fff', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                  itemStyle={{color: '#fff', fontWeight: 'bold'}}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Improvement Line Graph */}
        <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-accent-primary-border transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-lg font-bold font-display tracking-tight text-text-main">Monthly Progress</h2>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="h-72 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyImprovementData}>
                <defs>
                  <linearGradient id="colorScoreMonth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                <XAxis dataKey="month" stroke="#666" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#666" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} domain={[0, 100]} dx={-10} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0a0a0a', borderColor: '#ffffff1a', borderRadius: '12px', color: '#fff', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'}}
                />
                <Area type="monotone" dataKey="score" stroke="#84cc16" strokeWidth={2} fillOpacity={1} fill="url(#colorScoreMonth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
