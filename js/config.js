const SUPABASE_URL = 'https://ujnjtvlkxhdbdbngdaeb.supabase.co'; // <-- Paste your Project URL here
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbmp0dmxreGhkYmRibmdkYWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNDM5NjAsImV4cCI6MjA2MzgxOTk2MH0.g1sD1xeJ05lHncxDDMUrhEiPGD8bYdyHWFJoDpq6aHs'; // <-- Paste your anon public key here

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
