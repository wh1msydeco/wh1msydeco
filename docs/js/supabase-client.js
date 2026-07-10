function getSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = window.SITE_CONFIG || {};

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('TU-PROYECTO')) {
    console.error('Configura docs/js/config.js con tu URL y publishable key de Supabase.');
    return null;
  }

  return window.supabase.createClient(supabaseUrl, supabaseAnonKey);
}

function getRaffleStartDate() {
  const start = window.SITE_CONFIG?.raffleStartDate;
  return start ? new Date(start) : null;
}

function getRaffleEndDate() {
  const end = window.SITE_CONFIG?.raffleEndDate;
  return end ? new Date(end) : null;
}

function isRaffleNotYetOpen() {
  const start = getRaffleStartDate();
  if (!start) return false;
  return Date.now() < start.getTime();
}

function isRaffleClosed() {
  const end = getRaffleEndDate();
  if (!end) return false;
  return Date.now() >= end.getTime();
}

function isRaffleOpen() {
  if (isRaffleNotYetOpen() || isRaffleClosed()) return false;
  return true;
}

function getRafflePhase() {
  if (isRaffleNotYetOpen()) return 'upcoming';
  if (isRaffleClosed()) return 'closed';
  return 'open';
}

function normalizeUsername(raw) {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

function goTo(page) {
  window.location.href = page;
}
