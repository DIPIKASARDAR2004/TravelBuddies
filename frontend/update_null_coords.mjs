import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\n]+)"?/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

const updates = [
  // Hotels
  { table: 'Hotels', nameCol: 'hotel_name', name: 'The Elgin Luxury Resort', lat: 27.0450, lng: 88.2655, isDemo: false },
  { table: 'Hotels', nameCol: 'hotel_name', name: 'Darjeeling Mountain View Inn', lat: 27.0381, lng: 88.2611, isDemo: true },
  { table: 'Hotels', nameCol: 'hotel_name', name: 'Himalayan Sunrise Boutique', lat: 27.0382, lng: 88.2612, isDemo: true },
  { table: 'Hotels', nameCol: 'hotel_name', name: 'Darjeeling Tea Garden Resort', lat: 27.0383, lng: 88.2613, isDemo: true },
  
  // Activities
  { table: 'activities', nameCol: 'activity_name', name: 'Japanese Peace Pagoda Visit', lat: 27.0315, lng: 88.2576, isDemo: false },
  { table: 'activities', nameCol: 'activity_name', name: 'Mahakal Temple Visit', lat: 27.0491, lng: 88.2652, isDemo: false },
  { table: 'activities', nameCol: 'activity_name', name: 'Observatory Hill Viewpoint', lat: 27.0485, lng: 88.2650, isDemo: false },
  { table: 'activities', nameCol: 'activity_name', name: 'Ghoom Monastery Visit', lat: 27.0090, lng: 88.2460, isDemo: false },
  { table: 'activities', nameCol: 'activity_name', name: 'Padmaja Naidu Himalayan Zoological Park Visit', lat: 27.0585, lng: 88.2536, isDemo: false },
  { table: 'activities', nameCol: 'activity_name', name: 'Rock Garden Visit', lat: 27.0540, lng: 88.2320, isDemo: false },
  { table: 'activities', nameCol: 'activity_name', name: 'Happy Valley Tea Estate Tour', lat: 27.0500, lng: 88.2570, isDemo: false },
  { table: 'activities', nameCol: 'activity_name', name: 'Tenzing Rock Climbing Experience', lat: 27.0560, lng: 88.2510, isDemo: false },
  { table: 'activities', nameCol: 'activity_name', name: 'Darjeeling Toy Train Joyride', lat: 27.0330, lng: 88.2615, isDemo: false },
  { table: 'activities', nameCol: 'activity_name', name: 'Premium Himalayan Tea Tasting', lat: 27.0384, lng: 88.2614, isDemo: true },
];

async function runUpdates() {
  let successCount = 0;
  let failCount = 0;
  for (const item of updates) {
    const { error } = await supabase
      .from(item.table)
      .update({ latitude: item.lat, longitude: item.lng })
      .eq(item.nameCol, item.name);
    
    if (error) {
      console.error(`Error updating ${item.name}: ${error.message}`);
      failCount++;
    } else {
      console.log(`Updated: ${item.name} ${item.isDemo ? '(DEMO COORDINATE — NOT A VERIFIED PROPERTY LOCATION)' : '(Verified Location)'}`);
      successCount++;
    }
  }

  console.log(`\nResults: ${successCount} updated successfully, ${failCount} failed.`);
  
  // Re-check nulls
  console.log('\nVerifying remaining nulls in Darjeeling...');
  const { data: hotels } = await supabase.from('Hotels').select('*').ilike('destination', '%Darjeeling%');
  const nullHotels = hotels ? hotels.filter(h => h.latitude == null || h.longitude == null) : [];
  
  const { data: activities } = await supabase.from('activities').select('*').ilike('destination', '%Darjeeling%');
  const nullActivities = activities ? activities.filter(a => a.latitude == null || a.longitude == null) : [];

  console.log(`Remaining null Hotels: ${nullHotels.length}`);
  console.log(`Remaining null Activities: ${nullActivities.length}`);
}

runUpdates();
