import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { supabase } from '../supabaseClient';
import { UserCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // By default, supabase-js handles the #access_token automatically 
        // when the script loads, and establishes the session.
        // We will call exchangeCodeForSession just in case we are dealing with standard PKCE ?code= URLs.
        
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // Get the established session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session) {
          // After email verified, auto-save user data to "users" table
          const { user } = session;
          
          await supabase.from('users').upsert({
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            email_verified: !!user.email_confirmed_at
          }, { onConflict: 'id' });

          // Redirect to the dashboard on success
          navigate('/dashboard', { replace: true });
        } else {
          // If no session is present, something went wrong with verification or no code
          setError('Failed to verify session. Please try logging in again.');
        }

      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'There was an error verifying your account. Please try again.');
      }
    };

    handleAuthCallback();

  }, [navigate, location]);

  return (
    <div className="flex flex-col h-screen items-center justify-center bg-[#0a0a0a] text-white p-4">
      {error ? (
        <div className="max-w-md w-full bg-surface border border-border-dim rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Verification Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/signin')} 
            className="w-full bg-accent-primary hover:bg-accent-primary-hover text-white py-3 rounded-lg font-medium transition-colors"
          >
            Return to Login
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-gray-300">Verifying your account...</p>
        </div>
      )}
    </div>
  );
}
