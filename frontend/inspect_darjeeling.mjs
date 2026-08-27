import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\n]+)"?/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function inspect() {
  console.log("=== HOTELS ===");
  const { data: hotels, error: errH } = await supabase.from('Hotels').select('*').ilike('destination', '%Darjeeling%').order('price_per_night', { ascending: true });
  if (errH) console.error("Error Hotels:", errH);
  else console.table(hotels);

  console.log("=== RESTAURANTS ===");
  const { data: restaurants, error: errR } = await supabase.from('restaurants').select('*').ilike('destination', '%Darjeeling%').order('cost_per_meal', { ascending: true });
  if (errR) console.error("Error Restaurants:", errR);
  else console.table(restaurants);

  console.log("=== ACTIVITIES ===");
  const { data: activities, error: errA } = await supabase.from('activities').select('*').ilike('destination', '%Darjeeling%').order('cost_per_person', { ascending: true });
  if (errA) console.error("Error Activities:", errA);
  else console.table(activities);

  console.log("=== TRANSPORT ===");
  const { data: transport, error: errT } = await supabase.from('transport').select('*').ilike('destination', '%Darjeeling%').order('cost_per_person', { ascending: true });
  if (errT) console.error("Error Transport:", errT);
  else console.table(transport);
}

inspect();
