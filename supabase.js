/* ===========================================================
   supabase.js
   Central Supabase client configuration.
   Replace SUPABASE_URL and SUPABASE_ANON_KEY with the values
   from your Supabase project (Project Settings > API).
   The anon key is safe to expose publicly — it only ever acts
   within the permissions granted by your Row Level Security
   policies (see schema.sql).
=========================================================== */

const SUPABASE_URL = "https://gxuijxyxcltyynkefbde.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dWlqeHl4Y2x0eXlua2VmYmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NzE0MDcsImV4cCI6MjEwMTU0NzQwN30.5Tw90MqEhlRXueFcX71L8U6m10Dy4TKDHF6K01tfEyY";

/* Single shared client instance used by every page */
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* Name of the storage bucket used for teacher profile photos */
const FACULTY_BUCKET = "faculty-images";
