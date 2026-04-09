import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, CheckCircle2, Zap, TrendingUp, Calendar, Wallet, Target, Activity, Clock, Shield, Sparkles, Send } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useEffect, useState, type MouseEvent } from 'react';
import { supabase } from '../supabaseClient';

export default function LandingPage() {
  const { enableDemoMode, disableDemoMode } = useAppContext();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const guestMode = localStorage.getItem('isGuestMode');
    
    if (guestMode === 'true') {
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    setTimeout(() => {
      setSubmitStatus('success');
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 500);
  };

  const handleDemoClick = (e: MouseEvent) => {
    e.preventDefault();
    enableDemoMode();
    localStorage.setItem('isGuestMode', 'true');
    navigate('/dashboard');
  };

  const handleStartBuilding = (e: MouseEvent) => {
    e.preventDefault();
    if (session) {
      navigate('/dashboard');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-lime-500/30 overflow-x-hidden font-sans">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#000]">
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-lime-600/10 rounded-full blur-[150px] mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-lime-900/10 rounded-full blur-[150px] mix-blend-screen"></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-orange-600/5 rounded-full blur-[150px] mix-blend-screen"></div>
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#000]/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-display font-bold text-xl flex items-center gap-2 tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-500 to-lime-600 flex items-center justify-center shadow-lg shadow-lime-500/20">
              <Target className="w-5 h-5 text-white" />
            </div>
            Zenvex
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <button onClick={() => navigate('/dashboard')} className="text-white hover:text-gray-300 px-4 py-2 text-sm font-semibold transition-colors">
                Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/signin')} className="text-white hover:text-gray-300 px-4 py-2 text-sm font-semibold transition-colors">
                Sign In
              </button>
            )}
            <button onClick={handleStartBuilding} className="bg-white text-black hover:opacity-80 px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              {session ? 'See my app' : 'Get Started'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative z-10 min-h-screen flex flex-col justify-center">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]"
          >
            <Sparkles className="w-4 h-4 text-lime-400" />
            <span className="text-sm font-medium text-gray-300">The ultimate personal operating system</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-[1.1] mb-8"
          >
            Design the life you <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-primary-hover">actually want to live.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Track your habits, manage your finances, and conquer your schedule with beautiful, intelligent analytics that help you level up every day.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button onClick={handleStartBuilding} className="group relative w-full sm:w-auto bg-white text-black px-8 py-4 rounded-full text-lg font-semibold transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.15)] overflow-hidden">
              <span className="relative flex items-center justify-center gap-2">
                {session ? 'See my app' : 'Start Building Free'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Bento Box Features Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">Everything you need to succeed</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">A complete toolkit designed to help you build discipline and achieve your goals.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 - Large */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-white/10 transition-colors shadow-2xl min-h-[300px]"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 blur-[80px] rounded-full group-hover:bg-lime-500/20 transition-colors"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center mb-6">
                    <Activity className="w-6 h-6 text-lime-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 font-display tracking-tight">Smart Analytics</h3>
                  <p className="text-gray-400 max-w-md">Visualize your progress with beautiful, interactive charts. Understand where your time goes and how your discipline improves over time.</p>
                </div>
                <div className="flex gap-4 mt-8 items-end h-32">
                  <motion.div 
                    initial={{ height: 0 }}
                    whileInView={{ height: '60%' }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="w-1/3 bg-white/5 rounded-t-xl border-t border-x border-white/5 relative overflow-hidden"
                  >
                    <div className="absolute bottom-2 w-full text-center text-xs text-gray-500 font-mono">MON</div>
                  </motion.div>
                  <motion.div 
                    initial={{ height: 0 }}
                    whileInView={{ height: '90%' }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="w-1/3 bg-accent-primary-dim rounded-t-xl border-t border-x border-accent-primary-border relative overflow-hidden shadow-[0_0_20px_var(--accent-shadow-light)]"
                  >
                    <div className="absolute top-0 w-full h-1 bg-accent-primary"></div>
                    <div className="absolute bottom-2 w-full text-center text-xs text-accent-primary font-mono font-bold">TUE</div>
                  </motion.div>
                  <motion.div 
                    initial={{ height: 0 }}
                    whileInView={{ height: '40%' }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="w-1/3 bg-white/5 rounded-t-xl border-t border-x border-white/5 relative overflow-hidden"
                  >
                    <div className="absolute bottom-2 w-full text-center text-xs text-gray-500 font-mono">WED</div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Feature 2 - Small */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-white/10 transition-colors shadow-2xl min-h-[300px]"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 blur-[80px] rounded-full group-hover:bg-rose-500/20 transition-colors"></div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 font-display tracking-tight">Habit Tracking</h3>
                <p className="text-gray-400">Build unbreakable streaks and form habits that last a lifetime.</p>
                
                <div className="mt-auto pt-8 flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div 
                      key={i}
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ delay: 0.1 * i, type: 'spring' }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${i <= 3 ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-white/5 border border-white/10'}`}
                    >
                      {i <= 3 && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Feature 3 - Small */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-white/10 transition-colors shadow-2xl min-h-[300px]"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 blur-[80px] rounded-full group-hover:bg-orange-500/20 transition-colors"></div>
              <div className="relative z-10 h-full flex flex-col">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
                  <Wallet className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3 font-display tracking-tight">Wealth Management</h3>
                <p className="text-gray-400">Keep your finances in check by logging daily expenses effortlessly.</p>
                
                <div className="mt-auto pt-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 font-mono">BUDGET</span>
                    <span className="text-xs text-orange-400 font-mono font-bold">65%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '65%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-accent-primary rounded-full"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature 4 - Large */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-white/10 transition-colors shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/10 blur-[80px] rounded-full group-hover:bg-lime-500/20 transition-colors"></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center mb-6">
                    <Clock className="w-6 h-6 text-lime-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 font-display tracking-tight">Time Blocking</h3>
                  <p className="text-gray-400 max-w-md">Take control of your day with precision scheduling. Categorize your tasks and see exactly where your hours are going.</p>
                </div>
                <div className="space-y-3 mt-8">
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="h-12 w-full bg-white/5 rounded-xl border border-white/10 flex items-center px-4 gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <div className="h-2 w-16 bg-white/20 rounded-full"></div>
                    <div className="h-2 w-32 bg-white/10 rounded-full ml-auto"></div>
                  </motion.div>
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="h-12 w-[85%] bg-accent-primary-dim rounded-xl border border-accent-primary-border flex items-center px-4 gap-3 shadow-[0_0_15px_var(--accent-shadow-light)]"
                  >
                    <div className="w-2 h-2 rounded-full bg-accent-primary"></div>
                    <div className="h-2 w-24 bg-accent-primary/50 rounded-full"></div>
                    <div className="h-2 w-20 bg-accent-primary/30 rounded-full ml-auto"></div>
                  </motion.div>
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="h-12 w-[95%] bg-white/5 rounded-xl border border-white/10 flex items-center px-4 gap-3"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <div className="h-2 w-20 bg-white/20 rounded-full"></div>
                    <div className="h-2 w-24 bg-white/10 rounded-full ml-auto"></div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-400 text-lg">Start for free, upgrade when you need more power.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-10 relative group hover:border-white/10 transition-colors shadow-2xl">
              <h3 className="text-xl font-semibold mb-2 text-gray-300">Basic</h3>
              <div className="text-5xl font-display font-bold mb-6">$0<span className="text-lg text-gray-500 font-sans font-normal">/forever</span></div>
              <p className="text-gray-400 mb-8">Everything you need to start building better habits.</p>
              <ul className="space-y-4 mb-10">
                {['Schedule tracking', 'Habit tracking', 'Basic analytics', 'Daily notes'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-gray-500" /> {feature}
                  </li>
                ))}
              </ul>
              <button onClick={handleStartBuilding} className="block w-full text-center bg-white/5 border border-white/10 hover:bg-white/10 text-white py-4 rounded-xl font-semibold transition-colors">
                Get Started Free
              </button>
            </div>
            
            {/* Pro */}
            <div className="bg-[#0a0a0a] border border-lime-500/30 rounded-3xl p-10 relative shadow-[0_0_40px_rgba(99,102,241,0.1)] overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent-primary"></div>
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-lime-500/10 blur-[80px] rounded-full pointer-events-none"></div>
              <div className="absolute -top-4 right-8 bg-white text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-semibold mb-2 text-lime-400">Pro</h3>
              <div className="text-5xl font-display font-bold mb-6 text-white">$5<span className="text-lg text-gray-500 font-sans font-normal">/month</span></div>
              <p className="text-gray-400 mb-8">Advanced tools for those serious about their future.</p>
              <ul className="space-y-4 mb-10">
                {['AI productivity insights', 'Advanced infographics', 'Unlimited history', 'Export reports', 'Priority support'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-200 font-medium">
                    <CheckCircle2 className="w-5 h-5 text-lime-400" /> {feature}
                  </li>
                ))}
              </ul>
              <button onClick={handleStartBuilding} className="block w-full text-center bg-white text-black hover:opacity-80 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 px-6 bg-[#050505] relative z-10 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight mb-4">Get in Touch</h2>
            <p className="text-gray-400 text-lg">Have questions or feedback? We'd love to hear from you.</p>
          </div>
          
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-2xl">
            {submitStatus === 'success' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                <p className="text-gray-400 mb-6">Thank you for reaching out. We'll get back to you soon.</p>
                <button 
                  onClick={() => setSubmitStatus('idle')}
                  className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                    <input 
                      type="text" 
                      required
                      value={contactForm.name}
                      onChange={e => setContactForm({...contactForm, name: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <input 
                      type="email" 
                      required
                      value={contactForm.email}
                      onChange={e => setContactForm({...contactForm, email: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Subject (Optional)</label>
                  <input 
                    type="text" 
                    value={contactForm.subject}
                    onChange={e => setContactForm({...contactForm, subject: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                  <textarea 
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={e => setContactForm({...contactForm, message: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500 transition-all resize-none"
                    placeholder="Your message here..."
                  ></textarea>
                </div>
                
                {submitStatus === 'error' && (
                  <div className="p-4 bg-lime-500/10 border border-lime-500/20 rounded-xl text-lime-500 text-sm">
                    There was an error sending your message. Please try again.
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black hover:opacity-80 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-6 text-center border-t border-white/5 bg-[#000] relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)]"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[50%] bg-lime-500/10 blur-[120px] rounded-t-full pointer-events-none"></div>
        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight mb-8">Ready to transform your life?</h2>
          <button onClick={handleStartBuilding} className="inline-block bg-white text-black hover:opacity-80 px-10 py-5 rounded-full text-xl font-bold transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:scale-105">
            Start Building Now
          </button>
        </div>
      </section>
    </div>
  );
}
