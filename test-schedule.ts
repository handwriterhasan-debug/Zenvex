import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');
async function test() {
  const { data, error } = await supabase.from('schedules').insert({
    id: crypto.randomUUID(),
    user_id: 'e8def50c-e1fc-403d-bc65-021b3a32338c', // dummy
    date: '2026-05-09',
    task: 'test',
    category: 'test',
    status: 'pending'
  });
  console.log("error:", error);
}
test();
