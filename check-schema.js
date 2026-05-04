import { supabase } from './src/supabaseClient.js';
import fs from 'fs';

async function check() {
  const { data, error } = await supabase.from('habits').select('*').limit(1);
  if (error) {
    console.error("Error fetching habits:", error.message);
  } else {
    console.log("Habit fields:", data && data.length > 0 ? Object.keys(data[0]) : "No data, but table exists. Trying to insert a record to see what fails...");
    
    // Insert dummy record and catch error to see columns
    const { error: insertError } = await supabase.from('habits').insert({ 
      id: "00000000-0000-0000-0000-000000000000",
      user_id: "00000000-0000-0000-0000-000000000000",
      name: "Test" 
    });
    console.log("Insert error (might show missing columns or schema details):", insertError?.message || "No error");
  }
}
check();
