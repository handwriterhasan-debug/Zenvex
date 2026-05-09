import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');
async function test() {
  let { data, error } = await supabase.from('habits').select('*').limit(1);
  console.log("habits:", data, error);
}
test();
