import { createClient } from "@supabase/supabase-js";

// Run from frontend/. Never print keys or add a service-role key here.
try { process.loadEnvFile(".env.local"); }
catch (error) { if (error.code !== "ENOENT") throw error; }

export function scriptClient({ mutates = false } = {}) {
  if (mutates && !process.argv.includes("--allow-writes")) {
    throw new Error("This script changes database rows. Back up the target database, review the script, then explicitly pass --allow-writes.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Set the Supabase URL and anon key in frontend/.env.local or the environment.");
  return createClient(url, key);
}
