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
    try { await supabase.auth.signOut(); } catch (e) {}
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('makeYourFutureState');
    localStorage.removeItem('isGuestMode');
    localStorage.removeItem('zenvex_guest_creds');
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

  // Command Palette State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const commandInputRef = useRef<HTMLInputElement>(null);

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
    if (isCommandPaletteOpen && commandInputRef.current) {
      setTimeout(() => commandInputRef.current?.focus(), 100);
    } else {
      setCommandQuery('');
    }
  }, [isCommandPaletteOpen]);

  const toggleTheme = () => {
    updateSettings({ theme: userSettings.theme === 'light' ? 'dark' : 'light' });
  };

  const commandOptions = [
    { name: 'Go to Dashboard', action: () => navigate('/dashboard'), icon: LayoutDashboard },
    { name: 'Plan Schedule', action: () => navigate('/schedule'), icon: Calendar },
    { name: 'Track Habits', action: () => navigate('/habits'), icon: CheckSquare },
    { name: 'Manage Expenses', action: () => navigate('/expenses'), icon: Wallet },
    { name: 'View Analytics', action: () => navigate('/analytics'), icon: PieChart },
    { name: 'Write Notes', action: () => navigate('/notes'), icon: BookOpen },
    { name: 'Check History', action: () => navigate('/history'), icon: History },
    { name: 'Toggle Timer', action: () => setShowTimer(prev => !prev), icon: Timer },
    { name: 'Toggle Theme', action: toggleTheme, icon: userSettings.theme === 'light' ? Moon : Sun },
    { name: 'Settings', action: () => navigate('/settings'), icon: Settings }
  ];

  const filteredCommands = commandOptions.filter(cmd => cmd.name.toLowerCase().includes(commandQuery.toLowerCase()));

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
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setShowTimer(false);
      setTimeLeft(25 * 60); // Reset for next time
      // Could play a sound here
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape for Command Palette
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
        return;
      }

      // Cmd+K or Ctrl+K for Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      // Don't trigger if user is typing in an input, textarea, or contenteditable
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Modifier keys check - we don't want to trigger on Ctrl+S for example
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case 's':
          navigate('/schedule');
          break;
        case 'h':
          navigate('/habits');
          break;
        case 'n':
          navigate('/notes');
          break;
        case 'e':
          navigate('/expenses');
          break;
        case 'd':
          navigate('/dashboard');
          break;
        case 'c':
          navigate('/currency');
          break;
        case 'a':
          navigate('/analytics');
          break;
        case 'y':
          navigate('/history');
          break;
        case 't':
          // Toggle focus timer
          setShowTimer(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

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
    <div className="flex h-screen bg-main text-text-main overflow-hidden relative safe-pt safe-pb safe-pl safe-pr">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-surface border-r border-border-dim flex-col z-10 relative">
        <div className="p-6 pb-2">
          <NavLink to="/dashboard" className="text-xl font-bold font-display tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="w-3 h-3 rounded-full bg-accent-primary shadow-[0_0_10px_var(--accent-primary)]"></span>
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
              <p className="text-xs text-accent-primary font-medium uppercase tracking-wider">{userProfile?.plan || 'Free'} Plan</p>
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
              {localStorage.getItem('isGuestMode') === 'true' && (
                <button
                  onClick={async () => {
                    try { await supabase.auth.signOut(); } catch (e) {}
                    localStorage.removeItem('isGuestMode');
                    navigate('/');
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/5 text-xs uppercase tracking-wider"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Exit App
                </button>
              )}
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
        
        <nav 
          className="flex-1 px-4 space-y-1 overflow-y-auto mt-2 custom-scrollbar"
        >
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top Header */}
        <header className="h-[52px] md:h-16 border-b border-border-dim bg-surface flex items-center justify-between px-2 sm:px-3 md:px-8 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <NavLink to="/dashboard" className="inline-flex items-center justify-center gap-1.5 font-display font-bold text-lg tracking-tight text-white transition-opacity hover:opacity-80 px-1 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-primary shadow-[0_0_8px_var(--accent-primary)]"></span>
              <span className="hidden sm:inline">Zenvex</span>
            </NavLink>
            <div className="flex items-center shrink-0 gap-2">
              <span className="px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white rounded-md shadow-sm">
                Beta
              </span>
              <span className="px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white rounded-md shadow-sm">
                MVP Version
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button 
              onClick={() => setIsComplainBoxOpen(true)}
              className="flex items-center justify-center gap-1.5 w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 text-xs font-medium text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg sm:rounded-lg transition-colors shrink-0"
              title="Report an Issue"
            >
              <MessageSquareWarning className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Complain Box</span>
            </button>
            <div className="hidden sm:block text-xs font-mono text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 shrink-0">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <button 
              onClick={toggleTheme}
              className="p-1.5 md:p-2 transition-colors rounded-full hover:bg-white/5 text-gray-400 hover:text-white shrink-0"
              title="Toggle Theme"
            >
              {userSettings.theme === 'light' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
            <button 
              onClick={() => setShowTimer(!showTimer)}
              className={`p-1.5 md:p-2 transition-colors rounded-full hover:bg-white/5 shrink-0 ${showTimer || isTimerRunning ? 'text-accent-primary' : 'text-gray-400 hover:text-white'}`}
              title="Focus Timer"
            >
              <Timer className="w-4 h-4 md:w-5 md:h-5" />
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
                <h3 className="font-bold font-display text-accent-primary flex items-center gap-2">
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
                  className="w-12 h-12 rounded-full bg-accent-primary hover:bg-accent-primary-hover text-[#000000] flex items-center justify-center transition-all neon-glow"
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
        <div 
          className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 custom-scrollbar"
          id="main-scroll-container"
        >
          <div className="max-w-6xl mx-auto">
            <Outlet context={{ showTimer, setShowTimer, timeLeft, setTimeLeft, isTimerRunning, setIsTimerRunning }} />
          </div>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-2xl border-t border-border-dim pb-safe h-[72px] flex items-center justify-center px-1">
          <div className="flex items-start justify-between w-full max-w-full h-full pt-2">
            {navItems.slice(0, 6).map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => cn(
                  "relative flex flex-col items-center justify-start rounded-xl transition-all duration-300 flex-1 h-full min-w-0 max-w-[16.66%]",
                  isActive 
                    ? "text-accent-primary" 
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {({ isActive }) => (
                  <>
                    <div className="relative flex items-center justify-center w-8 h-8 rounded-full mb-1">
                      {isActive && (
                        <motion.div 
                          layoutId="bottom-nav-active-pill"
                          className="absolute inset-0 bg-accent-primary/10 rounded-full"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <item.icon className={cn("w-[22px] h-[22px] z-10 transition-transform duration-300 shrink-0", isActive ? "scale-110 drop-shadow-[0_0_8px_rgba(var(--accent-primary),0.5)]" : "")} />
                    </div>
                    <span className={cn("z-10 tracking-wide transition-all duration-300 truncate w-full text-center px-0.5", isActive ? "font-bold text-accent-primary opacity-100" : "font-medium opacity-80")} style={{ fontSize: '9px' }}>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
        <AIChatbot />

        {/* Command Palette */}
        <AnimatePresence>
          {isCommandPaletteOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsCommandPaletteOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xl bg-surface border border-border-dim rounded-2xl shadow-2xl overflow-hidden mx-4"
              >
                <div className="flex items-center px-4 py-3 border-b border-border-dim relative">
                  <span className="w-5 h-5 text-text-muted absolute left-4"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg></span>
                  <input
                    ref={commandInputRef}
                    type="text"
                    value={commandQuery}
                    onChange={(e) => setCommandQuery(e.target.value)}
                    placeholder="Search commands or pages..."
                    className="w-full bg-transparent pl-8 pr-4 py-2 text-text-main outline-none placeholder:text-text-faint text-lg"
                  />
                  <span className="text-xs font-mono text-text-faint bg-surface-light px-2 py-1 rounded border border-border-dim">ESC</span>
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
                  {filteredCommands.length > 0 ? (
                    filteredCommands.map((cmd, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          cmd.action();
                          setIsCommandPaletteOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-surface-light rounded-xl text-left transition-colors group"
                      >
                        <div className="bg-surface border border-border-dim p-2 rounded-lg group-hover:bg-accent-primary group-hover:text-white group-hover:border-accent-primary transition-colors text-text-muted">
                          <cmd.icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-text-main group-hover:text-accent-primary transition-colors">{cmd.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center text-text-muted">
                      No commands found for "{commandQuery}"
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
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
                    <div className="flex flex-col items-center text-center">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-black/40 border-2 border-white/10 mb-3 group shrink-0">
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
                        className="text-sm text-accent-primary hover:text-accent-primary-hover font-medium"
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
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent-primary transition-colors"
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
                      className="flex-1 py-3 px-4 bg-accent-primary hover:bg-accent-primary-hover text-[#000000] rounded-xl font-medium transition-colors neon-glow"
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-[280px] sm:w-80 bg-surface border-r border-border-dim flex flex-col z-[101] md:hidden"
            >
              <div className="p-4 sm:p-6 pb-2 flex items-center justify-between border-b border-border-dim bg-surface/50">
                <NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-accent-primary shadow-[0_0_10px_var(--accent-primary)]"></span>
                  Zenvex
                </NavLink>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                {/* Profile Card at Top */}
                <div className="p-4 sm:p-6 pt-6 border-b border-white/5">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent-primary flex items-center justify-center font-bold text-2xl sm:text-3xl overflow-hidden mb-3 border-2 border-border-dim relative group">
                      {userProfile?.avatarUrl ? (
                        <img src={userProfile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        userSettings?.name ? userSettings.name.charAt(0).toUpperCase() : 'U'
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }}>
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <h3 className="font-display font-bold text-lg sm:text-xl">{userSettings?.name || 'User'}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-xs sm:text-sm text-accent-primary font-medium uppercase tracking-wider">{userProfile?.plan || 'Free'} Plan</p>
                      {localStorage.getItem('isGuestMode') === 'true' && (
                        <span className="text-[10px] sm:text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-orange-500/20">
                          Guest
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 w-full mt-2">
                      {localStorage.getItem('isGuestMode') === 'true' && (
                        <button
                          onClick={async () => {
                            setIsMobileMenuOpen(false);
                            try { await supabase.auth.signOut(); } catch (e) {}
                            localStorage.removeItem('isGuestMode');
                            navigate('/');
                          }}
                          className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/5 text-xs sm:text-sm uppercase tracking-wider"
                        >
                          <LogOut className="w-4 h-4" />
                          Exit App
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleSignOut();
                        }}
                        className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 bg-accent-primary-dim hover:bg-accent-primary-border text-accent-primary rounded-xl font-medium transition-colors border border-accent-primary-dim text-xs sm:text-sm uppercase tracking-wider"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                </div>
                
                <nav className="p-4 space-y-1">
                  <div className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-2">Navigation</div>
                  {navItems.map((item) => {
                    const isLocked = userProfile?.plan === 'Free' && (item.name === 'Analytics' || item.name === 'Currency');
                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) => cn(
                          "flex items-center justify-between px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 relative mb-1",
                          isActive 
                            ? "bg-white/10 text-white border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]" 
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-3">
                              <item.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", isActive ? "text-[#ff2a2a]" : "")} />
                              {item.name}
                            </div>
                            {isLocked && <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500/70" />}
                            {isActive && (
                              <motion.div 
                                layoutId="mobile-sidebar-active"
                                className="absolute left-0 w-1 h-8 sm:h-10 bg-[#ff2a2a] rounded-r-full shadow-[0_0_10px_rgba(255,42,42,0.8)]"
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
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 mt-4 border border-orange-500/20",
                        isActive 
                          ? "bg-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                          : "text-orange-500/70 hover:text-orange-400 hover:bg-orange-500/10"
                      )}
                    >
                      <MessageSquareWarning className="w-4 h-4 sm:w-5 sm:h-5" />
                      Admin Complaints
                    </NavLink>
                  )}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
