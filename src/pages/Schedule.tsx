import { motion, AnimatePresence } from 'motion/react';
import { Plus, Clock, CheckCircle2, MoreVertical, Trash2, Edit2, X, PieChart as PieChartIcon, XCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState } from 'react';
import { CustomTimePicker } from '../components/CustomTimePicker';
import { formatTime12Hour } from '../utils/timeUtils';
import { LiveCalendar } from '../components/LiveCalendar';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

export default function Schedule() {
  const { currentDayData, addSchedule, updateSchedule, saveScheduleTemplate, clearSchedule, deleteScheduleTask } = useAppContext();
  const { schedule } = currentDayData;
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({ timeStart: '', timeEnd: '', task: '', category: 'Work' });

  const [completionModal, setCompletionModal] = useState<{ isOpen: boolean; taskId: string | null; actualHours: string; excuse: string }>({
    isOpen: false,
    taskId: null,
    actualHours: '',
    excuse: ''
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [saveTemplateModal, setSaveTemplateModal] = useState<{ isOpen: boolean; name: string }>({ isOpen: false, name: '' });
  const [clearScheduleModal, setClearScheduleModal] = useState(false);
  const [longTaskModal, setLongTaskModal] = useState<{ isOpen: boolean; plannedHours: number; pendingTask: any | null }>({ isOpen: false, plannedHours: 0, pendingTask: null });

  const categories = [
    { name: 'Work', color: 'bg-blue-500' },
    { name: 'Fitness', color: 'bg-emerald-500' },
    { name: 'Social', color: 'bg-amber-500' },
    { name: 'Rest', color: 'bg-gray-500' },
    { name: 'Research', color: 'bg-purple-500' },
    { name: 'Religious', color: 'bg-teal-500' },
    { name: 'Spiritual', color: 'bg-teal-400' },
    { name: 'Hanging out', color: 'bg-pink-500' },
    { name: 'Games', color: 'bg-amber-400' },
    { name: 'Reading', color: 'bg-indigo-500' },
  ];

  const handleAdd = () => {
    if (newTask.task) {
      let finalTimeStart = newTask.timeStart || '09:00';
      let finalTimeEnd = newTask.timeEnd;
      
      if (!finalTimeEnd) {
        const [h, m] = finalTimeStart.split(':').map(Number);
        const endH = (h + 1) % 24;
        finalTimeEnd = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }

      const plannedHours = calculatePlannedHours(finalTimeStart, finalTimeEnd);
      
      const pendingTask = {
        timeStart: finalTimeStart,
        timeEnd: finalTimeEnd,
        task: newTask.task,
        category: newTask.category,
      };

      if (plannedHours > 12) {
        setLongTaskModal({ isOpen: true, plannedHours, pendingTask });
        return;
      }

      commitTask(pendingTask);
    } else {
      showToast('Please enter a task name');
    }
  };

  const commitTask = (taskData: any) => {
    if (editingId) {
      updateSchedule(editingId, taskData);
      setEditingId(null);
    } else {
      addSchedule({
        id: crypto.randomUUID(),
        ...taskData,
        status: 'pending'
      });
    }
    setIsAdding(false);
    setNewTask({ timeStart: '', timeEnd: '', task: '', category: 'Work' });
  };

  const handleEdit = (item: any) => {
    setNewTask({
      timeStart: item.timeStart,
      timeEnd: item.timeEnd,
      task: item.task,
      category: item.category
    });
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewTask({ timeStart: '', timeEnd: '', task: '', category: 'Work' });
  };

  const calculatePlannedHours = (start: string, end: string) => {
    if (!start || !end || typeof start !== 'string' || typeof end !== 'string') return 0;
    
    if (start.toLowerCase().includes('am') || start.toLowerCase().includes('pm')) {
      return 0;
    }

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;

    let diff = (endH * 60 + endM) - (startH * 60 + startM);
    if (diff < 0) diff += 24 * 60; // handle overnight
    return diff / 60;
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    if (currentStatus === 'pending') {
      updateSchedule(id, { status: 'in-progress' });
    } else if (currentStatus === 'in-progress') {
      const task = schedule.find(t => t.id === id);
      const plannedHours = task ? calculatePlannedHours(task.timeStart, task.timeEnd) : 0;
      setCompletionModal({
        isOpen: true,
        taskId: id,
        actualHours: plannedHours.toFixed(1),
        excuse: ''
      });
    } else {
      updateSchedule(id, { status: 'pending', actualHours: undefined, excuse: undefined });
    }
  };

  const handleCompleteTask = () => {
    if (completionModal.taskId) {
      const task = schedule.find(t => t.id === completionModal.taskId);
      const plannedHours = task ? calculatePlannedHours(task.timeStart, task.timeEnd) : 0;
      const actualHours = Number(completionModal.actualHours);
      
      if (actualHours < plannedHours && !completionModal.excuse.trim()) {
        showToast('Please provide an excuse for completing fewer hours than planned.');
        return;
      }

      updateSchedule(completionModal.taskId, { 
        status: actualHours < plannedHours ? 'incomplete' : 'completed',
        actualHours,
        excuse: completionModal.excuse
      });
      setCompletionModal({ isOpen: false, taskId: null, actualHours: '', excuse: '' });
    }
  };

  const scheduleChartData = categories.map(cat => {
    const hours = schedule
      .filter(s => s.category === cat.name)
      .reduce((acc, curr) => {
        const planned = calculatePlannedHours(curr.timeStart, curr.timeEnd);
        return acc + ((curr.status === 'completed' || curr.status === 'incomplete') && curr.actualHours !== undefined ? Number(curr.actualHours) : planned);
      }, 0);
    return { name: cat.name, value: hours, color: cat.color.replace('bg-', 'text-') }; // Just a hack to get color, we'll map it properly
  }).filter(d => d.value > 0);

  const plannedVsActualData = schedule.map(task => {
    const planned = calculatePlannedHours(task.timeStart, task.timeEnd);
    return {
      name: task.task.length > 15 ? task.task.substring(0, 15) + '...' : task.task,
      Planned: planned,
      Actual: (task.status === 'completed' || task.status === 'incomplete') && task.actualHours !== undefined ? Number(task.actualHours) : 0,
    };
  });

  const getHexColor = (colorClass: string) => {
    const map: Record<string, string> = {
      'bg-blue-500': '#3b82f6',
      'bg-emerald-500': '#10b981',
      'bg-amber-500': '#f59e0b',
      'bg-gray-500': '#6b7280',
      'bg-purple-500': '#a855f7',
      'bg-teal-500': '#14b8a6',
      'bg-teal-400': '#2dd4bf',
      'bg-pink-500': '#ec4899',
      'bg-amber-400': '#fbbf24',
      'bg-indigo-500': '#6366f1'
    };
    return map[colorClass] || '#888';
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2 text-text-main">Smart Schedule Planner</h1>
          <p className="text-text-muted">Organize your day, track your time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          {schedule.length > 0 && (
            <>
              <button 
                onClick={() => setClearScheduleModal(true)}
                className="bg-surface-light hover:bg-accent-primary hover:text-white text-text-muted px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 md:gap-2"
              >
                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> Clear
              </button>
              <button 
                onClick={() => setSaveTemplateModal({ isOpen: true, name: '' })}
                className="bg-surface-light hover:bg-surface-hover text-text-main px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all flex items-center gap-1.5 md:gap-2"
              >
                Save Template
              </button>
            </>
          )}
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-accent-primary hover:bg-accent-primary-hover text-white px-3 py-2 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all neon-glow flex items-center gap-1.5 md:gap-2"
          >
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" /> Add Task
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <div key={cat.name} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-light border border-border-dim text-xs font-medium whitespace-nowrap text-text-main">
            <span className={`w-2 h-2 rounded-full ${cat.color}`}></span>
            {cat.name}
          </div>
        ))}
      </div>

      {scheduleChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-4">
          <div className="bg-surface border border-border-dim rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden group hover:border-accent-primary-border transition-all duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary-dim rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-accent-primary" />
                Time Distribution
              </h2>
            </div>
            
            <div className="h-[280px] w-full relative flex items-center justify-center">
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 pt-2">
                <span className="text-4xl font-bold font-display text-white tracking-tight drop-shadow-md">
                  {scheduleChartData.reduce((a, b) => a + b.value, 0).toFixed(1).replace(/\.0$/, '')}h
                </span>
                <span className="text-[11px] text-accent-primary uppercase tracking-[0.25em] mt-1 font-bold">Total Time</span>
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
                      <linearGradient key={`grad-${i}`} id={`pieGrad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={c.start} />
                        <stop offset="100%" stopColor={c.end} />
                      </linearGradient>
                    ))}
                    <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <Pie
                    data={scheduleChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={105}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={12}
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  >
                    {scheduleChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#pieGrad-${index % 6})`} filter="url(#pieGlow)" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-strong)', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value: number) => [`${value.toFixed(1)}h`, 'Time']}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-gray-300 font-medium text-xs ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-surface border border-border-dim rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden group hover:border-accent-primary-border transition-all duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary-dim rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-500" />
                Planned vs Actual Hours
              </h2>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plannedVsActualData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#39ff14" stopOpacity={1} />
                      <stop offset="100%" stopColor="#1f8c0a" stopOpacity={1} />
                    </linearGradient>
                    <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1f8c0a" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#0a3d03" stopOpacity={0.8} />
                    </linearGradient>
                    <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  <XAxis dataKey="name" stroke="#a3a3a3" tick={{ fill: '#a3a3a3', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={12} />
                  <YAxis stroke="#a3a3a3" tick={{ fill: '#a3a3a3', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
                  <RechartsTooltip 
                    cursor={{ fill: 'var(--bg-surface-hover)' }}
                    contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', backdropFilter: 'blur(10px)', border: '1px solid var(--border-strong)', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    formatter={(value: number, name: string) => [`${value.toFixed(1)}h`, name]}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '20px' }}
                    formatter={(value) => <span className="text-gray-300 font-medium text-xs ml-1">{value}</span>}
                  />
                  <Bar dataKey="Planned" fill="url(#plannedGradient)" radius={[6, 6, 0, 0]} maxBarSize={24} animationDuration={1500} />
                  <Bar dataKey="Actual" fill="url(#actualGradient)" radius={[6, 6, 0, 0]} maxBarSize={24} animationDuration={1500} filter="url(#barGlow)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
        <div className="space-y-4">
          {schedule.length === 0 ? (
            <div className="text-center py-10 text-text-muted">No tasks scheduled for today.</div>
          ) : schedule.map((item, i) => (
            <div key={`${item.id}-${i}`} className="group relative flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl bg-surface border border-border-dim hover:border-accent-primary-border hover:bg-accent-primary-dim transition-colors shadow-sm">
              <div className="w-auto md:w-48 flex items-center gap-2 md:gap-3 text-xs md:text-sm font-mono text-text-muted pr-16 md:pr-0">
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                <span className="truncate">{formatTime12Hour(item.timeStart)} - {formatTime12Hour(item.timeEnd)}</span>
              </div>
              
              <div className="flex-1 flex items-center gap-2 md:gap-3">
                <div className={`w-1 h-6 md:h-8 rounded-full ${categories.find(c => c.name === item.category)?.color || 'bg-gray-500'}`}></div>
                <div className="min-w-0">
                  <h3 className="font-medium text-base md:text-lg truncate text-text-main">{item.task}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 md:gap-3 text-[10px] md:text-xs text-text-muted mt-0.5 md:mt-1">
                    <span className="bg-surface-light px-1.5 py-0.5 rounded-md">{item.category}</span>
                    {item.status === 'completed' && item.actualHours !== undefined && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">{item.actualHours}h completed</span>
                      </>
                    )}
                    {item.status === 'incomplete' && item.actualHours !== undefined && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">{item.actualHours}h completed (Incomplete)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-3 mt-3 md:mt-0 w-full md:w-auto">
                <button 
                  onClick={() => toggleStatus(item.id, item.status)}
                  className="cursor-pointer shrink-0"
                >
                  {item.status === 'completed' && (
                    <span className="flex items-center gap-1 text-emerald-500 text-sm font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                  )}
                  {item.status === 'in-progress' && (
                    <span className="flex items-center gap-1.5 text-accent-primary text-sm font-medium bg-accent-primary-dim px-3 py-1.5 rounded-full border border-accent-primary-border">
                      <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse"></div> In Progress
                    </span>
                  )}
                  {item.status === 'incomplete' && (
                    <span className="flex items-center gap-1 text-red-500 text-sm font-medium bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                      <XCircle className="w-4 h-4" /> Incomplete
                    </span>
                  )}
                  {item.status === 'pending' && (
                    <span className="flex items-center gap-1 text-text-muted text-sm font-medium bg-surface-light px-3 py-1.5 rounded-full hover:bg-surface-hover border border-border-dim transition-colors">
                      Pending
                    </span>
                  )}
                </button>
                
                <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="p-2 bg-surface-light hover:bg-surface-hover rounded-full text-text-muted hover:text-text-main transition-colors"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteScheduleTask(item.id)}
                    className="p-2 bg-surface-light hover:bg-accent-primary-dim rounded-full text-text-muted hover:text-accent-primary transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12">
        <LiveCalendar />
      </div>
      </motion.div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border-dim rounded-3xl p-6 w-full max-w-md relative shadow-lg max-h-[90vh] overflow-visible"
            >
              <button onClick={handleCancel} className="absolute top-6 right-6 text-text-muted hover:text-text-main transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold font-display text-xl mb-6 text-text-main">{editingId ? 'Edit Task' : 'Add New Task'}</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Task Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Deep Work" 
                    value={newTask.task}
                    onChange={e => setNewTask({...newTask, task: e.target.value})}
                    className="w-full bg-surface-light border border-border-dim rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent-primary-border transition-colors"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <CustomTimePicker 
                      label="Start Time"
                      value={newTask.timeStart}
                      onChange={(val) => setNewTask({...newTask, timeStart: val})}
                    />
                  </div>
                  <div>
                    <CustomTimePicker 
                      label="End Time"
                      value={newTask.timeEnd}
                      onChange={(val) => setNewTask({...newTask, timeEnd: val})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Category</label>
                  <select 
                    value={newTask.category}
                    onChange={e => setNewTask({...newTask, category: e.target.value})}
                    className="w-full bg-surface-light border border-border-dim rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-accent-primary-border transition-colors appearance-none"
                  >
                    {categories.map(c => <option key={c.name} value={c.name} className="bg-surface text-text-main">{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-8">
                <button onClick={handleCancel} className="px-6 py-2.5 text-text-muted hover:text-text-main font-medium transition-colors">Cancel</button>
                <button onClick={handleAdd} className="bg-accent-primary text-white hover:bg-accent-primary-hover px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-accent-shadow">
                  {editingId ? 'Update Task' : 'Save Task'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {completionModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border-dim rounded-3xl p-6 w-full max-w-md shadow-lg"
            >
              <h2 className="text-xl font-bold mb-4 text-text-main">Complete Task</h2>
              <p className="text-text-muted mb-6 text-sm">How many hours did you actually spend on this task?</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Actual Hours</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={completionModal.actualHours}
                    onChange={e => setCompletionModal({...completionModal, actualHours: e.target.value})}
                    className="w-full bg-surface-light border border-border-dim rounded-lg px-4 py-2 text-text-main focus:outline-none focus:border-accent-primary-border"
                  />
                </div>
                
                {(() => {
                  const task = schedule.find(t => t.id === completionModal.taskId);
                  const plannedHours = task ? calculatePlannedHours(task.timeStart, task.timeEnd) : 0;
                  const actualHours = Number(completionModal.actualHours);
                  
                  if (actualHours < plannedHours) {
                    return (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <label className="block text-sm font-medium text-red-500">
                          Why didn't you complete the full time? Write your excuse.
                        </label>
                        <textarea 
                          value={completionModal.excuse}
                          onChange={e => setCompletionModal({...completionModal, excuse: e.target.value})}
                          placeholder="Your excuse here..."
                          className="w-full bg-surface-light border border-red-500/50 rounded-lg px-4 py-2 text-text-main focus:outline-none focus:border-red-500 min-h-[80px]"
                        />
                      </motion.div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex gap-3 justify-end mt-8">
                <button 
                  onClick={() => setCompletionModal({ isOpen: false, taskId: null, actualHours: '', excuse: '' })}
                  className="px-4 py-2 text-text-muted hover:text-text-main"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCompleteTask}
                  className={`${schedule.length && completionModal.taskId && Number(completionModal.actualHours) < calculatePlannedHours(schedule.find(t => t.id === completionModal.taskId)?.timeStart || '0', schedule.find(t => t.id === completionModal.taskId)?.timeEnd || '0') ? 'bg-red-500 hover:bg-red-600' : 'bg-accent-primary hover:bg-accent-primary-hover'} text-white px-6 py-2 rounded-lg font-medium transition-colors`}
                >
                  {schedule.length && completionModal.taskId && Number(completionModal.actualHours) < calculatePlannedHours(schedule.find(t => t.id === completionModal.taskId)?.timeStart || '0', schedule.find(t => t.id === completionModal.taskId)?.timeEnd || '0') ? 'Mark as Incomplete' : 'Complete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {saveTemplateModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border-dim rounded-3xl p-6 max-w-md w-full shadow-lg"
            >
              <h3 className="text-xl font-bold mb-4 text-text-main">Save Schedule Template</h3>
              <p className="text-text-muted mb-4 text-sm">
                Enter a name for this template to save it to your library.
              </p>
              <input 
                type="text" 
                placeholder="Template Name" 
                value={saveTemplateModal.name}
                onChange={e => setSaveTemplateModal({...saveTemplateModal, name: e.target.value})}
                className="w-full bg-surface-light border border-border-dim rounded-lg px-4 py-2 text-text-main focus:outline-none focus:border-accent-primary-border mb-6"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setSaveTemplateModal({ isOpen: false, name: '' })}
                  className="px-4 py-2 text-text-muted hover:text-text-main"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (saveTemplateModal.name.trim()) {
                      const tasksToSave = schedule.map(({ id, status, ...rest }) => rest);
                      saveScheduleTemplate(saveTemplateModal.name.trim(), tasksToSave);
                      setSaveTemplateModal({ isOpen: false, name: '' });
                      showToast('Schedule saved to your Library!');
                    } else {
                      showToast('Please enter a template name.');
                    }
                  }}
                  className="bg-accent-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-accent-primary-hover transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {clearScheduleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border-dim rounded-3xl p-6 max-w-md w-full shadow-lg text-center"
            >
              <div className="w-16 h-16 bg-accent-primary-dim rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-text-main">Clear Schedule?</h3>
              <p className="text-text-muted mb-6 text-sm">
                Are you sure you want to clear your entire schedule for today? This action can be undone later.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setClearScheduleModal(false)}
                  className="px-6 py-2 bg-surface-light hover:bg-surface-hover text-text-main rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    clearSchedule();
                    setClearScheduleModal(false);
                    showToast('Schedule cleared.');
                  }}
                  className="bg-accent-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-accent-primary-hover transition-colors"
                >
                  Clear Schedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {longTaskModal.isOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border-dim rounded-3xl p-6 max-w-md w-full shadow-lg text-center"
            >
              <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-text-main">Long Task Warning</h3>
              <p className="text-text-muted mb-6 text-sm">
                This task is scheduled for <strong className="text-text-main">{longTaskModal.plannedHours.toFixed(1)} hours</strong>. Are you sure? (You might have mixed up AM and PM)
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setLongTaskModal({ isOpen: false, plannedHours: 0, pendingTask: null })}
                  className="px-6 py-2 bg-surface-light hover:bg-surface-hover text-text-main rounded-lg font-medium transition-colors"
                >
                  Review Time
                </button>
                <button 
                  onClick={() => {
                    if (longTaskModal.pendingTask) {
                      commitTask(longTaskModal.pendingTask);
                    }
                    setLongTaskModal({ isOpen: false, plannedHours: 0, pendingTask: null });
                  }}
                  className="bg-amber-500 text-black px-6 py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors"
                >
                  Yes, I'm Sure
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-surface border border-border-dim text-text-main px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 z-50"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
