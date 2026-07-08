require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function check() {
  const client = createClient(supabaseUrl, supabaseKey);
  
  console.log("--- PROFESSIONALS ---");
  const { data: pros, error: prosErr } = await client.from("professionals").select("id, full_name, rating_avg, total_reviews");
  console.log(prosErr || pros);

  console.log("--- REVIEWS ---");
  const { data: revs, error: revsErr } = await client.from("reviews").select("*");
  console.log(revsErr || revs);

  console.log("--- BOOKINGS ---");
  const { data: bookings, error: bookErr } = await client.from("bookings").select("id, booking_code, status, client_id, professional_id");
  console.log(bookErr || bookings);
}

check();
