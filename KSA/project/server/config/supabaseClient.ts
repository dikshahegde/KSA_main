// server/config/supabaseClient.js
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Get credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase credentials. Check your .env file.");
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Export for Node.js (CommonJS)
module.exports = supabase;
