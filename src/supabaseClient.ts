import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://tbfmzdosysdgmagekmty.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiZm16ZG9zeXNkZ21hZ2VrbXR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNzAsImV4cCI6MjA5MDIzMDM3MH0.tkhOBcRcDIJ4WlPx_c5QiqmKoWN1KtSd_MFiJMfoL2o";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
