import { scriptClient } from "./scriptClient.mjs";
const supabase = scriptClient({ mutates: false });

async function check() {
  const { data, error } = await supabase.from('Hotels').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}

check();
