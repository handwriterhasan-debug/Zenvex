import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { supabase } from '../supabaseClient';
import { Mail, Lock, LogIn, ArrowRight, User } from 'lucide-react';

import { handleGuestSession } from '../utils/guestAuth';

export default function SignIn() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize email and success message from router state if available
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(location.state?.message || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if the user just clicked an email verification link
    const params = new URLSearchParams(location.search);
    if (params.get('verified') === 'true') {
      setSuccessMsg('Email verified successfully. Please sign in to continue.');
      
      // Force sign out to kill the auto-login session from the verification link
      supabase.auth.signOut();
      
      // Clean up the URL so the query parameter is removed
      navigate('/signin', { replace: true, state: { email: location.state?.email || '' } });
    }
  }, [location, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.session) {
        localStorage.removeItem('zenvex_guest_creds');
        localStorage.removeItem('isGuestMode');
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('rate limit')) {
        setError('Email rate limit exceeded. Please try again later or use Google Sign In.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isGuest = session?.user?.email?.startsWith('guest_');
      
      if (isGuest) {
        const { error } = await supabase.auth.linkIdentity({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) throw error;
        localStorage.removeItem('zenvex_guest_creds');
        localStorage.removeItem('isGuestMode');
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`
          }
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    await handleGuestSession();
    setLoading(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#ff2a2a]/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/10 blur-[120px]" />
      </div>

      <div className="max-w-md w-full bg-surface border border-border-dim rounded-3xl p-10 shadow-lg relative z-10">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-[#ff2a2a]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#ff2a2a]/30 shadow-[0_0_15px_rgba(255,42,42,0.2)]">
            <LogIn className="w-6 h-6 text-[#ff2a2a]" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Enter your credentials to access your workspace.</p>
        </div>

        {successMsg && (
          <div className="mb-6 flex items-start gap-3 text-emerald-400 text-sm bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-4">
            <div className="w-5 h-5 rounded-full bg-emerald-400/20 flex items-center justify-center shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <p>{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-5">
          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-border-dim rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-border-dim rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary transition-all"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="w-4 h-4 rounded border border-white/20 group-hover:border-red-500/50 flex items-center justify-center transition-colors">
                <div className="w-2 h-2 rounded-sm bg-transparent group-hover:bg-red-500/50 transition-colors" />
              </div>
              <span className="text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
            </label>
            <a href="#" className="text-red-400 hover:text-red-300 transition-colors">Forgot password?</a>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl p-4 text-center">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff2a2a] hover:bg-[#ff4d4d] text-white rounded-xl py-3.5 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,42,42,0.3)] hover:shadow-[0_0_30px_rgba(255,42,42,0.5)]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-8 relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative bg-transparent px-4 text-xs text-gray-500 uppercase tracking-widest font-medium">
            OR
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full bg-surface border border-border-dim hover:bg-white/5 text-white rounded-xl py-3.5 font-medium transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <button
            onClick={handleGuestLogin}
            type="button"
            className="w-full bg-transparent border border-gray-700 hover:bg-white/5 text-gray-300 rounded-xl py-3.5 font-medium transition-colors flex items-center justify-center gap-3"
          >
            <User className="w-5 h-5" />
            Continue as Guest
          </button>
        </div>

        <div className="mt-10 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-red-400 hover:text-red-300 font-medium transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
