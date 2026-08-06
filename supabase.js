/* ===========================================================
   supabase.js
   Central Supabase client configuration.
   Replace SUPABASE_URL and SUPABASE_ANON_KEY with the values
   from your Supabase project (Project Settings > API).
   The anon key is safe to expose publicly — it only ever acts
   within the permissions granted by your Row Level Security
   policies (see schema.sql).
=========================================================== */

const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-PUBLIC-ANON-KEY";

/* Single shared client instance used by every page */
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* Name of the storage bucket used for teacher profile photos */
const FACULTY_BUCKET = "faculty-images";
