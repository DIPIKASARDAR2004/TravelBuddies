import { scriptClient } from "./scriptClient.mjs";
const supabase = scriptClient({ mutates: false });

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
