import { supabase } from './src/supabaseClient.js';

async function checkTables() {
  const { data, error } = await supabase.from('notes').select('*').limit(1);
  console.log('notes table:', { data, error });
  
  const { data: d3, error: e3 } = await supabase.from('user_data').select('*').limit(1);
  console.log('user_data table:', { data: d3, error: e3 });
}

checkTables();
