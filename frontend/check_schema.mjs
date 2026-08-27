import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\n]+)"?/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function check() {
  const { data, error } = await supabase.from('Hotels').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}

check();

check();
