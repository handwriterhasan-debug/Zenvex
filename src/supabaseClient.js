import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tbfmzdosysdgmagekmty.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_yrIZTQesQ_t5aj8e0tL9yg_dKj-xlcU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
