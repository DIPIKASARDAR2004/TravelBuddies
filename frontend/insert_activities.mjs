import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\n]+)"?/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function insertActivities() {
  const newActivities = [
    { destination: 'Darjeeling', activity_name: 'Japanese Peace Pagoda Visit', cost_per_person: 0 },
    { destination: 'Darjeeling', activity_name: 'Mahakal Temple Visit', cost_per_person: 0 },
    { destination: 'Darjeeling', activity_name: 'Observatory Hill Viewpoint', cost_per_person: 0 },
    { destination: 'Darjeeling', activity_name: 'Ghoom Monastery Visit', cost_per_person: 100 },
    { destination: 'Darjeeling', activity_name: 'Padmaja Naidu Himalayan Zoological Park Visit', cost_per_person: 150 },
    { destination: 'Darjeeling', activity_name: 'Rock Garden Visit', cost_per_person: 150 },
    { destination: 'Darjeeling', activity_name: 'Happy Valley Tea Estate Tour', cost_per_person: 400 },
    { destination: 'Darjeeling', activity_name: 'Tenzing Rock Climbing Experience', cost_per_person: 800 },
    { destination: 'Darjeeling', activity_name: 'Darjeeling Toy Train Joyride', cost_per_person: 1200 }
  ];

  let inserted = 0;
  for (const item of newActivities) {
    // Check if exists
    const { data: existing, error: err } = await supabase
      .from('activities')
      .select('*')
      .eq('destination', item.destination)
      .eq('activity_name', item.activity_name);
      
    if (err) {
      console.error(`Error checking ${item.activity_name}:`, err);
      continue;
    }
    
    if (existing && existing.length > 0) {
      console.log(`Skipped duplicate: ${item.activity_name}`);
    } else {
      const { error: insertErr } = await supabase.from('activities').insert(item);
      if (insertErr) {
        console.error(`Error inserting ${item.activity_name}:`, insertErr);
      } else {
        console.log(`Inserted: ${item.activity_name}`);
        inserted++;
      }
    }
  }

  console.log(`\nInserted ${inserted} new activities.\n`);

  console.log("=== FINAL DARJEELING ACTIVITIES ===");
  const { data: a } = await supabase
    .from('activities')
    .select('activity_name, cost_per_person')
    .ilike('destination', '%Darjeeling%')
    .order('cost_per_person');
    
  console.log(JSON.stringify(a, null, 2));
}

insertActivities();
