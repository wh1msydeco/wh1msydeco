require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const supabase = require('./lib/supabase');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const RAFFLE_END = new Date(process.env.RAFFLE_END_DATE || CONFIG.raffleEndDate);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || CONFIG.adminPassword;

app.use(express.json());

app.use((req, res, next) => {
  const closedPaths = ['/', '/index.html', '/register', '/register.html'];
  if (!isRaffleOpen() && closedPaths.includes(req.path)) {
    return res.redirect('/ended.html');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

function isRaffleOpen() {
  return Date.now() < RAFFLE_END.getTime();
}

function normalizeUsername(raw) {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

function isAdmin(req) {
  const password = req.query.password || req.headers['x-admin-password'];
  return password === ADMIN_PASSWORD;
}

app.get('/api/status', (_req, res) => {
  res.json({
    open: isRaffleOpen(),
    endDate: RAFFLE_END.toISOString(),
  });
});

app.post('/api/register', async (req, res) => {
  if (!isRaffleOpen()) {
    return res.status(403).json({ error: 'raffle_closed' });
  }

  const { username, toploader, keychain } = req.body;
  const normalized = normalizeUsername(username || '');

  if (!normalized || normalized.length < 1) {
    return res.status(400).json({ error: 'invalid_username' });
  }

  if (!toploader && !keychain) {
    return res.status(400).json({ error: 'no_option_selected' });
  }

  const { error } = await supabase.from('registrations').upsert(
    {
      username: normalized,
      toploader: Boolean(toploader),
      keychain: Boolean(keychain),
    },
    { onConflict: 'username' }
  );

  if (error) {
    console.error('Supabase register error:', error.message);
    return res.status(500).json({ error: 'database_error' });
  }

  res.json({ success: true });
});

app.get('/api/export/:type', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const type = req.params.type;
  if (type !== 'toploader' && type !== 'keychain') {
    return res.status(400).json({ error: 'invalid_type' });
  }

  const { data, error } = await supabase
    .from('registrations')
    .select('username')
    .eq(type, true)
    .order('username', { ascending: true });

  if (error) {
    console.error('Supabase export error:', error.message);
    return res.status(500).json({ error: 'database_error' });
  }

  const usernames = (data || []).map((row) => row.username);
  const filename = `${type}_participants.txt`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(usernames.join('\n') + (usernames.length ? '\n' : ''));
});

app.get('/api/stats', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const [totalRes, toploaderRes, keychainRes] = await Promise.all([
    supabase.from('registrations').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('toploader', true),
    supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('keychain', true),
  ]);

  if (totalRes.error || toploaderRes.error || keychainRes.error) {
    console.error('Supabase stats error');
    return res.status(500).json({ error: 'database_error' });
  }

  res.json({
    total: totalRes.count || 0,
    toploader: toploaderRes.count || 0,
    keychain: keychainRes.count || 0,
    open: isRaffleOpen(),
    endDate: RAFFLE_END.toISOString(),
  });
});

app.get('/register', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`wh1msydeco running at http://localhost:${PORT}`);
  console.log(`Raffle ends: ${RAFFLE_END.toLocaleString()}`);
  console.log('Database: Supabase');
});
