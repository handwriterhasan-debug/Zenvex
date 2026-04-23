export interface ScheduleItem {
  id: string;
  timeStart: string;
  timeEnd: string;
  task: string;
  category: string;
  status: 'pending' | 'in-progress' | 'completed' | 'incomplete';
  actualHours?: number;
  excuse?: string;
}

export interface SavedSchedule {
  id: string;
  name: string;
  tasks: Omit<ScheduleItem, 'id' | 'status'>[];
}

export interface HabitItem {
  id: string;
  name: string;
  category: string;
  streak: number;
  target: number;
  completedToday: boolean;
  color: string;
  startDate?: string;
}

export interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  customCategory?: string;
  source?: 'wallet' | 'savings';
  timestamp: string;
  remainingBalance?: number;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  timestamp: string;
  isExcuse?: boolean;
}

export interface DailyData {
  date: string; // The logical date this data belongs to (YYYY-MM-DD)
  schedule: ScheduleItem[];
  habits: HabitItem[];
  expenses: ExpenseItem[];
  notes: NoteItem[];
}

export interface UserProfile {
  name: string;
  gender: string;
  age: string;
  country: string;
  plan: 'Free' | 'Pro' | 'Premium';
  disciplineScore?: number;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  usedCoupon?: string;
  avatarUrl?: string;
}

export interface UserSettings {
  name: string;
  dayEndTime: string; // "HH:mm" format, e.g., "23:59" or "04:00"
  theme: 'dark' | 'light';
  initialBalance?: number;
  savingsBalance?: number;
  monthlyIncome?: number;
  initialExpenses?: number;
  currency?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
}

export interface AppState {
  userSettings: UserSettings;
  userProfile: UserProfile;
  currentDayData: DailyData;
  history: DailyData[];
  savedSchedules: SavedSchedule[];
  isDemoMode: boolean;
  previousSchedule?: ScheduleItem[];
  notifications: NotificationItem[];
  exchangeRatesCache?: {
    rates: Record<string, number>;
    lastUpdated: string;
  };
}
