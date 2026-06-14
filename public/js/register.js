document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const errorEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');

  if (!form) return;

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

    submitBtn.disabled = true;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, toploader, keychain }),
      });

      const data = await res.json();

      if (res.status === 403) {
        errorEl.textContent = t('errorClosed');
        setTimeout(() => {
          window.location.href = '/ended.html';
        }, 1500);
        return;
      }

      if (!res.ok) {
        if (data.error === 'invalid_username') {
          errorEl.textContent = t('errorUsername');
        } else if (data.error === 'no_option_selected') {
          errorEl.textContent = t('errorOptions');
        } else {
          errorEl.textContent = t('errorGeneric');
        }
        return;
      }

      window.location.href = '/success.html';
    } catch {
      errorEl.textContent = t('errorGeneric');
    } finally {
      submitBtn.disabled = false;
    }
  });
});
