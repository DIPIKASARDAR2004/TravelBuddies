import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="?([^"\n]+)"?/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="?([^"\n]+)"?/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function insertData() {
  const newHotels = [
    { destination: 'Darjeeling', hotel_name: 'Hill View Residency', price_per_night: 1500, rating: 4.3, is_women_friendly: true },
    { destination: 'Darjeeling', hotel_name: 'Cedar Grove Inn', price_per_night: 2000, rating: 4.5, is_women_friendly: false },
    { destination: 'Darjeeling', hotel_name: 'Summit Valley Hotel', price_per_night: 3500, rating: 4.7, is_women_friendly: true },
    { destination: 'Darjeeling', hotel_name: 'Alpine Heights Retreat', price_per_night: 5200, rating: 4.8, is_women_friendly: true }
  ];

  const newRestaurants = [
    { destination: 'Darjeeling', restaurant_name: 'The Cozy Momos Cafe', cost_per_meal: 500, rating: 4.4 },
    { destination: 'Darjeeling', restaurant_name: 'Sunset Spice Kitchen', cost_per_meal: 650, rating: 4.0 },
    { destination: 'Darjeeling', restaurant_name: 'Everest Elite Lounge', cost_per_meal: 1900, rating: 4.8 }
  ];

  const newActivities = [
    { destination: 'Darjeeling', activity_name: 'Darjeeling Ropeway Ride', cost_per_person: 750 },
    { destination: 'Darjeeling', activity_name: 'Premium Tea Estate Tasting Experience', cost_per_person: 2800 }
  ];

  const newTransport = [
    { destination: 'Darjeeling', transport_mode: 'Private Cab (Point-to-Point)', cost_per_person: 500 },
    { destination: 'Darjeeling', transport_mode: 'Luxury SUV Rental (Half Day)', cost_per_person: 2000 }
  ];

  async function insertIfNotExists(table, matchColumns, data) {
    let inserted = 0;
    let skipped = 0;
    for (const item of data) {
      // Check if exists
      const matchQuery = supabase.from(table).select('*');
      for (const col of matchColumns) {
        matchQuery.eq(col, item[col]);
      }
      const { data: existing, error: err } = await matchQuery;
      
      if (err) {
        console.error(`Error checking ${table}:`, err);
        continue;
      }
      
      if (existing && existing.length > 0) {
        console.log(`Skipped duplicate in ${table}: ${item[matchColumns[1]]}`);
        skipped++;
      } else {
        const { error: insertErr } = await supabase.from(table).insert(item);
        if (insertErr) {
          console.error(`Error inserting into ${table}:`, insertErr);
        } else {
          console.log(`Inserted into ${table}: ${item[matchColumns[1]]}`);
          inserted++;
        }
      }
    }
    return { inserted, skipped };
  }

  const hStats = await insertIfNotExists('Hotels', ['destination', 'hotel_name'], newHotels);
  const rStats = await insertIfNotExists('restaurants', ['destination', 'restaurant_name'], newRestaurants);
  const aStats = await insertIfNotExists('activities', ['destination', 'activity_name'], newActivities);
  const tStats = await insertIfNotExists('transport', ['destination', 'transport_mode'], newTransport);

  console.log("\n=== INSERTION STATS ===");
  console.log(`Hotels: ${hStats.inserted} inserted, ${hStats.skipped} skipped`);
  console.log(`Restaurants: ${rStats.inserted} inserted, ${rStats.skipped} skipped`);
  console.log(`Activities: ${aStats.inserted} inserted, ${aStats.skipped} skipped`);
  console.log(`Transport: ${tStats.inserted} inserted, ${tStats.skipped} skipped`);
  console.log("=======================\n");

  console.log("=== FINAL DATASET ===");
  
  const { data: hotels } = await supabase.from('Hotels').select('hotel_name, price_per_night, rating').ilike('destination', '%Darjeeling%').order('price_per_night', { ascending: true });
  console.log("HOTELS:");
  console.table(hotels);

  const { data: restaurants } = await supabase.from('restaurants').select('restaurant_name, cost_per_meal, rating').ilike('destination', '%Darjeeling%').order('cost_per_meal', { ascending: true });
  console.log("RESTAURANTS:");
  console.table(restaurants);

  const { data: activities } = await supabase.from('activities').select('activity_name, cost_per_person').ilike('destination', '%Darjeeling%').order('cost_per_person', { ascending: true });
  console.log("ACTIVITIES:");
  console.table(activities);

  const { data: transport } = await supabase.from('transport').select('transport_mode, cost_per_person').ilike('destination', '%Darjeeling%').order('cost_per_person', { ascending: true });
  console.log("TRANSPORT:");
  console.table(transport);
}

insertData();
