class AuthService {
  constructor() {
    this.supabase = window.supabaseClient;
    this.currentUser = null;
    this.hasShownLoginToast = false;
    this.init();
  }

  async init() {
    // Check active session
    const { data: { session }, error } = await this.supabase.auth.getSession();
    
    if (session) {
      this.currentUser = session.user;
      this.hasShownLoginToast = true; // Prevents toast on initial load
      this.updateUIForAuth(true);
      
      // Check if user just verified email
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('verified') === 'true') {
        window.showToast('Email successfully verified!', 'success');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      this.updateUIForAuth(false);
      this.renderAuthModal();
    }

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      // Ignore INITIAL_SESSION or TOKEN_REFRESHED to prevent duplicate toasts
      if (event === 'SIGNED_IN') {
        this.currentUser = session.user;
        this.updateUIForAuth(true);
        this.closeAuthModal();
        
        if (!this.hasShownLoginToast) {
          window.showToast('Successfully signed in!', 'success');
          this.hasShownLoginToast = true;
        }
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.hasShownLoginToast = false;
        this.updateUIForAuth(false);
        this.renderAuthModal();
        window.showToast('Signed out', 'warning');
      }
    });
  }

  async signUp(email, password, role) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: role }, // Store role in user metadata
          emailRedirectTo: 'https://tushar0644.github.io/PashuRaksha/auth/callback.html'
        }
      });
      if (error) throw error;
      
      // Usually requires email confirmation, but for MVP we might auto-login if disabled in Supabase
      if(data.user && data.user.identities && data.user.identities.length === 0) {
          window.showToast('Account already exists', 'warning');
      } else {
          window.showToast('Signup successful! Check your email to confirm.', 'success');
      }
      return data;
    } catch (error) {
      window.showToast(error.message, 'error');
      console.error(error);
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } catch (error) {
      window.showToast(error.message, 'error');
      console.error(error);
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      window.showToast(error.message, 'error');
      console.error(error);
    }
  }

  updateUIForAuth(isAuthenticated) {
    const mainContent = document.querySelector('main');
    const sidebar = document.querySelector('aside');
    
    if (!isAuthenticated) {
      if(mainContent) mainContent.style.filter = 'blur(5px)';
      if(sidebar) sidebar.style.pointerEvents = 'none';
    } else {
      if(mainContent) mainContent.style.filter = 'none';
      if(sidebar) sidebar.style.pointerEvents = 'auto';
      
      // Update sidebar username
      const emailElem = document.getElementById('sidebar-user-email');
      if(emailElem && this.currentUser) {
        emailElem.textContent = this.currentUser.email;
      }
    }
  }

  renderAuthModal() {
    let container = document.getElementById('auth-modal-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'auth-modal-container';
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div class="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 fade-in">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 m-4 relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary-light"></div>
          
          <div class="text-center mb-8">
            <div class="inline-flex bg-emerald-50 text-primary p-3 rounded-xl mb-4">
               <i data-lucide="shield-check" class="w-8 h-8"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 brand-font">Welcome to PashuRaksha</h2>
            <p class="text-sm text-gray-500 mt-1">Sign in to manage your farm</p>
          </div>

          <form id="auth-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" id="auth-email" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" id="auth-password" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            
            <div class="pt-2">
              <button type="submit" id="auth-btn-login" class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all flex justify-center items-center">
                <span>Sign In</span>
              </button>
            </div>
          </form>
          
          <div class="mt-6 text-center text-sm text-gray-500">
            Don't have an account? <a href="#" id="auth-toggle-mode" class="text-primary font-medium hover:underline">Sign Up</a>
          </div>
        </div>
      </div>
    `;

    // Re-init icons
    if(window.lucide) window.lucide.createIcons();

    // Event Listeners
    let isLogin = true;
    const form = document.getElementById('auth-form');
    const toggleBtn = document.getElementById('auth-toggle-mode');
    const loginBtnText = document.querySelector('#auth-btn-login span');

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      isLogin = !isLogin;
      loginBtnText.textContent = isLogin ? 'Sign In' : 'Create Account';
      toggleBtn.textContent = isLogin ? 'Sign Up' : 'Sign In';
      document.querySelector('.text-center p').textContent = isLogin ? 'Sign in to manage your farm' : 'Register your farm today';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      
      const btn = document.getElementById('auth-btn-login');
      btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>';
      if(window.lucide) window.lucide.createIcons();

      if (isLogin) {
        await this.signIn(email, password);
      } else {
        await this.signUp(email, password, 'farmer');
      }
      
      if(document.getElementById('auth-btn-login')) {
        document.getElementById('auth-btn-login').innerHTML = '<span>' + (isLogin ? 'Sign In' : 'Create Account') + '</span>';
      }
    });
  }

  closeAuthModal() {
    const container = document.getElementById('auth-modal-container');
    if (container) container.innerHTML = '';
  }
}

// Instantiate
window.authService = new AuthService();
