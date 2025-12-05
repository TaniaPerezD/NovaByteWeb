import {createClient} from "@supabase/supabase-js";
export const supabase = createClient(
    "https://nvfhmlfbocdiczpxgidu.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZmhtbGZib2NkaWN6cHhnaWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNzEyNzUsImV4cCI6MjA3MzY0NzI3NX0.3tnqThhBZblaC3bbH6nfJRD-TKg2WVhkF3RpV2BIHyA"
)