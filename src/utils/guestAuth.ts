import { supabase } from '../supabaseClient';

export const handleGuestSession = async () => {
  try {
    const guestCredsStr = localStorage.getItem('zenvex_guest_creds');
    if (guestCredsStr) {
      const { email, password } = JSON.parse(guestCredsStr);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      // Generate random credentials
      const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const email = `guest_${randomId}@zenvex.app`;
      const password = randomId + 'A1!'; // Ensure password meets requirements
      
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      localStorage.setItem('zenvex_guest_creds', JSON.stringify({ email, password }));
    }
    localStorage.setItem('isGuestMode', 'true');
    return true;
  } catch (err) {
    console.error('Guest login failed:', err);
    // Fallback to local guest mode if network fails
    localStorage.setItem('isGuestMode', 'true');
    return false;
  }
};
