import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, CheckCircle2, Star, Zap, Shield, Gift, Lock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState } from 'react';

export default function Subscription() {
  const { userProfile, applySubscription } = useAppContext();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;
    
    const code = couponCode.trim().toLowerCase();

    if (code === '1856hk') {
      setAppliedCoupon(code);
      applySubscription('Pro', 90, code);
      setCouponMessage({ text: 'Coupon applied! 3 Months Pro plan unlocked.', type: 'success' });
      showToast('Success! 3 Months Pro plan unlocked.');
    } else if (code === 'leftricks' || code === 'access') {
      setAppliedCoupon(code);
      applySubscription('Pro', 9999, code);
      setCouponMessage({ text: 'Admin access granted: Lifetime Pro plan unlocked.', type: 'success' });
      showToast('Success! Lifetime Pro plan unlocked.');
    } else {
      setAppliedCoupon(null);
      setCouponMessage({ text: 'Invalid coupon code.', type: 'error' });
    }
  };

  const handleSubscribe = (plan: 'Free' | 'Pro' | 'Premium') => {
    if (plan === 'Free') {
      applySubscription('Free', 0);
      showToast('You are now on the Free plan.');
      return;
    }

    if (plan === 'Pro') {
      showToast('Pro plan is currently locked and under consideration.');
    }

    if (plan === 'Premium') {
      showToast('Premium plan is currently locked and under consideration.');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-8"
      >
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold font-display tracking-tight">Upgrade Your Planning</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Unlock smart infographics, daily rewards, and advanced analytics to take your productivity to the next level.
        </p>
      </div>

      {/* Coupon Section */}
      <div className="max-w-md mx-auto bg-surface border border-border-dim rounded-3xl p-6 mb-12 shadow-sm">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Gift className="w-5 h-5 text-[#ff2a2a]" />
          Have a coupon code?
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter code (optional)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1 bg-black/40 border border-white/5 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#ff2a2a]"
          />
          <button
            onClick={handleApplyCoupon}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors"
          >
            Apply
          </button>
        </div>
        {couponMessage && (
          <p className={`mt-2 text-sm ${couponMessage.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
            {couponMessage.text}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <div className={`bg-surface p-8 rounded-3xl border-2 flex flex-col shadow-sm ${userProfile.plan === 'Free' ? 'border-accent-primary' : 'border-border-dim'}`}>
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-gray-400">/ forever</span>
            </div>
            <p className="text-gray-400 mt-4 text-sm">Basic features to get you started on your journey.</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-gray-500 shrink-0" />
              <span>Basic Schedule Planner</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-gray-500 shrink-0" />
              <span>Habit Tracking</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-gray-500 shrink-0" />
              <span>Expense Logging</span>
            </li>
          </ul>
          <button
            onClick={() => handleSubscribe('Free')}
            disabled={userProfile.plan === 'Free'}
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              userProfile.plan === 'Free' 
                ? 'bg-white/5 text-gray-400 cursor-not-allowed border border-white/5' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            {userProfile.plan === 'Free' ? 'Current Plan' : 'Downgrade to Free'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className={`bg-surface p-8 rounded-3xl border-2 flex flex-col relative shadow-sm ${userProfile.plan === 'Pro' ? 'border-accent-primary' : 'border-border-dim opacity-70'}`}>
          {userProfile.plan !== 'Pro' && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-3xl z-10 flex flex-col items-center justify-center p-6 text-center">
              <Lock className="w-12 h-12 text-amber-400/50 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">Coming Soon</h4>
              <p className="text-sm text-gray-300">This tier is currently in building process.</p>
            </div>
          )}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Pro
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">$3</span>
              <span className="text-gray-400">/ month</span>
            </div>
            <p className="text-gray-400 mt-4 text-sm">Unlock smart infographics and advanced analytics.</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Everything in Free</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Smart Infographics Dashboard</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Advanced Analytics View</span>
            </li>
            <li className="flex items-start gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Currency Converter</span>
            </li>
          </ul>
          <button
            disabled
            className={`w-full py-3 rounded-xl font-bold transition-all ${
              userProfile.plan === 'Pro' 
                ? 'bg-white/5 text-gray-400 cursor-not-allowed border border-white/5' 
                : 'bg-white/5 text-gray-600 cursor-not-allowed border border-white/5'
            }`}
          >
            {userProfile.plan === 'Pro' ? 'Current Plan' : 'Locked'}
          </button>
        </div>

        {/* Premium Plan */}
        <div className="bg-surface p-8 rounded-3xl border-2 border-border-dim flex flex-col relative opacity-70 shadow-sm">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider z-20 whitespace-nowrap shadow-lg">
            Offer ends in 2 weeks!
          </div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] rounded-3xl z-10 flex flex-col items-center justify-center p-6 text-center">
            <Lock className="w-12 h-12 text-gray-400 mb-4" />
            <h4 className="text-xl font-bold text-white mb-2">Coming Soon</h4>
            <p className="text-sm text-gray-300">This tier is under consideration and we are currently building it.</p>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Star className="w-5 h-5 text-gray-500" /> Premium
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-500">$7</span>
              <span className="text-gray-600">/ month</span>
            </div>
            <p className="text-gray-500 mt-4 text-sm">The ultimate experience with daily rewards and bonuses.</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm text-gray-500">
              <CheckCircle2 className="w-5 h-5 text-gray-600 shrink-0" />
              <span>Everything in Pro</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-500">
              <CheckCircle2 className="w-5 h-5 text-gray-600 shrink-0" />
              <span>Daily "Good Days" Rewards</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-500">
              <CheckCircle2 className="w-5 h-5 text-gray-600 shrink-0" />
              <span>Premium Badges & Status</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-gray-500">
              <CheckCircle2 className="w-5 h-5 text-gray-600 shrink-0" />
              <span>Priority Support</span>
            </li>
          </ul>
          <button
            disabled
            className="w-full py-3 rounded-xl font-bold bg-white/5 text-gray-600 cursor-not-allowed border border-white/5"
          >
            Locked
          </button>
        </div>
      </div>
      </motion.div>

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-[#222] border border-[#333] text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 z-[100]"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
