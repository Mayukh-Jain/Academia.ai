import { createClient } from '@supabase/supabase-js'

// ⚠️ REPLACE THESE WITH YOUR KEYS FROM THE .ENV FILE OR SUPABASE DASHBOARD
const supabaseUrl = 'https://qmrnenmjgqzgrpqtmqol.supabase.co'
 // e.g., https://xyz.supabase.co
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcm5lbm1qZ3F6Z3JwcXRtcW9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTIyMTcsImV4cCI6MjA4NDU4ODIxN30.LD0m5_J3f6wDjqpYeSZ0WbRBdGkIeUdwEd5ypi9bOi4' 

export const supabase = createClient(supabaseUrl, supabaseKey)