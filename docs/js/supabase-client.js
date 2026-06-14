function getSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = window.SITE_CONFIG || {};

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('TU-PROYECTO')) {
    console.error('Configura docs/js/config.js con tu URL y publishable key de Supabase.');
    return null;
  }

  return window.supabase.createClient(supabaseUrl, supabaseAnonKey);
}

function isRaffleOpen() {
  const end = window.SITE_CONFIG?.raffleEndDate;
  if (!end) return true;
  return Date.now() < new Date(end).getTime();
}

function normalizeUsername(raw) {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

function goTo(page) {
  window.location.href = page;
}
