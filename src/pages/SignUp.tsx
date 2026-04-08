import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { supabase } from '../supabaseClient';
import { Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Redirect to signin page with a verified flag after they click the email link
          emailRedirectTo: `${window.location.origin}/signin?verified=true`
        }
      });

      if (error) throw error;
      
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        throw new Error('An account with this email already exists.');
      }
      
      if (data.session) {
        // Email confirmation is disabled, they are already logged in
        navigate('/dashboard');
      } else {
        // Email confirmation is enabled
        navigate('/signin', { 
          state: { 
            email, 
            message: "Your account has been created. Please check your email and verify your address before logging in." 
          } 
        });
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('rate limit')) {
        setError('Email rate limit exceeded. Please try again later or use Google Sign Up.');
      } else {
        setError(err.message || 'Failed to sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
    }
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
          <h1 className="text-4xl font-display font-bold text-white mb-3 tracking-tight">Create Account</h1>
          <p className="text-gray-400 text-sm">Join Zenvex to start your journey</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
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
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-[#ff2a2a] text-sm bg-[#ff2a2a]/10 border border-[#ff2a2a]/20 rounded-xl p-4 text-center">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff2a2a] hover:bg-[#ff4d4d] text-white rounded-xl py-3.5 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,42,42,0.3)] hover:shadow-[0_0_30px_rgba(255,42,42,0.5)] flex items-center justify-center gap-2"
            >
              {loading ? 'Signing up...' : (
                <>
                  Sign Up <UserPlus className="w-4 h-4" />
                </>
              )}
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

        <div className="mt-8">
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
        </div>

        <div className="mt-10 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/signin" className="text-[#ff2a2a] hover:text-[#ff4d4d] font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
