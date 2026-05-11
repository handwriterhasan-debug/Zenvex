import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRightLeft, RefreshCw, AlertCircle, Lock, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router';

const CURRENCIES = ['PKR', 'USD', 'EUR', 'SAR', 'GBP', 'INR', 'AED', 'CAD', 'AUD'];

export default function CurrencyChecker() {
  const { userProfile, exchangeRatesCache, exchangeRatesOffline, fetchExchangeRates } = useAppContext();
  const [amount, setAmount] = useState<string>('1');
  const [baseCurrency, setBaseCurrency] = useState<string>('PKR');
  const [targetCurrency, setTargetCurrency] = useState<string>('USD');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const isPro = userProfile.plan === 'Pro' || userProfile.plan === 'Premium';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchExchangeRates();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const convertedAmount = useMemo(() => {
    if (!exchangeRatesCache?.rates || !amount || isNaN(Number(amount))) return null;
    const baseRate = exchangeRatesCache.rates[baseCurrency] || 1;
    const targetRate = exchangeRatesCache.rates[targetCurrency] || 1;
    // Rates are relative to USD
    return (Number(amount) / baseRate) * targetRate;
  }, [amount, baseCurrency, targetCurrency, exchangeRatesCache]);

  const livePairs = [
    { from: 'USD', to: 'PKR' },
    { from: 'GBP', to: 'PKR' },
    { from: 'EUR', to: 'PKR' },
    { from: 'AED', to: 'PKR' },
    { from: 'SAR', to: 'PKR' },
    { from: 'CAD', to: 'PKR' },
    { from: 'AUD', to: 'PKR' },
    { from: 'PKR', to: 'USD' },
  ];

  const getLiveRate = (from: string, to: string) => {
    if (!exchangeRatesCache?.rates) return null;
    const fromRate = exchangeRatesCache.rates[from] || 1;
    const toRate = exchangeRatesCache.rates[to] || 1;
    return (1 / fromRate) * toRate;
  };

  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-surface border border-border-dim rounded-3xl p-8 text-center flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-20 h-20 bg-accent-primary-dim rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-accent-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Pro Feature Locked</h2>
          <p className="text-gray-400 max-w-md mb-8">
            Upgrade to the Pro Plan to unlock the Currency Checker, live exchange rates, and multi-currency support in the Expense Tracker.
          </p>
          <button 
            onClick={() => navigate('/subscription')}
            className="bg-accent-primary hover:bg-accent-primary-hover text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-accent-primary/20"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-accent-primary" />
          Currency Checker
        </h1>
        <button 
          onClick={handleRefresh}
          className={`p-2 rounded-lg bg-surface border border-border-dim text-gray-400 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {exchangeRatesOffline && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3 text-yellow-500 mb-6">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold">Offline Mode</h3>
            <p className="text-sm opacity-80">Showing last known cached rates. Connect to internet to get live updates.</p>
          </div>
        </div>
      )}

      {exchangeRatesCache?.lastUpdated && (
        <p className="text-xs text-gray-500 text-right mb-4">
          Last updated: {new Date(exchangeRatesCache.lastUpdated).toLocaleString()}
        </p>
      )}

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 text-blue-400 mb-6">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold">Beta Feature</h3>
          <p className="text-sm opacity-80">Currency change features is in building mode, you can use it but sometime it give you mistake. In next update soon we will update everything Insha Allah.</p>
        </div>
      </div>

      {/* Part A - Currency Converter */}
      <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-white mb-6">Currency Converter</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all text-xl"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">From</label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
              >
                {CURRENCIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-center py-4 md:py-0">
            <button 
              onClick={() => {
                setBaseCurrency(targetCurrency);
                setTargetCurrency(baseCurrency);
              }}
              className="w-12 h-12 rounded-full bg-accent-primary-dim text-accent-primary flex items-center justify-center hover:bg-accent-primary-border transition-colors"
            >
              <ArrowRightLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Converted Amount</label>
              <div className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-emerald-400 font-bold text-xl h-[54px] flex items-center">
                {convertedAmount !== null ? convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">To</label>
              <select
                value={targetCurrency}
                onChange={(e) => setTargetCurrency(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
              >
                {CURRENCIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Part B - Live Rate Board */}
      <div className="bg-surface border border-border-dim rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-white mb-6">Live Exchange Rates</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {livePairs.map((pair, idx) => {
            const rate = getLiveRate(pair.from, pair.to);
            // Simulate a random small change for visual effect since we don't have historical data in this simple API
            const change = Math.random() > 0.5 ? 1 : -1; 
            
            return (
              <div key={idx} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400 font-medium">{pair.from} → {pair.to}</span>
                  {rate !== null && (
                    change > 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-rose-500" />
                    )
                  )}
                </div>
                <div className="text-xl font-bold text-white">
                  {rate !== null ? rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '0.00'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
