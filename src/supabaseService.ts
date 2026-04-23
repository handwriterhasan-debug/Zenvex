import { supabase } from './supabaseClient';
import { DailyData, ExpenseItem, HabitItem, NoteItem, ScheduleItem, UserProfile, UserSettings, SavedSchedule, NotificationItem } from './types';

export const supabaseService = {
  async loadUserData(userId: string) {
    // We wrap each fetch in a try/catch or use an array of promises with .catch() to prevent a single missing table from failing the entire load.
    const safeFetch = async (query: any) => {
      try {
        const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000));
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
      safeFetch(supabase.from('user_profiles').select('*').eq('id', userId).maybeSingle()),
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
      { data: profile }, { data: userProfile }, { data: settings },
      { data: schedules }, { data: habits }, { data: habitLogs },
      { data: expenses }, { data: notes }, { data: savedSchedules },
      { data: notifications }
    ] = fetches;
    
    // In case the settings table uses 'id' instead of 'user_id'
    let finalSettings = settings;
    if (!finalSettings && !hasError) {
      const { data: altSettings } = await safeFetch(supabase.from('user_settings').select('*').eq('id', userId).maybeSingle());
      finalSettings = altSettings;
    }

    const actualProfile = profile || userProfile;

    // Construct AppState from relational data
    const allDates = new Set(
      [
        ...(schedules || []).map(s => s.date),
        ...(habitLogs || []).map(h => h.completed_date),
        ...(expenses || []).map(e => e.date),
        ...(notes || []).map(n => n.date)
      ].filter(Boolean)
    );

    const history: DailyData[] = Array.from(allDates).map(date => {
      return {
        date,
        schedule: (schedules || []).filter(s => s.date === date).map(s => ({
          id: s.id,
          timeStart: s.time_start,
          timeEnd: s.time_end,
          task: s.task,
          category: s.category,
          status: s.status,
          actualHours: s.actual_hours,
          excuse: s.excuse
        })),
        habits: (habits || []).map(h => {
          const log = (habitLogs || []).find(l => l.habit_id === h.id && l.completed_date === date);
          return {
            id: h.id,
            name: h.name,
            category: h.category,
            target: h.target_days,
            color: h.color || '#10b981', // Fallback color
            startDate: h.created_at,
            completedToday: !!log,
            streak: h.streak || 0
          };
        }),
        expenses: (expenses || []).filter(e => e.date === date).map(e => ({
          id: e.id,
          title: e.title,
          amount: e.amount,
          type: e.type,
          category: e.category,
          customCategory: e.custom_category,
          source: e.source,
          timestamp: e.timestamp
        })),
        notes: (notes || []).filter(n => n.date === date).map(n => ({
          id: n.id,
          title: n.title,
          content: n.content,
          tags: n.tags,
          timestamp: n.timestamp,
          isExcuse: n.is_excuse
        }))
      };
    }).sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    return {
      hasError,
      profile: actualProfile ? {
        name: actualProfile.name,
        gender: actualProfile.gender || 'Not specified',
        age: actualProfile.age || 'Not specified',
        country: actualProfile.country || 'Not specified',
        plan: ((actualProfile.plan?.toLowerCase() === 'pro' || actualProfile.subscription_plan === 'pro') ? 'Pro' : 
              (actualProfile.plan?.toLowerCase() === 'premium' || actualProfile.subscription_plan === 'premium') ? 'Premium' : 'Free') as 'Free' | 'Pro' | 'Premium',
        disciplineScore: actualProfile.discipline_score || 0
      } : undefined,
      settings: (finalSettings || actualProfile) ? {
        name: actualProfile?.name || finalSettings?.name || 'User',
        dayEndTime: actualProfile?.day_end_time || finalSettings?.day_end_time || '23:59',
        theme: finalSettings?.theme || 'dark',
        initialBalance: finalSettings?.initial_balance || 0,
        savingsBalance: finalSettings?.savings_balance || 0,
        monthlyIncome: finalSettings?.monthly_income || 0,
        currency: finalSettings?.currency || 'PKR'
      } : undefined,
      history,
      savedSchedules: (savedSchedules || []).map(s => ({
        id: s.id,
        name: s.name,
        tasks: s.tasks
      })),
      notifications: (notifications || []).map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        timestamp: n.timestamp,
        read: n.read
      })),
      habits: (habits || []).map(h => ({
        id: h.id,
        name: h.name,
        category: h.category,
        target: h.target_days,
        color: h.color || '#10b981',
        startDate: h.created_at,
        completedToday: false,
        streak: h.streak || 0
      }))
    };
  },

  async createSchedule(userId: string, date: string, item: ScheduleItem) {
    const { data, error } = await supabase.from('schedules').insert({
      id: item.id,
      user_id: userId,
      date,
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
    if (updates.timeStart !== undefined) dbUpdates.time_start = updates.timeStart;
    if (updates.timeEnd !== undefined) dbUpdates.time_end = updates.timeEnd;
    if (updates.task !== undefined) dbUpdates.task = updates.task;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.actualHours !== undefined) dbUpdates.actual_hours = updates.actualHours;
    if (updates.excuse !== undefined) dbUpdates.excuse = updates.excuse;

    const { data, error } = await supabase.from('schedules').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteSchedule(id: string) {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (error) throw error;
  },

  async createHabit(userId: string, item: HabitItem) {
    const { data, error } = await supabase.from('habits').insert({
      id: item.id,
      user_id: userId,
      name: item.name,
      category: item.category,
      target_days: item.target,
      streak: item.streak || 0
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateHabit(id: string, updates: Partial<HabitItem>) {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.target !== undefined) dbUpdates.target_days = updates.target;
    if (updates.streak !== undefined) dbUpdates.streak = updates.streak;
    if (updates.color !== undefined) dbUpdates.color = updates.color;

    const { data, error } = await supabase.from('habits').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteHabit(id: string) {
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (error) throw error;
  },

  async upsertHabitLog(userId: string, habitId: string, date: string, completed: boolean) {
    if (completed) {
      const { data, error } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        user_id: userId,
        completed_date: date
      }).select().single();
      if (error) throw error;
      return data;
    } else {
      const { error } = await supabase.from('habit_logs')
        .delete()
        .match({ habit_id: habitId, user_id: userId, completed_date: date });
      if (error) throw error;
      return null;
    }
  },

  async createExpense(userId: string, date: string, item: ExpenseItem) {
    const { data, error } = await supabase.from('expenses').insert({
      id: item.id,
      user_id: userId,
      date,
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
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.customCategory !== undefined) dbUpdates.custom_category = updates.customCategory;
    if (updates.source !== undefined) dbUpdates.source = updates.source;

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
      date,
      title: item.title,
      content: item.content,
      tags: item.tags,
      timestamp: item.timestamp,
      is_excuse: item.isExcuse
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateNote(id: string, updates: Partial<NoteItem>) {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    const { data, error } = await supabase.from('notes').update(dbUpdates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteNote(id: string) {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
  },

  async upsertProfile(userId: string, profile: UserProfile) {
    const payload = {
      id: userId,
      name: profile.name,
      plan: profile.plan || 'Free', // for profiles
      subscription_plan: profile.plan?.toLowerCase() || 'free', // for user_profiles
      discipline_score: profile.disciplineScore || 0,
      updated_at: new Date().toISOString()
    };
    
    // Try profiles first, if fails try user_profiles
    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) {
      await supabase.from('user_profiles').upsert(payload, { onConflict: 'id' });
    }
    return payload;
  },

  async upsertSettings(userId: string, settings: UserSettings) {
    // Let's just update the specific fields in profile instead of upserting a minimal profile which might overwrite things
    const profilePayload = {
      id: userId,
      name: settings.name,
      updated_at: new Date().toISOString()
    };
    
    await supabase.from('profiles').update(profilePayload).eq('id', userId);
    await supabase.from('user_profiles').update(profilePayload).eq('id', userId);

    const payload = {
      user_id: userId,
      name: settings.name,
      day_end_time: settings.dayEndTime,
      theme: settings.theme,
      initial_balance: settings.initialBalance,
      savings_balance: settings.savingsBalance,
      monthly_income: settings.monthlyIncome,
      initial_expenses: settings.initialExpenses,
      currency: settings.currency,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
    if (error) {
      // If user_id conflict fails, try id
      const backupPayload = { ...payload, id: userId };
      delete backupPayload.user_id;
      await supabase.from('user_settings').upsert(backupPayload, { onConflict: 'id' });
    }
  },

  async createSavedSchedule(userId: string, item: SavedSchedule) {
    const { data, error } = await supabase.from('saved_schedules').insert({
      id: item.id,
      user_id: userId,
      name: item.name,
      tasks: item.tasks
    }).select().single();
    if (error) throw error;
    return data;
  },

  async deleteSavedSchedule(id: string) {
    const { error } = await supabase.from('saved_schedules').delete().eq('id', id);
    if (error) throw error;
  },

  async createNotification(userId: string, item: NotificationItem) {
    const { data, error } = await supabase.from('notifications').insert({
      id: item.id,
      user_id: userId,
      title: item.title,
      message: item.message,
      type: item.type,
      timestamp: item.timestamp,
      read: item.read
    }).select().single();
    if (error) throw error;
    return data;
  },

  async updateNotification(id: string, updates: Partial<NotificationItem>) {
    const { data, error } = await supabase.from('notifications').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteNotifications(userId: string) {
    const { error } = await supabase.from('notifications').delete().eq('user_id', userId);
    if (error) throw error;
  }
};
