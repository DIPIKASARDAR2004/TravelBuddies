const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('protected_bookings')
    .insert({
      hotel_id: 'test_hotel',
      destination: 'test',
      travellers: 2,
      nights: 2,
      rooms: 1,
      amount_paise: 1000,
      currency: 'INR',
      status: 'PAYMENT_PENDING'
    })
    .select('id')
    .single();

  console.log("Data:", data);
  console.log("Error:", error);
}

run();
