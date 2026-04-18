// Initialize Supabase Client
if (!window.supabase) {
  console.error('Supabase SDK not loaded. Ensure CDN is included in index.html');
}

const supabaseUrl = window.ENV.SUPABASE_URL;
const supabaseKey = window.ENV.SUPABASE_ANON_KEY;

// Create reusable client
window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
