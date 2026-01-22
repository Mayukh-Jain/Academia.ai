import { createClient } from '@supabase/supabase-js'

// ⚠️ REPLACE THESE WITH YOUR KEYS FROM THE .ENV FILE OR SUPABASE DASHBOARD
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
 // e.g., https://xyz.supabase.co
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
export const supabase = createClient(supabaseUrl, supabaseKey)