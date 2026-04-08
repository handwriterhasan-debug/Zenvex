import { NavLink, Outlet, useNavigate, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckSquare, 
  Wallet, 
  PieChart, 
  History, 
  BookOpen, 
  Settings,
  UserCircle,
  CreditCard,
  Bell,
  Moon,
  Sun,
  Timer,
  Play,
  Pause,
  RotateCcw,
  X,
  Menu,
  Camera,
  MessageSquareWarning,
  LogOut,
  Sparkles,
  ArrowRightLeft,
  Lock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../supabaseClient';
import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { AIChatbot } from './AIChatbot';
import { NotificationPanel } from './NotificationPanel';
import { ComplainBox } from './ComplainBox';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Schedule', path: '/schedule', icon: Calendar },
  { name: 'Habits', path: '/habits', icon: CheckSquare },
  { name: 'Expenses', path: '/expenses', icon: Wallet },
  { name: 'Currency', path: '/currency', icon: ArrowRightLeft },
  { name: 'Analytics', path: '/analytics', icon: PieChart },
  { name: 'History', path: '/history', icon: History },
  { name: 'Notes', path: '/notes', icon: BookOpen },
  { name: 'Profile', path: '/profile', icon: UserCircle },
  { name: 'Subscription', path: '/subscription', icon: CreditCard },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userSettings, updateSettings, userProfile, updateProfile, currentDayData, syncError, isStateLoaded, resetState } = useAppContext();
  const [time, setTime] = useState(new Date());
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('makeYourFutureState');
    localStorage.removeItem('isGuestMode');
    localStorage.removeItem('guestModeStartedAt');
    resetState();
    navigate('/');
  };
  
  // Focus Timer State
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Complain Box State
  const [isComplainBoxOpen, setIsComplainBoxOpen] = useState(false);

  // Onboarding Modal State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingAvatar, setOnboardingAvatar] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('isAdmin') === 'true') {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    // Check if it's a new user (default name 'User' and no avatar)
    if (isStateLoaded && userProfile?.name === 'User' && !userProfile?.avatarUrl && !localStorage.getItem('onboardingDismissed')) {
      setShowOnboarding(true);
    }
  }, [userProfile, isStateLoaded]);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOnboardingAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveOnboarding = () => {
    if (onboardingName.trim()) {
      updateProfile({ name: onboardingName, avatarUrl: onboardingAvatar });
      updateSettings({ name: onboardingName });
    } else if (onboardingAvatar) {
      updateProfile({ avatarUrl: onboardingAvatar });
    }
    localStorage.setItem('onboardingDismissed', 'true');
    setShowOnboarding(false);
  };

  const handleSkipOnboarding = () => {
    localStorage.setItem('onboardingDismissed', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      // Could play a sound here
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const toggleTheme = () => {
    updateSettings({ theme: userSettings.theme === 'light' ? 'dark' : 'light' });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  if (!isStateLoaded) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-primary-border border-t-accent-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-main text-text-main overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-surface border-r border-border-dim flex-col z-10 relative">
        <div className="p-6 pb-2">
          <NavLink to="/dashboard" className="text-xl font-bold font-display tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="w-3 h-3 rounded-full bg-[#ff2a2a] shadow-[0_0_10px_rgba(255,42,42,0.8)]"></span>
            Zenvex
          </NavLink>
        </div>
        
        {/* Profile Card at Top */}
        <div className="p-6 pt-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-accent-primary flex items-center justify-center font-bold text-2xl overflow-hidden mb-3 border-2 border-border-dim relative group">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userSettings?.name ? userSettings.name.charAt(0).toUpperCase() : 'U'
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => navigate('/profile')}>
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="font-display font-bold text-lg">{userSettings?.name || 'User'}</h3>
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs text-[#ff2a2a] font-medium uppercase tracking-wider">{userProfile?.plan || 'Free'} Plan</p>
              {localStorage.getItem('isGuestMode') === 'true' && (
                <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-orange-500/20">
                  Guest
                </span>
              )}
            </div>
            
            <div className="flex w-full justify-between px-2 text-center mb-4">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tasks</p>
                <p className="font-mono font-bold text-sm">{(currentDayData?.schedule || []).length}</p>
              </div>
              <div className="w-px bg-white/10"></div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Habits</p>
                <p className="font-mono font-bold text-sm">{(currentDayData?.habits || []).length}</p>
              </div>
              <div className="w-px bg-white/10"></div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Streak</p>
                <p className="font-mono font-bold text-sm">{(currentDayData?.habits || []).reduce((acc, h) => acc + h.streak, 0)}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/5 text-xs uppercase tracking-wider"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit App
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full py-2 bg-accent-primary-dim hover:bg-accent-primary-border text-accent-primary rounded-xl font-medium transition-colors border border-accent-primary-dim text-xs uppercase tracking-wider"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-2 custom-scrollbar">
          {navItems.map((item) => {
            const isLocked = userProfile?.plan === 'Free' && (item.name === 'Analytics' || item.name === 'Currency');
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                  isActive 
                    ? "bg-white/10 text-white border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("w-4 h-4", isActive ? "text-[#ff2a2a]" : "")} />
                      {item.name}
                    </div>
                    {isLocked && <Lock className="w-3.5 h-3.5 text-amber-500/70" />}
                    {isActive && (
                      <motion.div 
                        layoutId="sidebar-active"
                        className="absolute left-0 w-1 h-8 bg-[#ff2a2a] rounded-r-full shadow-[0_0_10px_rgba(255,42,42,0.8)]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
          
          {isAdmin && (
            <NavLink
              to="/admin/complaints"
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-4 border border-orange-500/20",
                isActive 
                  ? "bg-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                  : "text-orange-500/70 hover:text-orange-400 hover:bg-orange-500/10"
              )}
            >
              <MessageSquareWarning className="w-4 h-4" />
              Admin Complaints
            </NavLink>
          )}
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-40"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-64 bg-surface border-r border-border-dim flex flex-col z-50 shadow-lg"
            >
              <div className="p-6 pb-2 flex items-center justify-between">
                <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold font-display tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="w-3 h-3 rounded-full bg-[#ff2a2a] shadow-[0_0_10px_rgba(255,42,42,0.8)]"></span>
                  Zenvex
                </NavLink>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Profile Card at Top (Mobile) */}
              <div className="p-6 pt-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#ff2a2a] to-orange-500 flex items-center justify-center font-bold text-2xl overflow-hidden mb-3 border-2 border-white/10 shadow-[0_0_15px_rgba(255,42,42,0.2)]">
                    {userProfile?.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      userSettings?.name ? userSettings.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <h3 className="font-display font-bold text-lg">{userSettings?.name || 'User'}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-xs text-[#ff2a2a] font-medium uppercase tracking-wider">{userProfile?.plan || 'Free'} Plan</p>
                    {localStorage.getItem('isGuestMode') === 'true' && (
                      <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-orange-500/20">
                        Guest
                      </span>
                    )}
                  </div>
                  
                  <div className="flex w-full justify-between px-2 text-center mb-4">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tasks</p>
                      <p className="font-mono font-bold text-sm">{(currentDayData?.schedule || []).length}</p>
                    </div>
                    <div className="w-px bg-white/10"></div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Habits</p>
                      <p className="font-mono font-bold text-sm">{(currentDayData?.habits || []).length}</p>
                    </div>
                    <div className="w-px bg-white/10"></div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Streak</p>
                      <p className="font-mono font-bold text-sm">{(currentDayData?.habits || []).reduce((acc, h) => acc + h.streak, 0)}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => navigate('/')}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/5 text-xs uppercase tracking-wider"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Exit App
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center gap-2 w-full py-2 bg-accent-primary-dim hover:bg-accent-primary-border text-accent-primary rounded-xl font-medium transition-colors border border-accent-primary-dim text-xs uppercase tracking-wider"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log Out
                    </button>
                  </div>
                </div>
              </div>
              
              <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-2 custom-scrollbar">
                {navItems.map((item) => {
                  const isLocked = userProfile?.plan === 'Free' && (item.name === 'Analytics' || item.name === 'Currency');
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                        isActive 
                          ? "bg-white/10 text-white border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]" 
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-3">
                            <item.icon className={cn("w-4 h-4", isActive ? "text-[#ff2a2a]" : "")} />
                            {item.name}
                          </div>
                          {isLocked && <Lock className="w-3.5 h-3.5 text-amber-500/70" />}
                        </>
                      )}
                    </NavLink>
                  );
                })}

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('open-ai-chatbot'));
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/5 mt-2"
                >
                  <Sparkles className="w-4 h-4 text-[#ff2a2a]" />
                  AI Assistant
                </button>

                {isAdmin && (
                  <NavLink
                    to="/admin/complaints"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-4 border border-orange-500/20",
                      isActive 
                        ? "bg-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                        : "text-orange-500/70 hover:text-orange-400 hover:bg-orange-500/10"
                    )}
                  >
                    <MessageSquareWarning className="w-4 h-4" />
                    Admin Complaints
                  </NavLink>
                )}

                <div className="mt-4 pt-4 border-t border-white/10 mb-6">
                  <div className="flex items-center gap-2 px-3 mb-3">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md">
                      Beta
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsComplainBoxOpen(true);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl transition-colors"
                  >
                    <MessageSquareWarning className="w-4 h-4" />
                    Complain Box
                  </button>
                </div>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* 14-Day Trial Banner */}
        {localStorage.getItem('isGuestMode') === 'true' && (
          <div className="bg-accent-primary-dim border-b border-accent-primary-border px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 z-20 relative">
            <div className="flex items-center gap-2 text-white text-xs font-bold tracking-wide">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>GUEST TRIAL: {Math.max(0, 14 - Math.floor((Date.now() - parseInt(localStorage.getItem('guestModeStartedAt') || '0', 10)) / (1000 * 60 * 60 * 24)))} DAYS LEFT</span>
            </div>
            <div className="w-full sm:w-64 h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((Date.now() - parseInt(localStorage.getItem('guestModeStartedAt') || '0', 10)) / (1000 * 60 * 60 * 24) / 14) * 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-accent-primary rounded-full relative" 
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>
          </div>
        )}

        {/* Top Header */}
        <header className="h-16 border-b border-border-dim bg-surface flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>
            <NavLink to="/" className="hidden sm:inline-flex items-center gap-2 text-xs font-medium text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              Home
            </NavLink>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md">
                Beta
              </span>
            </div>
            <button 
              onClick={() => setIsComplainBoxOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg transition-colors"
              title="Report an Issue"
            >
              <MessageSquareWarning className="w-3.5 h-3.5" />
              Complain Box
            </button>
            <div className="hidden sm:block text-xs font-mono text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <button 
              onClick={() => setShowTimer(!showTimer)}
              className={`p-2 transition-colors rounded-full hover:bg-white/5 ${showTimer || isTimerRunning ? 'text-[#ff2a2a]' : 'text-gray-400 hover:text-white'}`}
              title="Focus Timer"
            >
              <Timer className="w-4 h-4" />
            </button>

            <NotificationPanel />
          </div>
        </header>

        {syncError && (
          <div className="bg-accent-primary-dim border-b border-accent-primary-border px-4 py-3 flex items-start gap-3">
            <MessageSquareWarning className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-accent-primary">Sync Error</h3>
              <p className="text-xs text-accent-primary/80 mt-1">{syncError}</p>
            </div>
          </div>
        )}

        {/* Focus Timer Widget */}
        <AnimatePresence>
          {showTimer && location.pathname !== '/' && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-20 right-4 left-4 md:left-auto md:right-8 z-50 bg-surface p-6 border border-border-dim md:w-72 shadow-lg rounded-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold font-display text-[#ff2a2a] flex items-center gap-2">
                  <Timer className="w-4 h-4" /> Focus Time
                </h3>
                <button onClick={() => setShowTimer(false)} className="text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-5xl font-mono font-bold tracking-wider text-white mb-2">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-xs text-gray-400">Stay focused. No distractions.</p>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="w-12 h-12 rounded-full bg-[#ff2a2a] hover:bg-[#ff4d4d] text-[#ffffff] flex items-center justify-center transition-all neon-glow"
                >
                  {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <button 
                  onClick={() => { setIsTimerRunning(false); setTimeLeft(25 * 60); }}
                  className="w-10 h-10 rounded-full bg-surface-light border border-border-dim hover:border-border-strong text-text-muted hover:text-text-main flex items-center justify-center transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-6 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button onClick={() => { setIsTimerRunning(false); setTimeLeft(25 * 60); }} className="flex-1 py-1.5 text-xs bg-surface-light border border-border-dim rounded-md hover:bg-surface-hover text-text-main">25m</button>
                  <button onClick={() => { setIsTimerRunning(false); setTimeLeft(5 * 60); }} className="flex-1 py-1.5 text-xs bg-surface-light border border-border-dim rounded-md hover:bg-surface-hover text-text-main">5m Break</button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input 
                    type="number" 
                    min="1" 
                    max="120" 
                    placeholder="Custom (min)" 
                    className="flex-1 bg-surface-light border border-border-dim rounded-md px-3 py-1.5 text-xs text-text-main focus:outline-none focus:border-accent-primary placeholder-text-faint"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(e.currentTarget.value);
                        if (!isNaN(val) && val > 0) {
                          setIsTimerRunning(false);
                          setTimeLeft(val * 60);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <span className="text-xs text-gray-500">Press Enter</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <Outlet context={{ showTimer, setShowTimer, timeLeft, setTimeLeft, isTimerRunning, setIsTimerRunning }} />
          </div>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border-dim pb-safe">
          <div className="flex items-center justify-between px-1 py-1 w-full max-w-full overflow-hidden">
            {navItems.slice(0, 6).map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => cn(
                  "relative flex flex-col items-center justify-center p-1 rounded-xl text-[9px] sm:text-[10px] font-medium transition-all duration-300 flex-1 min-h-[44px] max-w-[16.66%]",
                  isActive 
                    ? "text-white" 
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div 
                        layoutId="bottom-nav-active"
                        className="absolute inset-0 bg-accent-primary-dim border border-accent-primary-border rounded-xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <item.icon className={cn("w-5 h-5 mb-0.5 z-10 transition-transform duration-300 max-w-[24px] max-h-[24px] shrink-0", isActive ? "scale-110 text-accent-primary drop-shadow-[0_0_8px_rgba(var(--accent-primary),0.5)]" : "")} />
                    <span className={cn("z-10 tracking-wide transition-all duration-300 truncate w-full text-center px-0.5", isActive ? "opacity-100" : "opacity-70")}>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
        
        {/* Global AI Chatbot */}
        <AIChatbot />
        
        {/* Complain Box */}
        <ComplainBox isOpen={isComplainBoxOpen} onClose={() => setIsComplainBoxOpen(false)} />
        
        {/* Onboarding Modal */}
        <AnimatePresence>
          {showOnboarding && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-surface border border-border-dim rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold font-display mb-2">Welcome to Zenvex!</h2>
                    <p className="text-gray-400 text-sm">Let's personalize your experience. Add your name and a profile picture.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex flex-col items-center">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-black/40 border-2 border-white/10 mb-3 group">
                        {onboardingAvatar ? (
                          <img src={onboardingAvatar} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <UserCircle className="w-12 h-12" />
                          </div>
                        )}
                        <div 
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer transition-opacity"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="w-6 h-6 text-[#ffffff]" />
                        </div>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-sm text-[#ff2a2a] hover:text-[#ff4d4d] font-medium"
                      >
                        Upload Picture
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">What should we call you?</label>
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={onboardingName}
                        onChange={(e) => setOnboardingName(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff2a2a] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={handleSkipOnboarding}
                      className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                    >
                      Skip for now
                    </button>
                    <button
                      onClick={handleSaveOnboarding}
                      className="flex-1 py-3 px-4 bg-[#ff2a2a] hover:bg-[#ff4d4d] text-[#ffffff] rounded-xl font-medium transition-colors neon-glow"
                    >
                      Save Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
