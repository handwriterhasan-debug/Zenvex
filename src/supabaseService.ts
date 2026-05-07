import { supabase } from './supabaseClient';
import { DailyData, ExpenseItem, HabitItem, NoteItem, ScheduleItem, UserProfile, UserSettings, SavedSchedule, NotificationItem } from './types';

export const supabaseService = {
  async loadUserData(userId: string) {
    const safeFetch = async (query: any) => {
      try {
        const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 10000));
        return await Promise.race([query, timeoutPromise]);
      } catch (e: any) {
        if (e.message !== 'Query timeout') {
          console.warn('Table fetch error:', e);
        }
        return { data: null, error: e };
      }
    };

    const fetches = await Promise.all([
      safeFetch(supabase.from('profiles').select('*').eq('id', userId).maybeSingle()),
      safeFetch(supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()),
      safeFetch(supabase.from('schedules').select('*').eq('user_id', userId)),
      safeFetch(supabase.from('habits').select('*').eq('user_id', userId)),
      safeFetch(supabase.from('habit_logs').select('*').eq('user_id', userId)),
      safeFetch(supabase.from('expenses').select('*').eq('user_id', userId)),
      safeFetch(supabase.from('notes').select('*').eq('user_id', userId)),
      safeFetch(supabase.from('saved_schedules').select('*').eq('user_id', userId)),
      safeFetch(supabase.from('notifications').select('*').eq('user_id', userId))
    ]);

    const hasError = fetches.some(f => f.error != null);

    const [
      { data: profileRow },
      { data: settingsRow },
      { data: schedulesRow },
      { data: habitsRow },
      { data: habitLogsRow },
      { data: expensesRow },
      { data: notesRow },
      { data: savedSchedulesRow },
      { data: notificationsRow }
    ] = fetches;

    const actualProfile = profileRow || {};
    const settings = settingsRow || {};

    const schedules: any[] = schedulesRow || [];
    const habits: any[] = habitsRow || [];
    const habitLogs: any[] = habitLogsRow || [];
    const expenses: any[] = expensesRow || [];
    const notes: any[] = notesRow || [];

    // Parse schedules
    const parsedSchedules = schedules.map(s => ({
      id: s.id,
      date: s.date,
      timeStart: s.time_start || '',
      timeEnd: s.time_end || '',
      task: s.task || '',
      category: s.category || '',
      status: s.status || 'pending',
      actualHours: s.actual_hours ? Number(s.actual_hours) : undefined,
      excuse: s.excuse
    }));

    // Parse habits
    const defaultColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
    const parsedHabits = habits.map((h, i) => {
      const logsForHabit = habitLogs.filter(l => l.habit_id === h.id).map(l => l.completed_date);
      return {
        id: h.id,
        name: h.name,
        category: h.category || 'Fitness',
        target: h.target_days ? Number(h.target_days) : 7,
        color: defaultColors[i % defaultColors.length], // Fallback since color isn't in DB
        startDate: (h.created_at || new Date().toISOString()).split('T')[0],
        completedToday: false, // Computed below based on date
        streak: h.streak ? Number(h.streak) : 0,
        completed_dates: logsForHabit
      };
    });

    // Parse expenses
    const parsedExpenses = expenses.map(e => ({
      id: e.id,
      date: e.date,
      title: e.title || '',
      amount: Number(e.amount),
      type: e.type || 'expense',
      category: e.category || '',
      customCategory: e.custom_category,
      source: e.source,
      timestamp: e.timestamp || e.created_at
    }));

    // Parse notes
    const parsedNotes = notes.map(n => ({
      id: n.id,
      date: n.date,
      title: n.title || '',
      content: n.content || '',
      tags: n.tags || [],
      timestamp: n.timestamp || n.created_at,
      isExcuse: !!n.is_excuse
    }));

    // Parse templates
    const savedSchedules = (savedSchedulesRow || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      tasks: s.tasks || []
    }));

    // Construct AppState from relational data
    const allDates = new Set([
      ...parsedSchedules.map(s => s.date),
      ...parsedHabits.flatMap(h => h.completed_dates || []),
      ...parsedExpenses.map(e => e.date),
      ...parsedNotes.map(n => n.date)
    ].filter(Boolean));

    const history: DailyData[] = Array.from(allDates).map(date => {
      return {
        date,
        schedule: parsedSchedules.filter(s => s.date === date).map(s => ({
          id: s.id,
          timeStart: s.timeStart,
          timeEnd: s.timeEnd,
          task: s.task,
          category: s.category,
          status: s.status,
          actualHours: s.actualHours,
          excuse: s.excuse
        })).sort((a, b) => a.timeStart.localeCompare(b.timeStart)),
        habits: parsedHabits.map(h => {
          return {
            id: h.id,
            name: h.name,
            category: h.category,
            target: h.target,
            color: h.color,
            startDate: h.startDate,
            completedToday: h.completed_dates.includes(date),
            streak: h.streak
          };
        }),
        expenses: parsedExpenses.filter(e => e.date === date).map(e => ({
          id: e.id,
          title: e.title,
          amount: e.amount,
          type: e.type,
          category: e.category,
          customCategory: e.customCategory,
          source: e.source,
          timestamp: e.timestamp
        })),
        notes: parsedNotes.filter(n => n.date === date).map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          tags: n.tags,
          timestamp: n.timestamp,
          isExcuse: n.isExcuse
        }))
      };
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    return {
      hasError,
      profile: actualProfile && Object.keys(actualProfile).length > 0 ? {
        name: actualProfile.name || 'User',
        gender: actualProfile.gender || 'Not specified',
        age: actualProfile.age || 'Not specified',
        country: actualProfile.country || 'Not specified',
        plan: actualProfile.plan || 'Free',
        disciplineScore: actualProfile.discipline_score ? Number(actualProfile.discipline_score) : 0,
        avatarUrl: actualProfile.avatar_url
      } : undefined,
      settings: settings && Object.keys(settings).length > 0 ? {
        name: settings.name || 'User',
        dayEndTime: settings.day_end_time || '23:59',
        theme: settings.theme || 'dark',
        initialBalance: settings.initial_balance ? Number(settings.initial_balance) : 0,
        savingsBalance: settings.savings_balance ? Number(settings.savings_balance) : 0,
        monthlyIncome: settings.monthly_income ? Number(settings.monthly_income) : 0,
        currency: settings.currency || 'USD'
      } : undefined,
      history,
      habits: parsedHabits,
      savedSchedules,
      notifications: notificationsRow || []
    };
  },

  async createSchedule(userId: string, date: string, item: ScheduleItem) {
    const { data, error } = await supabase.from('schedules').insert({
      id: item.id,
      user_id: userId,
      date: date,
      time_start: item.timeStart,
      time_end: item.timeEnd,
      task: item.task,
      category: item.category,
      status: item.status,
      actual_hours: item.actualHours,
      excuse: item.excuse
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateSchedule(id: string, updates: Partial<ScheduleItem>) {
    const dbUpdates: any = {};
    if (updates.task !== undefined) dbUpdates.task = updates.task;
    if (updates.timeStart !== undefined) dbUpdates.time_start = updates.timeStart;
    if (updates.timeEnd !== undefined) dbUpdates.time_end = updates.timeEnd;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if ('actualHours' in updates) dbUpdates.actual_hours = updates.actualHours;
    if ('excuse' in updates) dbUpdates.excuse = updates.excuse;

    const { data, error } = await supabase.from('schedules').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteSchedule(id: string) {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) throw error;
  },

  async createHabit(userId: string, item: HabitItem) {
    const payload: any = {
      id: item.id,
      user_id: userId,
      name: item.name,
      category: item.category,
      target_days: item.target,
      streak: item.streak || 0
    };
    
    let { data, error } = await supabase.from('habits').insert(payload).select().single();
    if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('streak'))) {
      delete payload.streak;
      const fallback = await supabase.from('habits').insert(payload).select().single();
      data = fallback.data;
      error = fallback.error;
    }
    if (error) throw error;
    return data;
  },

  async updateHabit(id: string, updates: Partial<HabitItem>) {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
    if (updates.target !== undefined) dbUpdates.target_days = updates.target;
    if (updates.category !== undefined) dbUpdates.category = updates.category;

    if (Object.keys(dbUpdates).length === 0) return null;

    let { data, error } = await supabase.from('habits').update(dbUpdates).eq('id', id).select().single();
    if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('streak'))) {
      delete dbUpdates.streak;
      if (Object.keys(dbUpdates).length > 0) {
        const fallback = await supabase.from('habits').update(dbUpdates).eq('id', id).select().single();
        data = fallback.data;
        error = fallback.error;
      } else {
        return null; // Nothing left to update
      }
    }
    if (error) throw error;
    return data;
  },

  async deleteHabit(id: string) {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) throw error;
  },

  async upsertHabitLog(userId: string, habitId: string, date: string, completed: boolean) {
    if (completed) {
      const { error } = await supabase.from('habit_logs').insert({
        user_id: userId,
        habit_id: habitId,
        completed_date: date
      });
      if (error && !error.message.includes('duplicate key')) throw error;
    } else {
      const { error } = await supabase.from('habit_logs').delete()
        .eq('habit_id', habitId)
        .eq('completed_date', date);
      if (error) throw error;
    }
  },

  async createExpense(userId: string, date: string, item: ExpenseItem) {
    const { data, error } = await supabase.from('expenses').insert({
      id: item.id,
      user_id: userId,
      date: date,
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category,
      custom_category: item.customCategory,
      source: item.source,
      timestamp: item.timestamp
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateExpense(id: string, updates: Partial<ExpenseItem>) {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.customCategory !== undefined) dbUpdates.custom_category = updates.customCategory;
    if (updates.source !== undefined) dbUpdates.source = updates.source;
    if (updates.timestamp !== undefined) dbUpdates.timestamp = updates.timestamp;

    const { data, error } = await supabase.from('expenses').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteExpense(id: string) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  },

  async createNote(userId: string, date: string, item: NoteItem) {
    const { data, error } = await supabase.from('notes').insert({
      id: item.id,
      user_id: userId,
      date: date,
      title: item.title,
      content: item.content,
      tags: item.tags,
      is_excuse: item.isExcuse,
      timestamp: item.timestamp
    }).select().single();
    if (error) throw error;
    return data;
  },

  async deleteNote(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.age !== undefined) dbUpdates.age = updates.age;
    if (updates.country !== undefined) dbUpdates.country = updates.country;
    if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
    if (updates.disciplineScore !== undefined) dbUpdates.discipline_score = updates.disciplineScore;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

    const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).single();
    if (!existing) {
       await supabase.from('profiles').insert({ id: userId, ...dbUpdates });
       return;
    }

    const { data, error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async updateSettings(userId: string, updates: Partial<UserSettings>) {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.dayEndTime !== undefined) dbUpdates.day_end_time = updates.dayEndTime;
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
    if (updates.initialBalance !== undefined) dbUpdates.initial_balance = updates.initialBalance;
    if (updates.savingsBalance !== undefined) dbUpdates.savings_balance = updates.savingsBalance;
    if (updates.monthlyIncome !== undefined) dbUpdates.monthly_income = updates.monthlyIncome;
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency;

    const { data: existing } = await supabase.from('user_settings').select('user_id').eq('user_id', userId).single();
    if (!existing) {
       await supabase.from('user_settings').insert({ user_id: userId, ...dbUpdates });
       return;
    }

    const { data, error } = await supabase.from('user_settings').update(dbUpdates).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async updateNotifications(userId: string, notifications: unknown[]) {},
  async updateSavedSchedules(userId: string, schedules: unknown[]) {}
};
