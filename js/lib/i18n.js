class I18n {
  constructor() {
    this.locales = window.locales || {};
    this.currentLang = 'en';
    this.initialized = false;
  }

  async init() {
    // Determine default language from browser
    const browserLang = navigator.language.startsWith('hi') ? 'hi' : 'en';
    this.currentLang = browserLang;

    // Try to get from Supabase User Metadata
    if (window.supabaseClient) {
      try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (session && session.user) {
          const user = session.user;
          if (user.user_metadata && user.user_metadata.language) {
            this.currentLang = user.user_metadata.language;
          } else {
            // Save default browser lang to profile if not set
            await window.supabaseClient.auth.updateUser({
              data: { language: this.currentLang }
            });
          }
        }
      } catch (e) {
        console.warn("Could not fetch user language preference", e);
      }
    }
    
    // Fallback to localStorage just in case
    const stored = localStorage.getItem('language');
    if (stored) this.currentLang = stored;

    this.initialized = true;
    this.updateDOM();
    this.updateSwitcherUI();
  }

  t(key) {
    if (!this.locales[this.currentLang]) return key;
    return this.locales[this.currentLang][key] || (this.locales['en'] && this.locales['en'][key]) || key;
  }

  updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('placeholder')) {
            el.placeholder = this.t(key);
        } else {
            el.value = this.t(key);
        }
      } else {
        el.innerHTML = this.t(key);
      }
    });
  }

  async switchLanguage(lang) {
    if (lang === this.currentLang) return;
    this.currentLang = lang;
    localStorage.setItem('language', lang);

    if (window.supabaseClient) {
      try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
           await window.supabaseClient.auth.updateUser({
             data: { language: lang }
           });
        }
      } catch (e) {
        console.warn("Could not save language to Supabase", e);
      }
    }

    this.updateDOM();
    this.updateSwitcherUI();
    
    // Re-render current view
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav) {
      activeNav.click(); // Triggers app.js router
    }

    // Show Toast
    if (lang === 'hi') {
      if (window.showToast) window.showToast(this.t('toast.langHi'), 'success');
    } else {
      if (window.showToast) window.showToast(this.t('toast.langEn'), 'success');
    }
  }

  updateSwitcherUI() {
    const switcherText = document.getElementById('current-lang-text');
    if (switcherText) {
      switcherText.innerHTML = this.currentLang === 'hi' ? 'हिंदी 🇮🇳' : 'English 🇬🇧';
    }
  }
}

window.i18n = new I18n();

document.addEventListener('DOMContentLoaded', () => {
  window.i18n.init();
});

window.toggleLanguageDropdown = function() {
  const menu = document.getElementById('language-menu');
  menu.classList.toggle('hidden');
};

window.selectLanguage = function(lang) {
  window.i18n.switchLanguage(lang);
  document.getElementById('language-menu').classList.add('hidden');
};

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('language-dropdown-container');
  const menu = document.getElementById('language-menu');
  if (dropdown && menu && !dropdown.contains(e.target)) {
    menu.classList.add('hidden');
  }
});
