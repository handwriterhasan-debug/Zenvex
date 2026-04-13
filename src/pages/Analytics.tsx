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
  const allData = [...history, currentDayData];

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

  // Calculate productivity data for the chart
  let productivityData = filteredData.map(day => {
    const totalTasks = (day.schedule || []).length;
    const completedTasks = (day.schedule || []).filter(s => s.status === 'completed').length;
    const totalHabits = (day.habits || []).length;
    const completedHabits = (day.habits || []).filter(h => h.completedToday).length;
    
    const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 50 : 0;
    const habitScore = totalHabits > 0 ? (completedHabits / totalHabits) * 50 : 0;
    
    const dateObj = new Date(day.date);
    const label = (timeRange === 'week' || timeRange === 'today')
      ? dateObj.toLocaleDateString('en-US', { weekday: 'short' })
      : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return {
      name: label,
      score: Math.round(taskScore + habitScore)
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
      if (s.status === 'completed') {
        const hours = s.actualHours !== undefined ? Number(s.actualHours) : calculateHoursHelper(s.timeStart, s.timeEnd);
        categoryTime[s.category] = (categoryTime[s.category] || 0) + hours;
        totalTime += hours;
      }
    });
  });

  const colors = ['#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#9f1239', '#be123c'];
  const timeUsageData = Object.entries(categoryTime).map(([name, value], index) => ({
    name,
    value: Math.round((value / totalTime) * 100) || 0,
    color: colors[index % colors.length]
  })).sort((a, b) => b.value - a.value);

  if (timeUsageData.length === 0) {
    timeUsageData.push({ name: 'No Data', value: 100, color: '#333' });
  }

  // Calculate monthly improvement
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
  const totalTasksCompleted = filteredData.reduce((acc, day) => acc + (day.schedule || []).filter(s => s.status === 'completed').length, 0);
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
    return acc + (day.schedule || []).filter(s => s.status === 'completed').reduce((sum, curr) => {
      if (curr.actualHours !== undefined) {
        return sum + Number(curr.actualHours);
      }
      return sum + calculateHours(curr.timeStart, curr.timeEnd);
    }, 0);
  }, 0);
  
  const currentDisciplineScore = productivityData.length > 0 ? 
    Math.round(productivityData.reduce((acc, curr) => acc + curr.score, 0) / productivityData.length) : 0;

  // Calculate category balance for Radar Chart
  const categoryBalance: Record<string, number> = {};
  filteredData.forEach(day => {
    (day.schedule || []).forEach(s => {
      if (s.status === 'completed') {
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
        {/* Daily Productivity Area Chart */}
        <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold font-display tracking-tight text-text-main">
              Productivity Trend
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
                <YAxis stroke="#666" tick={{fill: '#666', fontSize: 12}} axisLine={false} tickLine={false} domain={[0, 100]} dx={-10} />
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
        <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold font-display tracking-tight text-text-main">
              Time Distribution
            </h2>
            <div className="p-2 rounded-lg bg-accent-primary-dim text-accent-primary">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-auto md:h-64">
            <div className="w-48 h-48 relative flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                <span className="text-2xl font-bold font-display text-white">
                  {timeUsageData.reduce((a, b) => a + b.value, 0).toFixed(0)}%
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Total</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeUsageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {timeUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-dim)', borderRadius: '12px', color: 'var(--text-main)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                    itemStyle={{color: 'var(--text-main)'}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3 w-full md:w-auto">
              {timeUsageData.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-2 rounded-xl hover:bg-surface-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                    <span className="text-sm text-text-muted">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-text-main">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Balance Radar Chart */}
        <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold font-display tracking-tight text-text-main">
              Life Balance
            </h2>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="var(--border-strong)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar name="Completed" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                <Tooltip 
                  contentStyle={{backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-dim)', borderRadius: '12px', color: 'var(--text-main)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  itemStyle={{color: 'var(--text-main)'}}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Improvement Line Graph */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold font-display tracking-tight">Monthly Progress</h2>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="h-72">
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
