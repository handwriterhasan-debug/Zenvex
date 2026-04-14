import { supabase } from './src/supabaseClient';
async function run() {
  const { data, error } = await supabase.from('user_settings').insert({
    id: '00000000-0000-0000-0000-000000000000',
    theme: 'dark',
    currency: 'USD',
    monthly_income: 0,
    savings_balance: 0,
    day_end_time: '23:59',
    initial_balance: 0,
    initial_expenses: 0
  }).select();
  console.log('user_settings:', error ? error.message : 'success');
}
run();
