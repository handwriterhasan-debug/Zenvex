import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { supabase } from '../supabaseClient';

export default function ProtectedRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase session with a timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{data: {session: any}}>((_, reject) => 
          setTimeout(() => reject(new Error('Supabase getSession timeout')), 3000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (session) {
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }

        // Fallback to guest mode check
        const guestMode = localStorage.getItem('isGuestMode');
        const guestStartedAt = localStorage.getItem('guestModeStartedAt');

        if (guestMode === 'true' && guestStartedAt) {
          const startedAt = parseInt(guestStartedAt, 10);
          const daysPassed = (Date.now() - startedAt) / (1000 * 60 * 60 * 24);
          
          if (daysPassed > 14) {
            localStorage.removeItem('isGuestMode');
            localStorage.removeItem('guestModeStartedAt');
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        
        // Fallback to guest mode check even if Supabase fails/times out
        try {
          const guestMode = localStorage.getItem('isGuestMode');
          const guestStartedAt = localStorage.getItem('guestModeStartedAt');

          if (guestMode === 'true' && guestStartedAt) {
            const startedAt = parseInt(guestStartedAt, 10);
            const daysPassed = (Date.now() - startedAt) / (1000 * 60 * 60 * 24);
            
            if (daysPassed > 14) {
              localStorage.removeItem('isGuestMode');
              localStorage.removeItem('guestModeStartedAt');
              setIsAuthenticated(false);
            } else {
              setIsAuthenticated(true);
            }
          } else {
            setIsAuthenticated(false);
          }
        } catch (storageError) {
          console.error('Storage access failed:', storageError);
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <Outlet />;
}
