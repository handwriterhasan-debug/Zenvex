import { motion, AnimatePresence } from 'motion/react';
import { Plus, Wallet, TrendingDown, TrendingUp, PieChart as PieChartIcon, Edit2, PiggyBank, CheckCircle2, Trash2, X, Search, ArrowUpRight, ArrowDownRight, ArrowDown, ArrowUp, ShoppingCart, CreditCard, Coffee, Zap, MoreVertical, Filter, Activity, Lock, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, LineChart, Line, AreaChart, Area } from 'recharts';

export default function Expenses() {
  const { currentDayData, addExpense, updateExpense, deleteExpense, clearExpenses, history, userSettings, updateSettings, userProfile, exchangeRatesCache, fetchExchangeRates } = useAppContext();
  const { expenses } = currentDayData;
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newExpense, setNewExpense] = useState({ 
    amount: '', 
    category: 'Food', 
    customCategory: '', 
    type: 'expense', 
    source: 'wallet',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [isEditingIncome, setIsEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState(userSettings.monthlyIncome?.toString() || '0');

  const [isEditingSavings, setIsEditingSavings] = useState(false);
  const [savingsInput, setSavingsInput] = useState(userSettings.savingsBalance?.toString() || '0');

  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletInput, setWalletInput] = useState(userSettings.initialBalance?.toString() || '0');

  const [isEditingExpenses, setIsEditingExpenses] = useState(false);
  const [expensesInput, setExpensesInput] = useState(userSettings.initialExpenses?.toString() || '0');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const categories = ['Food', 'Transport', 'Shopping', 'Clothes', 'Bills', 'Entertainment', 'Other'];
  const currencies = ['PKR', 'USD', 'EUR', 'SAR', 'GBP', 'INR', 'AED', 'CAD', 'AUD'];
  
  const isPro = userProfile.plan === 'Pro' || userProfile.plan === 'Premium';
  const currency = isPro ? (userSettings.currency || 'PKR') : 'PKR';
  const currencySymbols: Record<string, string> = { PKR: '₨', USD: '$', EUR: '€', SAR: '﷼', GBP: '£', INR: '₹', AED: 'د.إ', CAD: 'C$', AUD: 'A$' };
  const symbol = currencySymbols[currency] || currency;

  const getConvertedAmount = (amountInPKR: number) => {
    if (currency === 'PKR') return amountInPKR;
    if (!exchangeRatesCache?.rates || !exchangeRatesCache.rates['PKR']) return amountInPKR;
    const ratePKR = exchangeRatesCache.rates['PKR'];
    const rateTarget = exchangeRatesCache.rates[currency] || 1;
    return (amountInPKR / ratePKR) * rateTarget;
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const navigate = useNavigate();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAdd = () => {
    if (newExpense.amount && !isNaN(Number(newExpense.amount))) {
      const now = new Date();
      const selectedDate = new Date(newExpense.date);
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const inputAmount = Math.abs(Number(newExpense.amount));
      let amountNum = inputAmount;
      if (currency !== 'PKR' && exchangeRatesCache?.rates && exchangeRatesCache.rates['PKR']) {
        const ratePKR = exchangeRatesCache.rates['PKR'];
        const rateTarget = exchangeRatesCache.rates[currency] || 1;
        amountNum = (inputAmount / rateTarget) * ratePKR;
      }

      let remainingBalance = 0;
      if (newExpense.source === 'savings') {
        remainingBalance = newExpense.type === 'expense' ? currentSavings - amountNum : currentSavings + amountNum;
      } else {
        remainingBalance = newExpense.type === 'expense' ? currentWallet - amountNum : currentWallet + amountNum;
      }

      const expenseData = {
        title: newExpense.category === 'Other' && newExpense.customCategory ? newExpense.customCategory : newExpense.category,
        amount: amountNum,
        category: newExpense.category,
        customCategory: newExpense.customCategory,
        type: newExpense.type as 'income' | 'expense',
        source: newExpense.source as 'wallet' | 'savings',
        timestamp: selectedDate.toISOString(),
        remainingBalance
      };

      if (editingId) {
        updateExpense(editingId, expenseData);
        showToast('Transaction updated successfully');
      } else {
        addExpense({
          id: crypto.randomUUID(),
          ...expenseData
        });
        showToast('Transaction added successfully');
      }

      setIsAdding(false);
      setEditingId(null);
      setNewExpense({ 
        amount: '', 
        category: 'Food', 
        customCategory: '', 
        type: 'expense', 
        source: 'wallet',
        date: new Date().toISOString().split('T')[0]
      });
    } else {
      showToast('Please enter a valid amount');
    }
  };

  const handleEdit = (expense: any) => {
    setNewExpense({
      amount: expense.amount?.toString() || '0',
      category: expense.category || 'Food',
      customCategory: expense.customCategory || '',
      type: expense.type || 'expense',
      source: expense.source || 'wallet',
      date: expense.timestamp ? new Date(expense.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setEditingId(expense.id);
    setIsAdding(true);
  };

  // Calculate totals
  const allExpenses = [...expenses];
  history.forEach(day => {
    allExpenses.push(...(day.expenses || []));
  });

  const walletExpenses = allExpenses.filter(e => e.type === 'expense' && e.source !== 'savings').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const savingsExpenses = allExpenses.filter(e => e.type === 'expense' && e.source === 'savings').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  const walletIncomes = allExpenses.filter(e => e.type === 'income' && e.source !== 'savings').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const savingsIncomes = allExpenses.filter(e => e.type === 'income' && e.source === 'savings').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const monthlyIncome = userSettings.monthlyIncome || 0;
  const baseSavings = userSettings.savingsBalance || 0;

  const currentSavings = baseSavings + savingsIncomes - savingsExpenses;
  const currentWallet = monthlyIncome + currentSavings + walletIncomes - walletExpenses;
  const totalExpense = walletExpenses + savingsExpenses;

  const saveIncome = () => { 
    const inputAmount = Number(incomeInput) || 0;
    let amountInPKR = inputAmount;
    if (currency !== 'PKR' && exchangeRatesCache?.rates && exchangeRatesCache.rates['PKR']) {
      const ratePKR = exchangeRatesCache.rates['PKR'];
      const rateTarget = exchangeRatesCache.rates[currency] || 1;
      amountInPKR = (inputAmount / rateTarget) * ratePKR;
    }
    updateSettings({ monthlyIncome: amountInPKR }); 
    setIsEditingIncome(false); 
  };
  const saveSavings = () => { 
    const inputAmount = Number(savingsInput) || 0;
    let desiredInPKR = inputAmount;
    if (currency !== 'PKR' && exchangeRatesCache?.rates && exchangeRatesCache.rates['PKR']) {
      const ratePKR = exchangeRatesCache.rates['PKR'];
      const rateTarget = exchangeRatesCache.rates[currency] || 1;
      desiredInPKR = (inputAmount / rateTarget) * ratePKR;
    }
    updateSettings({ savingsBalance: desiredInPKR - savingsIncomes + savingsExpenses }); 
    setIsEditingSavings(false); 
  };

  // Calculate category breakdown for expenses
  const categoryTotals: Record<string, number> = {};
  allExpenses.filter(e => e.type === 'expense').forEach(e => {
    const catName = e.category === 'Other' && e.customCategory ? e.customCategory : e.category;
    categoryTotals[catName] = (categoryTotals[catName] || 0) + (Number(e.amount) || 0);
  });

  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([name, amount]) => ({
      name,
      amount,
      percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      color: getCategoryColor(name)
    }))
    .sort((a, b) => b.amount - a.amount);

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      'Food': 'bg-amber-500',
      'Shopping': 'bg-purple-500',
      'Clothes': 'bg-teal-500',
      'Transport': 'bg-blue-500',
      'Bills': 'bg-accent-primary',
      'Entertainment': 'bg-pink-500'
    };
    return colors[category] || 'bg-gray-500';
  }

  function getHexColor(twColor: string) {
    const hexMap: Record<string, string> = {
      'bg-amber-500': '#f59e0b',
      'bg-purple-500': '#a855f7',
      'bg-teal-500': '#14b8a6',
      'bg-blue-500': '#3b82f6',
      'bg-accent-primary': 'var(--accent-primary)',
      'bg-pink-500': '#ec4899',
      'bg-gray-500': '#6b7280'
    };
    return hexMap[twColor] || '#6b7280';
  }

  const filteredExpenses = allExpenses
    .filter(e => (e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (e.category || '').toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

  // Prepare data for BarChart (last 7 days)
  const last7DaysData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayExpenses = allExpenses
        .filter(e => e.type === 'expense' && e.timestamp?.startsWith(dateStr))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        
      const dayIncome = allExpenses
        .filter(e => e.type === 'income' && e.timestamp?.startsWith(dateStr))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        
      const daySavings = allExpenses
        .filter(e => e.type === 'income' && e.source === 'savings' && e.timestamp?.startsWith(dateStr))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        
      data.push({
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        Expense: dayExpenses,
        Income: dayIncome,
        Savings: daySavings
      });
    }
    return data;
  }, [allExpenses]);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 max-w-6xl mx-auto pb-20"
      >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2 text-text-main">Financial Overview</h1>
          <p className="text-text-muted">Track your income, expenses, and savings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select 
              value={currency}
              onChange={e => {
                if (!isPro) {
                  setShowUpgradePopup(true);
                  return;
                }
                updateSettings({ currency: e.target.value });
              }}
              className={`bg-surface-light border border-border-dim rounded-xl px-4 py-2.5 text-text-main focus:outline-none focus:border-emerald-500 text-sm font-medium appearance-none pr-8 ${!isPro ? 'cursor-pointer' : ''}`}
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {!isPro && (
              <div 
                className="absolute inset-0 z-10 cursor-pointer" 
                onClick={() => setShowUpgradePopup(true)}
              />
            )}
            {!isPro && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-accent-primary">
                <span className="text-xs">🔒</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowClearConfirm(true)}
            className="bg-accent-primary-dim hover:bg-accent-primary-border text-accent-primary px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-accent-primary-border"
            title="Clear All Expenses"
          >
            <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Clear All</span>
          </button>
          <button 
            onClick={() => {
              setIncomeInput(getConvertedAmount(monthlyIncome).toString());
              setIsEditingIncome(true);
            }}
            className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-blue-500/20"
            title="Update Salary"
          >
            <Edit2 className="w-4 h-4" /> <span className="hidden sm:inline">Update Salary</span>
          </button>
          <button 
            onClick={() => {
              setSavingsInput(getConvertedAmount(currentSavings).toString());
              setIsEditingSavings(true);
            }}
            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-purple-500/20"
            title="Update Savings"
          >
            <Edit2 className="w-4 h-4" /> <span className="hidden sm:inline">Update Savings</span>
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5" /> <span className="hidden sm:inline">Add Transaction</span>
          </button>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 text-blue-400">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold">Beta Feature</h3>
          <p className="text-sm opacity-80">Currency change features is in building mode, you can use it but sometime it give you mistake. In next update soon we will update everything Insha Allah.</p>
        </div>
      </div>

      {/* Top 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Card */}
        <div className="bg-surface border border-border-dim rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/10"></div>
          <div>
            <div className="flex items-center justify-between text-text-muted text-sm mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span>Total Wallet</span>
              </div>
            </div>
            <span className="text-3xl font-bold text-text-main tracking-tight">{symbol} {getConvertedAmount(currentWallet).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-text-muted mb-2">
              <span>Safe to spend</span>
              <span>{Math.min(100, Math.max(0, Math.round((currentWallet / Math.max(1, monthlyIncome)) * 100)))}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${currentWallet <= 0 ? 0 : Math.max(2, Math.min(100, (currentWallet / Math.max(1, monthlyIncome)) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Savings Card */}
        <div className="bg-surface border border-border-dim rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/10"></div>
          <div>
            <div className="flex items-center justify-between text-text-muted text-sm mb-4">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-blue-500" />
                <span>Total Savings</span>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isEditingSavings) {
                    saveSavings();
                  } else {
                    setSavingsInput(getConvertedAmount(currentSavings).toString());
                    setIsEditingSavings(true);
                  }
                }}
                className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors text-text-faint hover:text-text-main"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {isEditingSavings ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  value={savingsInput}
                  onChange={e => setSavingsInput(e.target.value)}
                  className="bg-surface-light border border-border-dim rounded-lg px-3 py-1.5 w-full text-text-main focus:outline-none focus:border-blue-500 text-lg"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveSavings()}
                />
                <button onClick={saveSavings} className="bg-blue-500 text-white p-1.5 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <span className="text-3xl font-bold text-text-main tracking-tight">{symbol} {getConvertedAmount(currentSavings).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            )}
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-text-muted mb-2">
              <span>Growth</span>
              <span className="text-blue-500">+{savingsIncomes > 0 ? (baseSavings > 0 ? Math.round((savingsIncomes / baseSavings) * 100) : 100) : 0}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${savingsIncomes <= 0 ? 0 : Math.max(2, Math.min(100, savingsIncomes > 0 ? (baseSavings > 0 ? Math.round((savingsIncomes / baseSavings) * 100) : 100) : 0))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-surface border border-border-dim rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/10"></div>
          <div>
            <div className="flex items-center justify-between text-text-muted text-sm mb-4">
              <div className="flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-emerald-500" />
                <span>Fixed Income</span>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isEditingIncome) {
                    saveIncome();
                  } else {
                    setIncomeInput(getConvertedAmount(monthlyIncome).toString());
                    setIsEditingIncome(true);
                  }
                }}
                className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors text-text-faint hover:text-text-main"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {isEditingIncome ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  value={incomeInput}
                  onChange={e => setIncomeInput(e.target.value)}
                  className="bg-surface-light border border-border-dim rounded-lg px-3 py-1.5 w-full text-text-main focus:outline-none focus:border-emerald-500 text-lg"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveIncome()}
                />
                <button onClick={saveIncome} className="bg-emerald-500 text-white p-1.5 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <span className="text-3xl font-bold text-text-main tracking-tight">{symbol} {getConvertedAmount(monthlyIncome).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            )}
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-text-muted mb-2">
              <span>Extra Incomes</span>
              <span className="text-emerald-500">+{walletIncomes.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-surface border border-border-dim rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary-dim rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-accent-primary-border"></div>
          <div>
            <div className="flex items-center justify-between text-text-muted text-sm mb-4">
              <div className="flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-accent-primary" />
                <span>Total Expenses</span>
              </div>
            </div>
            <span className="text-3xl font-bold text-text-main tracking-tight">{symbol} {getConvertedAmount(totalExpense).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-xs text-text-muted mb-2">
              <span>vs Income</span>
              <span className="text-accent-primary">{Math.round((totalExpense / Math.max(1, monthlyIncome + walletIncomes)) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-primary rounded-full transition-all duration-1000"
                style={{ width: `${totalExpense <= 0 ? 0 : Math.max(2, Math.min(100, (totalExpense / Math.max(1, monthlyIncome + walletIncomes)) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Spending Chart */}
        <div className="lg:col-span-2 bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2 text-text-main">
            <Activity className="w-5 h-5 text-emerald-500" />
            Spending History (Last 7 Days)
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} />
                <RechartsTooltip 
                  cursor={{ stroke: '#333' }}
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: number, name: string) => [`${symbol} ${getConvertedAmount(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, name]}
                />
                <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="Savings" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2 text-text-main">
            <PieChartIcon className="w-5 h-5 text-purple-500" />
            Where Money Goes
          </h2>
          {categoryBreakdown.length > 0 ? (
            <>
              <div className="h-[200px] w-full mb-6 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="amount"
                      stroke="none"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getHexColor(entry.color)} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-dim)', borderRadius: '12px', color: 'var(--text-main)' }}
                      formatter={(value: number) => [`${symbol} ${getConvertedAmount(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-sm text-text-muted">Total</span>
                  <span className="text-xl font-bold text-text-main">{symbol} {getConvertedAmount(totalExpense).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>
              <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                {categoryBreakdown.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${cat.color}`}></div>
                      <span className="text-sm text-text-muted">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-main">{symbol} {getConvertedAmount(cat.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      <span className="text-xs text-text-faint w-8 text-right">{cat.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-muted py-12">
              <PieChartIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>No expenses yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold font-display flex items-center gap-2 text-text-main">
            <MoreVertical className="w-5 h-5 text-text-muted" />
            Recent Transactions
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-surface-light border border-border-dim rounded-xl py-2 pl-10 pr-4 text-sm text-text-main focus:outline-none focus:border-border-strong transition-colors"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense, i) => (
              <div key={`${expense.id}-${i}`} className="group flex items-center justify-between p-3 sm:p-4 bg-surface border border-border-dim rounded-2xl hover:border-accent-primary-border transition-all shadow-sm gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                    expense.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-accent-primary-dim text-accent-primary'
                  }`}>
                    {expense.type === 'income' ? <ArrowDownRight className="w-5 h-5 sm:w-6 sm:h-6" /> : <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-text-main text-base sm:text-lg truncate">{expense.title}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-text-muted truncate">
                      <span>{new Date(expense.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span className="capitalize">{expense.source}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                  <div className="text-right">
                    <div className={`text-sm sm:text-base font-bold whitespace-nowrap ${expense.type === 'income' ? 'text-emerald-500' : 'text-text-main'}`}>
                      {expense.type === 'income' ? '+' : '-'}{symbol} {getConvertedAmount(expense.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    {expense.remainingBalance !== undefined && (
                      <div className="text-[10px] sm:text-xs text-text-muted mt-0.5 whitespace-nowrap">
                        Balance: {symbol} {getConvertedAmount(expense.remainingBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(expense)} className="p-1.5 sm:p-2 hover:bg-surface-hover rounded-lg text-text-faint hover:text-text-main transition-colors">
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button onClick={() => deleteExpense(expense.id)} className="p-1.5 sm:p-2 hover:bg-accent-primary-dim rounded-lg text-text-faint hover:text-accent-primary transition-colors">
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-border-dim rounded-2xl">
              <p className="text-text-muted">No transactions found.</p>
            </div>
          )}
        </div>
      </div>
      </motion.div>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface border border-border-dim rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-text-main mb-2">Clear All Expenses?</h3>
              <p className="text-text-muted mb-6">
                This will permanently delete all your expense transactions and reset your wallet, savings, and income balances to 0. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    clearExpenses();
                    showToast('All expenses cleared');
                    setShowClearConfirm(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-accent-primary hover:bg-accent-primary/90 text-white transition-colors"
                >
                  Yes, Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface border border-border-dim p-6 w-full max-w-md shadow-lg rounded-3xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold font-display text-text-main">
                  {editingId ? 'Edit Transaction' : 'New Transaction'}
                </h2>
                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="p-2 hover:bg-surface-hover rounded-full transition-colors text-text-muted hover:text-text-main">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Type Selection */}
                <div className="flex p-1 bg-surface-light rounded-xl border border-border-dim">
                  <button
                    onClick={() => setNewExpense({...newExpense, type: 'expense'})}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${newExpense.type === 'expense' ? 'bg-accent-primary text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
                  >
                    Expense
                  </button>
                  <button
                    onClick={() => setNewExpense({...newExpense, type: 'income'})}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${newExpense.type === 'income' ? 'bg-emerald-500 text-white shadow-md' : 'text-text-muted hover:text-text-main'}`}
                  >
                    Income
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-muted ml-1">Amount ({currency})</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint font-medium">{symbol}</span>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={newExpense.amount}
                      onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                      className="w-full bg-surface-light border border-border-dim rounded-xl py-3 pl-14 pr-4 text-text-main text-lg font-medium focus:outline-none focus:border-emerald-500/50 transition-colors"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-muted ml-1">Date</label>
                    <input 
                      type="date" 
                      value={newExpense.date}
                      onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                      className="w-full bg-surface-light border border-border-dim rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-muted ml-1">Source</label>
                    <select 
                      value={newExpense.source}
                      onChange={e => setNewExpense({...newExpense, source: e.target.value as 'wallet' | 'savings'})}
                      className="w-full bg-surface-light border border-border-dim rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                    >
                      <option value="wallet">Wallet</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-muted ml-1">Category</label>
                  <select 
                    value={newExpense.category}
                    onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                    className="w-full bg-surface-light border border-border-dim rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                {newExpense.category === 'Other' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-muted ml-1">Description</label>
                    <input 
                      type="text" 
                      placeholder="What was this for?" 
                      value={newExpense.customCategory}
                      onChange={e => setNewExpense({...newExpense, customCategory: e.target.value})}
                      className="w-full bg-surface-light border border-border-dim rounded-xl px-4 py-3 text-text-main focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="flex-1 py-3.5 bg-surface-light hover:bg-surface-hover text-text-main rounded-xl font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleAdd} className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20">
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpgradePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-surface border border-border-dim rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-accent-primary-dim rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-accent-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro Feature Locked</h3>
              <p className="text-gray-400 mb-6">
                Upgrade to Pro Plan to unlock multi-currency support and live exchange rates.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/subscription')}
                  className="w-full py-3 bg-accent-primary hover:bg-accent-primary-hover text-white rounded-xl font-bold transition-colors"
                >
                  Upgrade to Pro
                </button>
                <button 
                  onClick={() => setShowUpgradePopup(false)}
                  className="w-full py-3 bg-surface-light hover:bg-surface-hover text-text-main rounded-xl font-medium transition-colors"
                >
                  Maybe Later
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
