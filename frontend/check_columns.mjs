import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('protected_bookings')
    .select('dispute_reason')
    .limit(1);
    
  if (error) {
    console.error("Error querying dispute_reason:", error.message);
  } else {
    console.log("dispute_reason column exists!");
  }
}
check();
