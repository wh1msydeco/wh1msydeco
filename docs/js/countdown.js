let raffleTargetDate = null;
let raffleCountdownMode = 'end';

function initRaffleSchedule() {
  const phase = getRafflePhase();
  const onEndedPage = window.location.pathname.includes('ended');

  if (phase === 'closed' && !onEndedPage) {
    goTo('ended.html');
    return;
  }

  if (phase === 'upcoming') {
    raffleTargetDate = getRaffleStartDate();
    raffleCountdownMode = 'start';
  } else if (phase === 'open') {
    raffleTargetDate = getRaffleEndDate();
    raffleCountdownMode = 'end';
  } else {
    raffleTargetDate = null;
  }

  updateCountdownLabel();
  applyRaffleUi();
}

function updateCountdownLabel() {
  const labelEl = document.querySelector('.countdown-label[data-i18n]');
  if (!labelEl) return;

  const key = raffleCountdownMode === 'start' ? 'countdownOpensLabel' : 'countdownLabel';
  labelEl.setAttribute('data-i18n', key);
  labelEl.textContent = t(key);
}

function applyRaffleUi() {
  const cta = document.querySelector('.cta-box[href="register.html"]');
  if (!cta) return;

  const phase = getRafflePhase();

  if (phase === 'open') {
    cta.classList.remove('cta-box--disabled');
    cta.setAttribute('aria-disabled', 'false');
    cta.setAttribute('data-i18n', 'ctaBox');
    cta.textContent = t('ctaBox');
    cta.onclick = null;
    return;
  }

  cta.classList.add('cta-box--disabled');
  cta.setAttribute('aria-disabled', 'true');
  cta.setAttribute('data-i18n', phase === 'upcoming' ? 'ctaNotOpen' : 'ctaClosed');
  cta.textContent = t(phase === 'upcoming' ? 'ctaNotOpen' : 'ctaClosed');
  cta.onclick = (e) => e.preventDefault();
}

function formatCountdown(ms) {
  if (ms <= 0) {
    return raffleCountdownMode === 'start' ? t('countdownOpening') : t('countdownEnded');
  }

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
  if (!el) return;

  const phase = getRafflePhase();

  if (phase === 'closed') {
    el.textContent = t('countdownEnded');
    return;
  }

  if (phase === 'upcoming') {
    raffleTargetDate = getRaffleStartDate();
    raffleCountdownMode = 'start';
  } else if (phase === 'open') {
    raffleTargetDate = getRaffleEndDate();
    raffleCountdownMode = 'end';
  }

  updateCountdownLabel();
  applyRaffleUi();

  if (!raffleTargetDate) {
    el.textContent = '--';
    return;
  }

  const remaining = raffleTargetDate.getTime() - Date.now();
  el.textContent = formatCountdown(remaining);

  if (remaining <= 0) {
    if (phase === 'upcoming') {
      window.location.reload();
      return;
    }

    if (!window.location.pathname.includes('ended')) {
      goTo('ended.html');
    }
  }
}

function initCountdown() {
  initRaffleSchedule();
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

document.addEventListener('DOMContentLoaded', initCountdown);
