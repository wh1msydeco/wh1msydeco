const REGISTER_GIFS = {
  default: 'images/gif-register.gif',
  toploader: 'images/gif-toploader.gif',
  keychain: 'images/gif-keychain.gif',
  both: 'images/gif-duo.gif',
  error: 'images/gif-both.gif',
};

function setRegisterGif(src, { force = false } = {}) {
  const img = document.getElementById('register-gif');
  if (!img) return;

  if (!force && img.dataset.current === src) return;

  img.dataset.current = src;
  img.classList.add('is-switching');
  img.src = src;
  img.onload = () => {
    img.classList.remove('is-switching');
    img.classList.add('is-pop');
    window.setTimeout(() => img.classList.remove('is-pop'), 320);
  };
}

function getRegisterGifSrc(toploader, keychain) {
  if (toploader && keychain) return REGISTER_GIFS.both;
  if (toploader) return REGISTER_GIFS.toploader;
  if (keychain) return REGISTER_GIFS.keychain;
  return REGISTER_GIFS.default;
}

function updateRegisterGif() {
  const toploaderEl = document.getElementById('opt-toploader');
  const keychainEl = document.getElementById('opt-keychain');
  if (!toploaderEl || !keychainEl) return;

  setRegisterGif(getRegisterGifSrc(toploaderEl.checked, keychainEl.checked));
}

function showRegisterErrorGif() {
  setRegisterGif(REGISTER_GIFS.error, { force: true });
}

function setFormError(errorEl, key) {
  if (!errorEl) return;
  errorEl.dataset.errorKey = key;
  errorEl.textContent = t(key);
}

function clearFormError(errorEl) {
  if (!errorEl) return;
  delete errorEl.dataset.errorKey;
  errorEl.textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const errorEl = document.getElementById('form-error');
  const submitBtn = document.getElementById('submit-btn');
  const toploaderEl = document.getElementById('opt-toploader');
  const keychainEl = document.getElementById('opt-keychain');

  if (!form) return;

  if (isRaffleClosed()) {
    goTo('ended.html');
    return;
  }

  if (isRaffleNotYetOpen()) {
    goTo('index.html');
    return;
  }

  const registerGif = document.getElementById('register-gif');
  const usernameEl = document.getElementById('instagram-user');
  if (registerGif) {
    registerGif.dataset.current = REGISTER_GIFS.default;
    toploaderEl?.addEventListener('change', updateRegisterGif);
    keychainEl?.addEventListener('change', updateRegisterGif);
    usernameEl?.addEventListener('input', () => {
      if (errorEl.dataset.errorKey) updateRegisterGif();
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormError(errorEl);

    const username = document.getElementById('instagram-user').value;
    const toploader = document.getElementById('opt-toploader').checked;
    const keychain = document.getElementById('opt-keychain').checked;

    if (!username.trim()) {
      setFormError(errorEl, 'errorUsername');
      showRegisterErrorGif();
      return;
    }

    if (!toploader && !keychain) {
      setFormError(errorEl, 'errorOptions');
      showRegisterErrorGif();
      return;
    }

    if (!isRaffleOpen()) {
      setFormError(errorEl, isRaffleNotYetOpen() ? 'errorNotOpen' : 'errorClosed');
      if (isRaffleClosed()) {
        setTimeout(() => goTo('ended.html'), 1500);
      }
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setFormError(errorEl, 'errorGeneric');
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
          setFormError(errorEl, 'errorUsername');
          showRegisterErrorGif();
        } else if (error.message.includes('no_option_selected')) {
          setFormError(errorEl, 'errorOptions');
          showRegisterErrorGif();
        } else if (error.message.includes('raffle_not_open')) {
          setFormError(errorEl, 'errorNotOpen');
          showRegisterErrorGif();
        } else if (error.message.includes('raffle_closed')) {
          setFormError(errorEl, 'errorClosed');
          setTimeout(() => goTo('ended.html'), 1500);
        } else {
          setFormError(errorEl, 'errorGeneric');
        }
        return;
      }

      goTo('success.html');
    } catch {
      setFormError(errorEl, 'errorGeneric');
    } finally {
      submitBtn.disabled = false;
    }
  });
});
