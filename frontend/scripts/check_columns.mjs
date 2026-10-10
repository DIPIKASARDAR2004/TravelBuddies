import { scriptClient } from "./scriptClient.mjs";
const supabase = scriptClient({ mutates: false });

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
