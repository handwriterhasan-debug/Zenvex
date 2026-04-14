import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://tbfmzdosysdgmagekmty.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_yrIZTQesQ_t5aj8e0tL9yg_dKj-xlcU";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
async function test() {
  const { data, error } = await supabase.from('schedules').insert([{ user_id: '123e4567-e89b-12d3-a456-426614174000', date: '2023-10-10', time_start: '10:00', time_end: '11:00', task: 'Test', category: 'Work', status: 'pending' }]);
  console.log(data, error);
}
test();
