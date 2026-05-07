import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function test() {
  const { data, error } = await supabase.from('habit_logs').select('*').limit(1);
  console.log("habit_logs error:", error);
}

test();
