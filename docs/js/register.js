document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const errorEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');

  if (!form) return;

  if (!isRaffleOpen()) {
    goTo('ended.html');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const username = document.getElementById('instagram-user').value;
    const toploader = document.getElementById('opt-toploader').checked;
    const keychain = document.getElementById('opt-keychain').checked;

    if (!username.trim()) {
      errorEl.textContent = t('errorUsername');
      return;
    }

    if (!toploader && !keychain) {
      errorEl.textContent = t('errorOptions');
      return;
    }

    if (!isRaffleOpen()) {
      errorEl.textContent = t('errorClosed');
      setTimeout(() => goTo('ended.html'), 1500);
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      errorEl.textContent = t('errorGeneric');
      return;
    }

    submitBtn.disabled = true;

    try {
      const { error } = await client.rpc('register_participant', {
        p_username: normalizeUsername(username),
        p_toploader: toploader,
        p_keychain: keychain,
      });

      if (error) {
        if (error.message.includes('invalid_username')) {
          errorEl.textContent = t('errorUsername');
        } else if (error.message.includes('no_option_selected')) {
          errorEl.textContent = t('errorOptions');
        } else if (error.message.includes('raffle_closed')) {
          errorEl.textContent = t('errorClosed');
          setTimeout(() => goTo('ended.html'), 1500);
        } else {
          errorEl.textContent = t('errorGeneric');
        }
        return;
      }

      goTo('success.html');
    } catch {
      errorEl.textContent = t('errorGeneric');
    } finally {
      submitBtn.disabled = false;
    }
  });
});
