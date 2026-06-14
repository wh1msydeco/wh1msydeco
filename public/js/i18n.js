const translations = {
  en: {
    langHint: 'You can switch the language here ♡',
    introGreeting: 'Hi applehead! 🍎',
    introP1: "If you're here, it's because you want to enter the drawing for a custom commission.",
    introHow: "Here's how it works:",
    introP2:
      "I'll select five people to receive a custom toploader each and another five people to receive a custom keychain each!",
    introP3:
      'Right now, all you have to do is sign up for whichever of the two drawings you want to enter (you can choose both).',
    introP4:
      "I'll give you three days to join; after that, I'll select the winners completely at random and post the results on my stories.",
    introP5:
      "Once the winners are chosen, I'll send each of them a form to ask about their preferences.",
    introQuestion: 'Want to participate?',
    ctaBox: 'Click to enter the giveaway',
    registerTitle:
      'Thank you so much for wanting to participate! Please enter your instagram username.',
    optionsLabel: 'Choose which drawing you want to enter (you can choose both options)',
    optionToploader: 'Toploader',
    optionKeychain: 'Keychain',
    inputPlaceholder: 'Enter your instagram user (..◜ᴗ◝..)',
    submitBtn: 'JOIN',
    registerNote: 'Note: This information is only being collected for the purposes of the drawing.',
    successTitle: 'Registration complete!',
    successP1: 'Please wait and stay tuned until the day of the drawing.',
    successP2: 'You could be one of the five winners ദ്ദി ˉ͈̀꒳ˉ͈́ )✧',
    goodLuck: 'GOOD LUCK!!!!!!!!!',
    countdownLabel: 'Time left to join the giveaway:',
    countdownEnded: 'The giveaway has ended!',
    endedTitle: 'The giveaway has ended',
    endedText:
      'Thank you for your interest! Registration is now closed. Stay tuned on my stories for the results.',
    errorUsername: 'Please enter a valid Instagram username.',
    errorOptions: 'Please select at least one option (Toploader or Keychain).',
    errorClosed: 'The giveaway has ended. Registration is no longer available.',
    errorGeneric: 'Something went wrong. Please try again.',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  },
  es: {
    langHint: 'Puedes cambiar el idioma aquí ♡',
    introGreeting: '¡Hola applehead! 🍎',
    introP1: 'Si estás aquí dentro es porque quieres participar en el sorteo para conseguir una comisión.',
    introHow: 'Te explico como funciona:',
    introP2:
      '¡Seleccionaré a cinco personas para hacerles una comisión de toploader a cada una y otras cinco personas para hacerles un llavero a cada una!',
    introP3:
      'Ahora mismo solo tienes que apuntarte e indicar a cuál de los dos sorteos deseas entrar (puedes elegir los dos).',
    introP4:
      'Dejaré tres días para que podáis registraros, pasados esos días seleccionaré a los ganadores de manera totalmente aleatoria y subiré a mis stories los resultados. ¡Así que atento porque podrías ser uno de los ganadores!',
    introP5: 'Una vez elegidos mandaré un form a cada uno de ellos para conocer sus preferencias.',
    introQuestion: '¿Quieres participar?',
    ctaBox: 'Click para entrar en el sorteo',
    registerTitle:
      '¡Muchas gracias por querer participar! Por favor escribe tu usuario de instagram.',
    optionsLabel: 'Elige a cuál de los dos sorteos quieres entrar (puedes elegir ambas opciones)',
    optionToploader: 'Toploader',
    optionKeychain: 'Llavero',
    inputPlaceholder: 'Escribe tu usuario de instagram (..◜ᴗ◝..)',
    submitBtn: 'PARTICIPAR',
    registerNote: 'Nota: Toda la información recopilada será usada sólo para el sorteo.',
    successTitle: '¡Registro completado!',
    successP1: 'Por favor espera los resultados del sorteo.',
    successP2: 'Podrías ser uno de los cinco ganadores ി ˉ͈̀꒳ˉ͈́ )✧',
    goodLuck: '¡¡¡¡¡¡¡¡¡¡¡¡MUCHA SUERTE!!!!!!!!!',
    countdownLabel: 'Tiempo restante para apuntarte al sorteo:',
    countdownEnded: '¡El sorteo ha terminado!',
    endedTitle: 'El sorteo ya ha terminado',
    endedText:
      '¡Gracias por tu interés! El registro ya está cerrado. Estate atento a mis stories para ver los resultados.',
    errorUsername: 'Por favor, escribe un usuario de Instagram válido.',
    errorOptions: 'Por favor, elige al menos una opción (Toploader o Llavero).',
    errorClosed: 'El sorteo ha terminado. Ya no es posible registrarse.',
    errorGeneric: 'Algo salió mal. Por favor, inténtalo de nuevo.',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  },
};

let currentLang = localStorage.getItem('wh1msydeco-lang') || 'es';

function t(key) {
  return translations[currentLang][key] || translations.en[key] || key;
}

function setLanguage(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('wh1msydeco-lang', lang);
  applyTranslations();
  updateLangButtons();
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = t(key);
    if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
      el.placeholder = value;
    } else {
      el.textContent = value;
    }
  });

  document.documentElement.lang = currentLang;
}

function updateLangButtons() {
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

function initLanguage() {
  applyTranslations();
  updateLangButtons();

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });
}

document.addEventListener('DOMContentLoaded', initLanguage);
