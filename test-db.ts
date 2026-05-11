import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://tbfmzdosysdgmagekmty.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiZm16ZG9zeXNkZ21hZ2VrbXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNzAsImV4cCI6MjA5MDIzMDM3MH0.tkhOBcRcDIJ4WlPx_c5QiqmKoWN1KtSd_MFiJMfoL2o";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
  const tables = [
    'profiles', 'user_settings', 'schedules', 'habits', 
    'habit_logs', 'expenses', 'notes', 'saved_schedules', 'notifications'
  ];
  
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    console.log(`${t}:`, error ? JSON.stringify(error) : "OK");
  }
}
test();
