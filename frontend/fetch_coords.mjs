import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\n]+)"?/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function checkData() {
  console.log('Checking Hotels...');
  const { data: hotels, error: hError } = await supabase
    .from('Hotels')
    .select('*')
    .ilike('destination', '%Darjeeling%');
  
  if (hError) console.error('Error fetching Hotels:', hError.message);
  else {
    const nullHotels = hotels.filter(h => h.latitude == null || h.longitude == null);
    console.log(`Found ${hotels.length} hotels. ${nullHotels.length} have null coordinates.`);
    nullHotels.forEach(h => console.log(`- ${h.hotel_name}`));
  }

  console.log('\nChecking Activities...');
  // check activities or Activities (case)
  let aError, activities;
  const res1 = await supabase.from('activities').select('*').ilike('destination', '%Darjeeling%');
  if (res1.error) {
    const res2 = await supabase.from('Activities').select('*').ilike('destination', '%Darjeeling%');
    aError = res2.error;
    activities = res2.data;
  } else {
    activities = res1.data;
  }

  if (aError) console.error('Error fetching Activities:', aError.message);
  else if (activities) {
    const nullActivities = activities.filter(a => a.latitude == null || a.longitude == null);
    console.log(`Found ${activities.length} activities. ${nullActivities.length} have null coordinates.`);
    nullActivities.forEach(a => console.log(`- ${a.activity_name}`));
  }
}

checkData();
