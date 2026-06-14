let raffleEndDate = null;

async function fetchRaffleStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    raffleEndDate = new Date(data.endDate);

    if (!data.open && !window.location.pathname.includes('ended')) {
      window.location.href = '/ended.html';
    }
  } catch {
    /* offline fallback — keep page usable */
  }
}

function formatCountdown(ms) {
  if (ms <= 0) return t('countdownEnded');

  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${String(hours).padStart(2, '0')}h`);
  parts.push(`${String(minutes).padStart(2, '0')}m`);
  parts.push(`${String(seconds).padStart(2, '0')}s`);

  return parts.join(' ');
}

function updateCountdown() {
  const el = document.getElementById('countdown-timer');
  if (!el || !raffleEndDate) return;

  const remaining = raffleEndDate.getTime() - Date.now();
  el.textContent = formatCountdown(remaining);

  if (remaining <= 0 && !window.location.pathname.includes('ended')) {
    window.location.href = '/ended.html';
  }
}

async function initCountdown() {
  await fetchRaffleStatus();
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

document.addEventListener('DOMContentLoaded', initCountdown);
