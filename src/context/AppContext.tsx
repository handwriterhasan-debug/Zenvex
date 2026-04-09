import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppState, DailyData, ExpenseItem, HabitItem, NoteItem, ScheduleItem, UserSettings, UserProfile, SavedSchedule, NotificationItem } from '../types';
import { supabase } from '../supabaseClient';
import { supabaseService } from '../supabaseService';

interface AppContextType extends AppState {
  syncError: string | null;
  isStateLoaded: boolean;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  applySubscription: (plan: 'Free' | 'Pro' | 'Premium', durationDays: number, coupon?: string) => void;
  addSchedule: (item: ScheduleItem) => void;
  updateSchedule: (id: string, updates: Partial<ScheduleItem>) => void;
  clearSchedule: () => void;
  clearExpenses: () => void;
  undoSchedule: () => void;
  saveScheduleTemplate: (name: string, tasks: Omit<ScheduleItem, 'id' | 'status'>[]) => void;
  loadScheduleTemplate: (id: string) => void;
  deleteScheduleTemplate: (id: string) => void;
  addHabit: (item: HabitItem) => void;
  updateHabit: (id: string, updates: Partial<HabitItem>) => void;
  toggleHabit: (id: string, dateStr?: string) => void;
  addExpense: (item: ExpenseItem) => void;
  updateExpense: (id: string, updates: Partial<ExpenseItem>) => void;
  deleteExpense: (id: string) => void;
  addNote: (item: NoteItem) => void;
  deleteNote: (id: string) => void;
  deleteHabit: (id: string) => void;
  deleteScheduleTask: (id: string) => void;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  checkAndResetDay: () => void;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  resetState: () => void;
  fetchExchangeRates: () => Promise<void>;
  exchangeRatesOffline: boolean;
}

const defaultSettings: UserSettings = {
  name: 'User',
  dayEndTime: '23:59',
  theme: 'dark',
  initialBalance: 0,
  savingsBalance: 0,
  monthlyIncome: 0,
  currency: 'PKR'
};

const defaultProfile: UserProfile = {
  name: 'User',
  gender: 'Not specified',
  age: 'Not specified',
  country: 'Not specified',
  plan: 'Free'
};

// Helper to get logical date based on dayEndTime
const getLogicalDate = (dayEndTime: string) => {
  const now = new Date();
  const [endHour, endMinute] = dayEndTime.split(':').map(Number);
  
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let targetDate = new Date(now);

  // If day ends early morning (e.g., 04:00), times before that belong to previous day
  if (endHour <= 12) {
    if (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      targetDate.setDate(targetDate.getDate() - 1);
    }
  } else {
    // If day ends late (e.g., 23:59), times after that belong to next day
    if (currentHour > endHour || (currentHour === endHour && currentMinute >= endMinute)) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
  }

  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const defaultDailyData: DailyData = {
  date: getLogicalDate('23:59'),
  schedule: [],
  habits: [],
  expenses: [],
  notes: [],
};

const testScheduleTasks = [
  { timeStart: '13:00', timeEnd: '17:00', task: 'blender work', category: 'Work' },
  { timeStart: '05:30', timeEnd: '06:30', task: 'client hunting and freelancing', category: 'Work' },
  { timeStart: '18:30', timeEnd: '19:00', task: 'iftari time', category: 'Rest' },
  { timeStart: '19:00', timeEnd: '21:15', task: 'Ai agent and Saas', category: 'Social' },
  { timeStart: '21:15', timeEnd: '22:00', task: 'traweeh', category: 'Social' },
  { timeStart: '22:00', timeEnd: '23:00', task: 'wedding video edit', category: 'Work' }
];

const generateFakeHistory = () => {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (7 - i));
    return {
      date: d.toISOString().split('T')[0],
      schedule: testScheduleTasks.map((t, j) => ({ 
        ...t, 
        id: `hist-${i}-${j}`, 
        status: (Math.random() > 0.2 ? 'completed' : 'pending') as 'completed' | 'pending',
        actualHours: Math.random() > 0.2 ? 1 : 0
      })),
      habits: [],
      expenses: [],
      notes: []
    };
  });
};

const defaultState: AppState = {
  userSettings: defaultSettings,
  userProfile: defaultProfile,
  currentDayData: {
    ...defaultDailyData,
    schedule: testScheduleTasks.map((t, i) => ({ ...t, id: `test-${i}`, status: 'pending' as const }))
  },
  history: generateFakeHistory(),
  savedSchedules: [{
    id: 'test-schedule-1',
    name: 'Hasan Test Schedule',
    tasks: testScheduleTasks
  }],
  isDemoMode: false,
  notifications: [],
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [exchangeRatesOffline, setExchangeRatesOffline] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      const apiRates = data.conversion_rates || data.rates;
      
      // Override with user's specific rates to ensure exact match with their local exchange
      const customRates = {
        USD: 1,
        PKR: 279.00,
        GBP: 0.754074,
        EUR: 0.863697,
        SAR: 3.755047,
        INR: 93.00,
        AED: 3.672986,
        CAD: 1.3811,
        AUD: 1.438070
      };

      setState(prev => ({
        ...prev,
        exchangeRatesCache: {
          rates: { ...apiRates, ...customRates },
          lastUpdated: new Date().toISOString()
        }
      }));
      setExchangeRatesOffline(false);
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Use fallback hardcoded rates based on user's table
      setState(prev => ({
        ...prev,
        exchangeRatesCache: {
          rates: {
            USD: 1,
            PKR: 279.00,
            GBP: 0.754074,
            EUR: 0.863697,
            SAR: 3.755047,
            INR: 93.00,
            AED: 3.672986,
            CAD: 1.3811,
            AUD: 1.438070
          },
          lastUpdated: new Date().toISOString()
        }
      }));
      setExchangeRatesOffline(true);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
    const interval = setInterval(fetchExchangeRates, 30 * 60 * 1000); // 30 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadState = async () => {
      try {
        // Check Supabase session with a timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{data: {session: any}}>((_, reject) => 
          setTimeout(() => reject(new Error('Supabase getSession timeout')), 3000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (!session) {
          // Fallback to local storage for guests
          const saved = localStorage.getItem('makeYourFutureState');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (!parsed.userSettings?.theme) parsed.userSettings = { ...parsed.userSettings, theme: 'dark' };
            if (!parsed.userProfile) parsed.userProfile = defaultProfile;
            if (!parsed.savedSchedules) parsed.savedSchedules = [];
            if (!parsed.notifications) parsed.notifications = [];
            if (!parsed.savedSchedules.some((s: any) => s.id === 'test-schedule-1')) {
              parsed.savedSchedules.push({ id: 'test-schedule-1', name: 'Hasan Test Schedule', tasks: testScheduleTasks });
            }
            if (!parsed.currentDayData?.schedule || parsed.currentDayData.schedule.length === 0) {
              if (!parsed.currentDayData) parsed.currentDayData = defaultDailyData;
              parsed.currentDayData.schedule = testScheduleTasks.map((t, i) => ({ ...t, id: `test-${i}`, status: 'pending' as const }));
            }
            if (!parsed.history || parsed.history.length === 0) {
              parsed.history = generateFakeHistory();
            }
            setState(prev => ({ ...parsed, exchangeRatesCache: prev.exchangeRatesCache || parsed.exchangeRatesCache }));
          } else {
            setState(prev => ({ ...defaultState, exchangeRatesCache: prev.exchangeRatesCache }));
          }
          return;
        }

        // Load from Supabase
        const currentLogicalDate = getLogicalDate(defaultSettings.dayEndTime);
        const loadedData = await supabaseService.loadUserData(session.user.id);
        
        if (loadedData) {
          const isNewUser = !loadedData.profile || !loadedData.settings;
          
          let localState: AppState | null = null;
          const saved = localStorage.getItem('makeYourFutureState');
          if (saved) {
            try { localState = JSON.parse(saved); } catch (e) {}
          }
          
          const loadedState: AppState = {
            userSettings: {
              ...(loadedData.settings || localState?.userSettings || defaultSettings),
              initialExpenses: localState?.userSettings?.initialExpenses || 0
            },
            userProfile: loadedData.profile || localState?.userProfile || defaultProfile,
            currentDayData: loadedData.history.find(h => h.date === currentLogicalDate) || localState?.currentDayData || {
              date: currentLogicalDate,
              schedule: [],
              habits: loadedData.habits.map(h => {
                // Check if completed yesterday
                const yesterday = new Date(currentLogicalDate);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                const completedYesterday = loadedData.history.some(day => day.date === yesterdayStr && day.habits.some(dh => dh.id === h.id && dh.completedToday));
                
                return {
                  id: h.id, name: h.name, category: h.category, target: h.target,
                  color: h.color, startDate: h.startDate, completedToday: false, 
                  streak: completedYesterday ? h.streak : 0
                };
              }),
              expenses: [],
              notes: []
            },
            history: loadedData.history.length > 0 ? loadedData.history.filter(h => h.date !== currentLogicalDate) : (localState?.history || []),
            savedSchedules: loadedData.savedSchedules?.length > 0 ? loadedData.savedSchedules : (localState?.savedSchedules || []),
            notifications: loadedData.notifications?.length > 0 ? loadedData.notifications : (localState?.notifications || []),
            isDemoMode: false
          };
          
          if (!loadedState.userSettings?.theme) loadedState.userSettings = { ...loadedState.userSettings, theme: 'dark' };
          
          if (isNewUser) {
            try {
              await supabaseService.upsertSettings(session.user.id, loadedState.userSettings);
              await supabaseService.upsertProfile(session.user.id, loadedState.userProfile);
              
              // Migrate current day data
              if (localState?.currentDayData) {
                for (const s of localState.currentDayData.schedule) {
                  await supabaseService.createSchedule(session.user.id, localState.currentDayData.date, s).catch(() => {});
                }
                for (const h of localState.currentDayData.habits) {
                  await supabaseService.createHabit(session.user.id, h).catch(() => {});
                  if (h.completedToday) {
                    await supabaseService.upsertHabitLog(session.user.id, h.id, localState.currentDayData.date, true).catch(() => {});
                  }
                }
                for (const e of localState.currentDayData.expenses) {
                  await supabaseService.createExpense(session.user.id, localState.currentDayData.date, e).catch(() => {});
                }
                for (const n of localState.currentDayData.notes) {
                  await supabaseService.createNote(session.user.id, localState.currentDayData.date, n).catch(() => {});
                }
              }
              
              // Migrate history
              if (localState?.history) {
                for (const day of localState.history) {
                  for (const s of day.schedule) {
                    await supabaseService.createSchedule(session.user.id, day.date, s).catch(() => {});
                  }
                  for (const h of day.habits) {
                    if (h.completedToday) {
                      await supabaseService.upsertHabitLog(session.user.id, h.id, day.date, true).catch(() => {});
                    }
                  }
                  for (const e of day.expenses) {
                    await supabaseService.createExpense(session.user.id, day.date, e).catch(() => {});
                  }
                  for (const n of day.notes) {
                    await supabaseService.createNote(session.user.id, day.date, n).catch(() => {});
                  }
                }
              }
            } catch (e: any) {
              console.error("Migration error:", e);
              const { error: checkError } = await supabase.from('schedules').select('id').limit(1);
              const tablesExist = !checkError || (!checkError.message?.includes('does not exist') && !checkError.message?.includes('schema cache'));
              
              let localSaveWorks = false;
              try {
                localStorage.setItem('test_sync', '1');
                localStorage.removeItem('test_sync');
                localSaveWorks = true;
              } catch (err) {}

              if (!tablesExist && !localSaveWorks) {
                if (e.message?.includes('schema cache') || e.message?.includes('does not exist')) {
                  setSyncError("Database tables are missing. Please run the SQL setup script in Supabase to enable cloud sync. Your data is saved locally.");
                }
              } else {
                setSyncError(null);
              }
            }
          }
          
          setState(prev => ({ ...loadedState, exchangeRatesCache: prev.exchangeRatesCache || loadedState.exchangeRatesCache }));
        }
      } catch (err: any) {
        console.error('Failed to load state', err);
        
        let localSaveWorks = false;
        try {
          localStorage.setItem('test_sync', '1');
          localStorage.removeItem('test_sync');
          localSaveWorks = true;
        } catch (e) {}

        try {
          // Add timeout to prevent hanging if Supabase is blocked
          const checkPromise = supabase.from('schedules').select('id').limit(1);
          const timeoutPromise = new Promise<any>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 3000)
          );
          const { error: checkError } = await Promise.race([checkPromise, timeoutPromise]);
          const tablesExist = !checkError || (!checkError.message?.includes('does not exist') && !checkError.message?.includes('schema cache'));

          if (!tablesExist && !localSaveWorks) {
            if (err.message?.includes('schema cache') || err.message?.includes('does not exist')) {
              setSyncError("Database tables are missing. Please run the SQL setup script in Supabase to enable cloud sync. Your data is saved locally.");
            } else {
              setSyncError(err.message);
            }
          } else {
            setSyncError(null);
          }
        } catch (checkErr) {
          console.error('Supabase check failed or timed out', checkErr);
          setSyncError(null);
        }
        
        // Fallback to local storage on error
        try {
          const saved = localStorage.getItem('makeYourFutureState');
          if (saved) setState(prev => ({ ...JSON.parse(saved), exchangeRatesCache: prev.exchangeRatesCache }));
        } catch (e) {
          console.error('Failed to parse local storage state', e);
        }
      } finally {
        setIsStateLoaded(true);
      }
    };

    loadState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        loadState();
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('makeYourFutureState');
        setState(defaultState);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const resetState = () => {
    localStorage.removeItem('isGuestMode');
    localStorage.removeItem('makeYourFutureState');
    setState(prev => ({ ...defaultState, exchangeRatesCache: prev.exchangeRatesCache }));
  };

  useEffect(() => {
    if (!isStateLoaded) return;

    localStorage.setItem('makeYourFutureState', JSON.stringify(state));
    
    // Apply theme to body
    if (state.userSettings.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [state, isStateLoaded]);

  const checkAndResetDay = () => {
    setState((prev) => {
      const currentLogicalDate = getLogicalDate(prev.userSettings.dayEndTime);
      let hasChanges = false;
      let nextState = { ...prev };
      
      // Check subscription expiration
      if (nextState.userProfile.plan !== 'Free' && nextState.userProfile.subscriptionEndDate) {
        const endDate = new Date(nextState.userProfile.subscriptionEndDate);
        if (new Date() > endDate) {
          nextState.userProfile = {
            ...nextState.userProfile,
            plan: 'Free',
            subscriptionStartDate: undefined,
            subscriptionEndDate: undefined
          };
          hasChanges = true;
        }
      }

      if (prev.currentDayData.date !== currentLogicalDate) {
        // Day has changed! Archive current day to history
        const newHistory = [...prev.history, prev.currentDayData];
        
        // Reset current day data, but keep habits (reset completion)
        const newHabits = prev.currentDayData.habits.map(h => ({
          ...h,
          completedToday: false,
          // If it was completed yesterday, streak is maintained, else it resets
          streak: h.completedToday ? h.streak : 0 
        }));

        nextState = {
          ...nextState,
          history: newHistory,
          currentDayData: {
            date: currentLogicalDate,
            schedule: [], // Reset schedule
            habits: newHabits, // Keep habits but reset completion
            expenses: [], // Reset expenses
            notes: [], // Reset notes
          }
        };
        hasChanges = true;
      }
      
      return hasChanges ? nextState : prev;
    });
  };

  // Check for reset on mount and every minute
  useEffect(() => {
    checkAndResetDay();
    const interval = setInterval(checkAndResetDay, 60000);
    return () => clearInterval(interval);
  }, [state.userSettings.dayEndTime]);

  const addNotification = async (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotif = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false
    };
    setState(prev => ({
      ...prev,
      notifications: [newNotif, ...prev.notifications].slice(0, 50)
    }));
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('notifications').insert({
        id: newNotif.id, user_id: session.user.id, title: newNotif.title, message: newNotif.message,
        type: newNotif.type, timestamp: newNotif.timestamp, read: newNotif.read
      });
    }
  };

  const markNotificationRead = async (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const clearNotifications = async () => {
    setState(prev => ({ ...prev, notifications: [] }));
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await supabase.from('notifications').delete().eq('user_id', session.user.id);
  };

  const updateSettings = async (settings: Partial<UserSettings>) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    setState(prev => {
      const newSettings = { ...prev.userSettings, ...settings };
      
      // Save to Supabase in the background
      if (session) {
        supabaseService.upsertSettings(session.user.id, newSettings).catch(console.error);
      }
      
      return { ...prev, userSettings: newSettings };
    });
  };

  const updateProfile = async (profile: Partial<UserProfile>) => {
    let newProfile: UserProfile | null = null;
    let newSettings: UserSettings | null = null;
    setState(prev => {
      newProfile = { ...prev.userProfile, ...profile };
      const updates: any = { userProfile: newProfile };
      if (profile.name) {
        newSettings = { ...prev.userSettings, name: profile.name };
        updates.userSettings = newSettings;
      }
      return { ...prev, ...updates };
    });
    const { data: { session } } = await supabase.auth.getSession();
    if (session && newProfile) {
      await supabaseService.upsertProfile(session.user.id, newProfile);
      if (newSettings) {
        await supabaseService.upsertSettings(session.user.id, newSettings);
      }
    }
  };

  const applySubscription = async (plan: 'Free' | 'Pro' | 'Premium', durationDays: number, coupon?: string) => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + durationDays);
    
    let newProfile: UserProfile | null = null;
    setState(prev => {
      newProfile = {
        ...prev.userProfile,
        plan,
        subscriptionStartDate: start.toISOString(),
        subscriptionEndDate: end.toISOString(),
        usedCoupon: coupon
      };
      return { ...prev, userProfile: newProfile };
    });
    const { data: { session } } = await supabase.auth.getSession();
    if (session && newProfile) await supabaseService.upsertProfile(session.user.id, newProfile);
  };

  const saveScheduleTemplate = async (name: string, tasks: Omit<ScheduleItem, 'id' | 'status'>[]) => {
    const newTemplate = { id: crypto.randomUUID(), name, tasks };
    setState(prev => ({
      ...prev,
      savedSchedules: [...prev.savedSchedules, newTemplate]
    }));
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('saved_schedules').insert({
        id: newTemplate.id, user_id: session.user.id, name: newTemplate.name, tasks: newTemplate.tasks
      });
    }
  };

  const loadScheduleTemplate = async (id: string) => {
    let newTasks: ScheduleItem[] = [];
    let date = '';
    setState(prev => {
      const template = prev.savedSchedules.find(s => s.id === id);
      if (!template) return prev;
      
      newTasks = template.tasks.map((t) => ({
        ...t,
        id: crypto.randomUUID(),
        status: 'pending'
      }));
      date = prev.currentDayData.date;

      return {
        ...prev,
        currentDayData: {
          ...prev.currentDayData,
          schedule: [...prev.currentDayData.schedule, ...newTasks]
        }
      };
    });
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session && newTasks.length > 0) {
      for (const task of newTasks) {
        await supabaseService.createSchedule(session.user.id, date, task);
      }
    }
  };

  const deleteScheduleTemplate = async (id: string) => {
    setState(prev => ({
      ...prev,
      savedSchedules: prev.savedSchedules.filter(s => s.id !== id)
    }));
    await supabase.from('saved_schedules').delete().eq('id', id);
  };

  const addSchedule = async (item: ScheduleItem) => {
    let date = '';
    setState(prev => {
      date = prev.currentDayData.date;
      return {
        ...prev,
        currentDayData: { ...prev.currentDayData, schedule: [...prev.currentDayData.schedule, item] }
      };
    });
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await supabaseService.createSchedule(session.user.id, date, item);
  };

  const updateDisciplineScore = async (stateData: AppState) => {
    const today = stateData.currentDayData;
    const totalTasks = today.schedule.length;
    const completedTasks = today.schedule.filter(s => s.status === 'completed').length;
    const totalHabits = today.habits.length;
    const completedHabits = today.habits.filter(h => h.completedToday).length;

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
      taskScore = 100;
    }

    const hasValidExcuse = today.schedule.some(s => s.status !== 'completed' && s.excuse) || 
                           today.notes.some(n => n.isExcuse);

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
    
    if (stateData.userProfile.disciplineScore !== disciplineScore) {
      await updateProfile({ disciplineScore });
    }
  };

  const updateSchedule = async (id: string, updates: Partial<ScheduleItem>) => {
    let taskName = '';
    let isCompleting = false;
    let newState: AppState | null = null;
    
    setState(prev => {
      const task = prev.currentDayData.schedule.find(s => s.id === id);
      isCompleting = updates.status === 'completed' && task?.status !== 'completed';
      if (task) taskName = task.task;

      newState = {
        ...prev,
        currentDayData: {
          ...prev.currentDayData,
          schedule: prev.currentDayData.schedule.map(s => s.id === id ? { ...s, ...updates } : s)
        }
      };
      return newState;
    });
    
    if (isCompleting) {
      await addNotification({
        title: 'Task Completed!',
        message: `Great job completing "${taskName}"! Keep up the good work.`,
        type: 'success'
      });
    }
    
    await supabaseService.updateSchedule(id, updates);
    if (newState) await updateDisciplineScore(newState);
  };

  const clearSchedule = async () => {
    let deletedIds: string[] = [];
    setState(prev => {
      deletedIds = prev.currentDayData.schedule.map(s => s.id);
      return {
        ...prev,
        previousSchedule: prev.currentDayData.schedule,
        currentDayData: { ...prev.currentDayData, schedule: [] }
      };
    });
    for (const id of deletedIds) {
      await supabaseService.deleteSchedule(id);
    }
  };

  const clearExpenses = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    let deletedIds: string[] = [];
    setState(prev => {
      deletedIds = prev.currentDayData.expenses.map(e => e.id);
      prev.history.forEach(day => {
        deletedIds.push(...(day.expenses || []).map(e => e.id));
      });
      
      const newSettings = {
        ...prev.userSettings,
        initialBalance: 0,
        savingsBalance: 0,
        monthlyIncome: 0,
        initialExpenses: 0
      };

      return {
        ...prev,
        userSettings: newSettings,
        currentDayData: { ...prev.currentDayData, expenses: [] },
        history: prev.history.map(day => ({ ...day, expenses: [] }))
      };
    });
    
    // Update settings in DB
    if (session) {
      await supabaseService.upsertSettings(session.user.id, {
        ...state.userSettings,
        initialBalance: 0,
        savingsBalance: 0,
        monthlyIncome: 0,
        initialExpenses: 0
      }).catch(console.error);
    }

    for (const id of deletedIds) {
      await supabaseService.deleteExpense(id).catch(console.error);
    }
  };

  const undoSchedule = async () => {
    let restoredTasks: ScheduleItem[] = [];
    let date = '';
    setState(prev => {
      if (!prev.previousSchedule) return prev;
      restoredTasks = prev.previousSchedule;
      date = prev.currentDayData.date;
      return {
        ...prev,
        currentDayData: { ...prev.currentDayData, schedule: prev.previousSchedule },
        previousSchedule: undefined
      };
    });
    const { data: { session } } = await supabase.auth.getSession();
    if (session && restoredTasks.length > 0) {
      for (const task of restoredTasks) {
        await supabaseService.createSchedule(session.user.id, date, task);
      }
    }
  };

  const addHabit = async (item: HabitItem) => {
    setState(prev => ({
      ...prev,
      currentDayData: { ...prev.currentDayData, habits: [...prev.currentDayData.habits, item] }
    }));
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await supabaseService.createHabit(session.user.id, item);
  };

  const updateHabit = async (id: string, updates: Partial<HabitItem>) => {
    setState(prev => ({
      ...prev,
      currentDayData: {
        ...prev.currentDayData,
        habits: prev.currentDayData.habits.map(h => h.id === id ? { ...h, ...updates } : h)
      }
    }));
    await supabaseService.updateHabit(id, updates);
  };

  const toggleHabit = async (id: string, dateStr?: string) => {
    let targetDate = '';
    let isCompleted = false;
    let newStreak = 0;
    
    let newState: AppState | null = null;
    
    setState(prev => {
      targetDate = dateStr || prev.currentDayData.date;
      let allDays = [...prev.history, prev.currentDayData]
        .filter(Boolean)
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      
      let toggleIdx = allDays.findIndex(d => d.date === targetDate);
      
      if (toggleIdx === -1) {
        // Create missing day
        const missingDay: DailyData = {
          date: targetDate,
          schedule: [],
          habits: prev.currentDayData.habits.map(h => ({ ...h, completedToday: false, streak: 0 })),
          expenses: [],
          notes: []
        };
        allDays.push(missingDay);
        allDays.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        toggleIdx = allDays.findIndex(d => d.date === targetDate);
      }

      const dayToToggle = allDays[toggleIdx];
      const currentHabitTemplate = prev.currentDayData.habits.find(h => h.id === id);
      if (!currentHabitTemplate) return prev;

      let habitExists = dayToToggle.habits.some(h => h.id === id);
      let newHabits = [...dayToToggle.habits];
      
      if (!habitExists) {
        newHabits.push({
          ...currentHabitTemplate,
          completedToday: true,
          streak: 0
        });
      } else {
        newHabits = newHabits.map(h =>
          h.id === id ? { ...h, completedToday: !h.completedToday } : h
        );
      }
      
      allDays[toggleIdx] = { ...dayToToggle, habits: newHabits };

      // Recalculate streaks
      for (let i = 0; i < allDays.length; i++) {
        const currentDay = allDays[i];
        const prevDay = i > 0 ? allDays[i - 1] : null;

        currentDay.habits = currentDay.habits.map(h => {
          if (h.id === id) {
            const prevHabit = prevDay?.habits.find(ph => ph.id === id);
            const prevStreak = prevHabit ? prevHabit.streak : 0;
            const updatedStreak = h.completedToday ? prevStreak + 1 : 0;
            if (currentDay.date === targetDate) {
              isCompleted = h.completedToday;
              newStreak = updatedStreak;
            }
            return {
              ...h,
              streak: updatedStreak
            };
          }
          return h;
        });
      }

      const newCurrentDayData = allDays.find(d => d.date === prev.currentDayData.date)!;
      const newHistory = allDays.filter(d => d.date !== prev.currentDayData.date);

      const updatedHabit = newCurrentDayData.habits.find(h => h.id === id);
      if (updatedHabit?.completedToday && !currentHabitTemplate.completedToday) {
        setTimeout(() => {
          addNotification({
            title: 'Habit Completed!',
            message: `You completed "${updatedHabit.name}". Current streak: ${updatedHabit.streak} days!`,
            type: 'success'
          });
        }, 0);
      }

      newState = {
        ...prev,
        history: newHistory,
        currentDayData: newCurrentDayData
      };
      return newState;
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (session && targetDate) {
      await supabaseService.upsertHabitLog(session.user.id, id, targetDate, isCompleted);
      await supabaseService.updateHabit(id, { streak: newStreak });
    }
    if (newState) await updateDisciplineScore(newState);
  };

  const addExpense = async (item: ExpenseItem) => {
    let date = '';
    setState(prev => {
      date = prev.currentDayData.date;
      return {
        ...prev,
        currentDayData: { ...prev.currentDayData, expenses: [...prev.currentDayData.expenses, item] }
      };
    });
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await supabaseService.createExpense(session.user.id, date, item);
  };

  const updateExpense = async (id: string, updates: Partial<ExpenseItem>) => {
    setState(prev => ({
      ...prev,
      currentDayData: {
        ...prev.currentDayData,
        expenses: prev.currentDayData.expenses.map(e => e.id === id ? { ...e, ...updates } : e)
      }
    }));
    await supabaseService.updateExpense(id, updates);
  };

  const addNote = async (item: NoteItem) => {
    let date = '';
    let shouldAdd = true;
    setState(prev => {
      // SaaS Logic: Free users can only create 3 notes total
      let totalNotes = prev.currentDayData.notes.length;
      prev.history.forEach(day => {
        totalNotes += (day.notes || []).length;
      });

      if (prev.userProfile.plan === 'Free' && totalNotes >= 3) {
        alert("Free plan limit reached. Upgrade to Pro to create unlimited notes.");
        shouldAdd = false;
        return prev;
      }
      date = prev.currentDayData.date;
      return {
        ...prev,
        currentDayData: { ...prev.currentDayData, notes: [...prev.currentDayData.notes, item] }
      };
    });
    
    if (shouldAdd) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) await supabaseService.createNote(session.user.id, date, item);
    }
  };

  const deleteExpense = async (id: string) => {
    setState(prev => ({
      ...prev,
      currentDayData: { ...prev.currentDayData, expenses: prev.currentDayData.expenses.filter(e => e.id !== id) }
    }));
    await supabaseService.deleteExpense(id);
  };

  const deleteNote = async (id: string) => {
    setState(prev => ({
      ...prev,
      currentDayData: { ...prev.currentDayData, notes: prev.currentDayData.notes.filter(n => n.id !== id) }
    }));
    await supabaseService.deleteNote(id);
  };

  const deleteHabit = async (id: string) => {
    setState(prev => ({
      ...prev,
      currentDayData: { ...prev.currentDayData, habits: prev.currentDayData.habits.filter(h => h.id !== id) }
    }));
    await supabaseService.deleteHabit(id);
  };

  const deleteScheduleTask = async (id: string) => {
    setState(prev => ({
      ...prev,
      currentDayData: { ...prev.currentDayData, schedule: prev.currentDayData.schedule.filter(s => s.id !== id) }
    }));
    await supabaseService.deleteSchedule(id);
  };

  const enableDemoMode = () => {
    const demoDate = getLogicalDate(state.userSettings.dayEndTime);
    setState(prev => ({
      ...prev,
      isDemoMode: true,
      userSettings: { ...prev.userSettings, name: 'Hasan (Demo)' },
      currentDayData: {
        date: demoDate,
        schedule: [
          { id: '1', timeStart: '09:00', timeEnd: '11:00', task: 'Deep Work: Coding', category: 'Work', status: 'completed' },
          { id: '2', timeStart: '11:30', timeEnd: '12:30', task: 'Gym Session', category: 'Fitness', status: 'completed' },
          { id: '3', timeStart: '13:00', timeEnd: '14:00', task: 'Lunch & Reading', category: 'Rest', status: 'completed' },
          { id: '4', timeStart: '15:30', timeEnd: '17:30', task: 'Blender Work', category: 'Work', status: 'in-progress' },
          { id: '5', timeStart: '18:00', timeEnd: '20:00', task: 'AI Learning', category: 'Learning', status: 'pending' },
        ],
        habits: [
          { id: '1', name: 'Gym', category: 'Fitness', streak: 14, target: 30, completedToday: true, color: 'bg-emerald-500' },
          { id: '2', name: 'AI Learning', category: 'Learning', streak: 9, target: 30, completedToday: false, color: 'bg-blue-500' },
          { id: '3', name: 'Reading', category: 'Learning', streak: 21, target: 30, completedToday: true, color: 'bg-purple-500' },
          { id: '4', name: 'Coding', category: 'Work', streak: 45, target: 100, completedToday: true, color: 'bg-[#ff2a2a]' },
        ],
        expenses: [
          { id: '1', title: 'Food', amount: 500, type: 'expense', category: 'Food', timestamp: new Date().toISOString() },
          { id: '2', title: 'Transport', amount: 200, type: 'expense', category: 'Transport', timestamp: new Date().toISOString() },
          { id: '3', title: 'Salary', amount: 50000, type: 'income', category: 'Salary', timestamp: new Date().toISOString() },
        ],
        notes: [
          { id: '1', title: 'Why editing took longer today', content: 'I got distracted by trying to find the perfect B-roll. Next time, I need to...', tags: ['Reflection', 'Editing'], timestamp: new Date().toISOString() },
          { id: '2', title: 'What went well today', content: 'Woke up at 4 AM and completed the hardest coding task before 8 AM. The...', tags: ['Win', 'Deep Work'], timestamp: new Date(Date.now() - 86400000).toISOString() },
        ]
      },
      // Add some fake history for analytics
      history: Array.from({ length: 30 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (30 - i));
        return {
          date: d.toISOString().split('T')[0],
          schedule: [
            { id: '1', timeStart: '09:00', timeEnd: '11:00', task: 'Work', category: 'Work', status: 'completed' }
          ],
          habits: [
            { id: '1', name: 'Gym', category: 'Fitness', streak: 1, target: 30, completedToday: Math.random() > 0.2, color: 'bg-emerald-500' }
          ],
          expenses: [
            { id: '1', title: 'Food', amount: 500, type: 'expense', category: 'Food', timestamp: d.toISOString() }
          ],
          notes: []
        };
      })
    }));
  };

  const disableDemoMode = () => {
    setState(prev => prev.isDemoMode ? { ...defaultState, exchangeRatesCache: prev.exchangeRatesCache } : prev);
  };

  return (
    <AppContext.Provider value={{
      ...state,
      syncError,
      isStateLoaded,
      updateSettings,
      updateProfile,
      applySubscription,
      addSchedule,
      updateSchedule,
      clearSchedule,
      clearExpenses,
      undoSchedule,
      saveScheduleTemplate,
      loadScheduleTemplate,
      deleteScheduleTemplate,
      addHabit,
      updateHabit,
      toggleHabit,
      addExpense,
      updateExpense,
      deleteExpense,
      addNote,
      deleteNote,
      deleteHabit,
      deleteScheduleTask,
      enableDemoMode,
      disableDemoMode,
      checkAndResetDay,
      addNotification,
      markNotificationRead,
      clearNotifications,
      resetState,
      fetchExchangeRates,
      exchangeRatesOffline
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
