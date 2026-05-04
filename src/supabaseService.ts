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
      safeFetch(supabase.from('profile').select('*').eq('id', userId).maybeSingle()),
      safeFetch(supabase.from('tasks').select('*').eq('user_id', userId)),
      safeFetch(supabase.from('habits').select('*').eq('user_id', userId)),
      safeFetch(supabase.from('expenses').select('*').eq('user_id', userId)),
      safeFetch(supabase.from('notes').select('*').eq('user_id', userId))
    ]);

    const hasError = fetches.some(f => f.error != null);

    const [
      { data: profileRow },
      { data: tasksRow },
      { data: habitsRow },
      { data: expensesRow },
      { data: notesRow }
    ] = fetches;

    const actualProfile = profileRow || {};
    const settings = actualProfile.settings || {};
    const metadata = actualProfile.metadata || {};

    const schedules: any[] = tasksRow || [];
    // Only include active habits OR habits without is_active defined
    const habits: any[] = (habitsRow || []).filter(h => h.metadata?.is_active !== false);
    const expenses: any[] = expensesRow || [];
    const notes: any[] = notesRow || [];

    // Parse tasks back into ScheduleItems
    const parsedSchedules = schedules.map(s => {
      const meta = s.metadata || {};
      return {
        id: s.id,
        date: meta.date,
        timeStart: meta.timeStart || '',
        timeEnd: meta.timeEnd || '',
        task: s.title,
        category: meta.category || '',
        status: s.status,
        actualHours: meta.actualHours,
        excuse: meta.excuse
      };
    });

    // Parse habits back into HabitItems
    const parsedHabits = habits.map(h => {
      const meta = h.metadata || {};
      const dates = meta.completed_dates || [];
      
      const sortedDates = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      let streak = 0;
      // Generate today and yesterday using local timezone so it matches user's getLogicalDate output
      const today = new Date();
      const formatLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dToday = formatLocal(today);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dYesterday = formatLocal(yesterday);
      
      const dOptions = [dToday, dYesterday];
      let currentDate = sortedDates.includes(dOptions[0]) ? dOptions[0] : (sortedDates.includes(dOptions[1]) ? dOptions[1] : null);
      
      if (currentDate) {
        for (const date of sortedDates) {
          if (date === currentDate) {
            streak++;
            const prev = new Date(currentDate);
            prev.setDate(prev.getDate() - 1);
            currentDate = prev.toISOString().split('T')[0];
          } else {
            break;
          }
        }
      }

      return {
        id: h.id,
        name: h.name,
        category: meta.category || 'Fitness',
        target: meta.target || 30,
        color: meta.color || 'bg-blue-500',
        startDate: meta.startDate || (h.created_at || '').split('T')[0],
        completedToday: false, // Computed below
        streak: streak,
        completed_dates: dates
      };
    });

    // Parse expenses
    const parsedExpenses = expenses.map(e => {
      const meta = e.metadata || {};
      return {
        id: e.id,
        date: e.date,
        title: e.description || '', // Mapped title to description in db
        amount: Number(e.amount),
        type: meta.type || 'expense',
        category: e.category || '',
        customCategory: meta.customCategory,
        source: meta.source,
        timestamp: meta.timestamp || e.created_at
      };
    });

    // Parse notes
    const parsedNotes = notes.map(n => {
      const meta = n.metadata || {};
      return {
        id: n.id,
        date: meta.date,
        title: n.title || '',
        content: n.content || '',
        tags: meta.tags || [],
        timestamp: meta.timestamp || n.created_at,
        isExcuse: meta.isExcuse
      };
    });

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
            completedToday: h.completed_dates?.includes(date),
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
      profile: actualProfile ? {
        name: actualProfile.username || 'User',
        gender: metadata.gender || 'Not specified',
        age: metadata.age || 'Not specified',
        country: metadata.country || 'Not specified',
        plan: metadata.plan || 'Free',
        disciplineScore: metadata.disciplineScore || 0,
        avatarUrl: actualProfile.avatar_url
      } : undefined,
      settings: actualProfile ? {
        name: actualProfile.username || 'User',
        dayEndTime: settings.dayEndTime || '23:59',
        theme: settings.theme || 'dark',
        initialBalance: settings.initialBalance || 0,
        savingsBalance: settings.savingsBalance || 0,
        monthlyIncome: settings.monthlyIncome || 0,
        currency: settings.currency || 'PKR'
      } : undefined,
      history,
      habits: parsedHabits,
      savedSchedules: metadata.savedSchedules || [],
      notifications: metadata.notifications || []
    };
  },

  async createSchedule(userId: string, date: string, item: ScheduleItem) {
    const { data, error } = await supabase.from('tasks').insert({
      id: item.id,
      user_id: userId,
      title: item.task,
      description: item.category, // Map category to description
      status: item.status,
      due_date: new Date().toISOString(),
      order: 0,
      metadata: {
        date,
        timeStart: item.timeStart,
        timeEnd: item.timeEnd,
        category: item.category,
        actualHours: item.actualHours,
        excuse: item.excuse
      }
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateSchedule(id: string, updates: Partial<ScheduleItem>) {
    // First fetch existing to merge metadata
    const { data: existing } = await supabase.from('tasks').select('metadata').eq('id', id).single();
    const existingMeta = existing?.metadata || {};

    const dbUpdates: any = {};
    if (updates.task !== undefined) dbUpdates.title = updates.task;
    if (updates.category !== undefined) dbUpdates.description = updates.category;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const newMeta = { ...existingMeta };
    if (updates.timeStart !== undefined) newMeta.timeStart = updates.timeStart;
    if (updates.timeEnd !== undefined) newMeta.timeEnd = updates.timeEnd;
    if (updates.category !== undefined) newMeta.category = updates.category;
    if ('actualHours' in updates) newMeta.actualHours = updates.actualHours === undefined ? null : updates.actualHours;
    if ('excuse' in updates) newMeta.excuse = updates.excuse === undefined ? null : updates.excuse;
    dbUpdates.metadata = newMeta;

    const { data, error } = await supabase.from('tasks').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteSchedule(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },

  async createHabit(userId: string, item: HabitItem) {
    const { data, error } = await supabase.from('habits').insert({
      id: item.id,
      user_id: userId,
      name: item.name,
      metadata: {
        category: item.category,
        target: item.target,
        color: item.color,
        startDate: item.startDate,
        is_active: true,
        frequency: item.target.toString(),
        streak: item.streak || 0,
        completed_dates: []
      }
    }).select().single();
    if (error) {
       console.error("Habit create error", error);
       throw error;
    }
    return data;
  },

  async updateHabit(id: string, updates: Partial<HabitItem>) {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;

    const { data: existing } = await supabase.from('habits').select('metadata').eq('id', id).single();
    const existingMeta = existing?.metadata || {};
    
    const newMeta = { ...existingMeta };
    if (updates.target !== undefined) newMeta.frequency = updates.target.toString();
    if (updates.category !== undefined) newMeta.category = updates.category;
    if (updates.target !== undefined) newMeta.target = updates.target;
    if (updates.color !== undefined) newMeta.color = updates.color;
    if (updates.streak !== undefined) newMeta.streak = updates.streak;
    dbUpdates.metadata = newMeta;

    const { data, error } = await supabase.from('habits').update(dbUpdates).eq('id', id).select().single();
    if (error) {
       console.error("Habit update error", error);
       throw error;
    }
    return data;
  },

  async deleteHabit(id: string) {
    const { data: existing } = await supabase.from('habits').select('metadata').eq('id', id).single();
    const existingMeta = existing?.metadata || {};
    const newMeta = { ...existingMeta, is_active: false };
    const { error } = await supabase.from('habits').update({ metadata: newMeta }).eq('id', id);
    if (error) throw error;
  },

  async upsertHabitLog(userId: string, habitId: string, date: string, completed: boolean) {
    const { data: existing } = await supabase.from('habits').select('metadata').eq('id', habitId).single();
    if (!existing) return;

    const meta = existing.metadata || {};
    let dates = meta.completed_dates || [];
    let streak = meta.streak || 0;

    if (completed && !dates.includes(date)) {
      dates.push(date);
      streak += 1;
    } else if (!completed && dates.includes(date)) {
      dates = dates.filter((d: string) => d !== date);
      streak = Math.max(0, streak - 1);
    }

    const { data, error } = await supabase.from('habits').update({
      metadata: { ...meta, completed_dates: dates, streak: streak }
    }).eq('id', habitId).select().single();

    if (error) throw error;
    return data;
  },

  async createExpense(userId: string, date: string, item: ExpenseItem) {
    const { data, error } = await supabase.from('expenses').insert({
      id: item.id,
      user_id: userId,
      amount: item.amount,
      category: item.category,
      description: item.title,
      date: date,
      metadata: {
        type: item.type,
        customCategory: item.customCategory,
        source: item.source,
        timestamp: item.timestamp
      }
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateExpense(id: string, updates: Partial<ExpenseItem>) {
    const { data: existing } = await supabase.from('expenses').select('metadata').eq('id', id).single();
    const existingMeta = existing?.metadata || {};

    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.description = updates.title;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.category !== undefined) dbUpdates.category = updates.category;

    const newMeta = { ...existingMeta };
    if (updates.type !== undefined) newMeta.type = updates.type;
    if (updates.customCategory !== undefined) newMeta.customCategory = updates.customCategory;
    if (updates.source !== undefined) newMeta.source = updates.source;
    if (updates.timestamp !== undefined) newMeta.timestamp = updates.timestamp;
    dbUpdates.metadata = newMeta;

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
      title: item.title,
      content: item.content,
      metadata: {
        date,
        tags: item.tags,
        timestamp: item.timestamp,
        isExcuse: item.isExcuse
      }
    }).select().single();
    if (error) throw error;
    return data;
  },

  async deleteNote(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data: existing } = await supabase.from('profile').select('metadata').eq('id', userId).single();
    const existingMeta = existing?.metadata || {};
    
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.username = updates.name;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    
    const newMeta = { ...existingMeta, ...updates };
    dbUpdates.metadata = newMeta;
    
    const { data, error } = await supabase.from('profile').update(dbUpdates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async updateSettings(userId: string, updates: Partial<UserSettings>) {
    const { data: existing } = await supabase.from('profile').select('settings, metadata, username').eq('id', userId).single();
    
    const dbUpdates: any = {};
    if (updates.name !== undefined) {
      dbUpdates.username = updates.name; // Keep name in sync with username
    }
    
    const newSettings = { ...(existing?.settings || {}), ...updates };
    dbUpdates.settings = newSettings;
    
    // Create profile if doesn't exist
    if (!existing) {
       const { error } = await supabase.from('profile').insert({
         id: userId,
         username: updates.name,
         settings: newSettings
       });
       if (error) throw error;
       return;
    }

    const { data, error } = await supabase.from('profile').update(dbUpdates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async updateNotifications(userId: string, notifications: unknown[]) {
    const { data: existing } = await supabase.from('profile').select('metadata').eq('id', userId).single();
    const newMeta = { ...(existing?.metadata || {}), notifications };
    const { error } = await supabase.from('profile').update({ metadata: newMeta }).eq('id', userId);
    if (error) throw error;
  },

  async updateSavedSchedules(userId: string, schedules: unknown[]) {
     const { data: existing } = await supabase.from('profile').select('metadata').eq('id', userId).single();
     const newMeta = { ...(existing?.metadata || {}), savedSchedules: schedules };
     const { error } = await supabase.from('profile').update({ metadata: newMeta }).eq('id', userId);
     if (error) throw error;
  }
};
