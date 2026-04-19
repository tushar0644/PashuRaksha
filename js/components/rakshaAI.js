class RakshaAIComponent {
  constructor() {
    this.messages = this.loadHistory();
    this.isOpen = false;
    this.isMinimized = false;
    this.isTyping = false;
    this.isCooldown = false;
    this.currentLang = localStorage.getItem('raksha_lang') || 'en';
    this.initUI();
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem('raksha_ai_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load chat history', e);
    }
    return [];
  }

  saveHistory() {
    localStorage.setItem('raksha_ai_history', JSON.stringify(this.messages));
  }

  initUI() {
    // 1. Inject Modern HTML structure
    const container = document.createElement('div');
    container.id = 'raksha-ai-root';
    container.className = 'fixed bottom-6 right-6 z-[9999] flex flex-col items-end';
    
    container.innerHTML = `
      <!-- Chat Panel -->
      <div id="raksha-panel" class="mb-4 w-[calc(100vw-32px)] md:w-[400px] h-[600px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-500 ease-out transform scale-90 opacity-0 origin-bottom-right pointer-events-none translate-y-4">
        
        <!-- Header: Premium Gradient & Glassmorphism -->
        <div class="bg-gradient-to-br from-primary-dark via-primary to-primary-light p-5 pb-8 relative overflow-hidden">
          <!-- Decorative blobs -->
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div class="absolute -bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
          
          <div class="flex justify-between items-start relative z-10">
            <div class="flex items-center space-x-3">
              <div class="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                <i data-lucide="sparkles" class="w-6 h-6 text-white animate-pulse"></i>
              </div>
              <div>
                <h3 class="font-bold text-xl text-white brand-font tracking-tight">Raksha AI</h3>
                <p class="text-[11px] text-white/80 font-medium uppercase tracking-widest">Smart Livestock Help</p>
              </div>
            </div>
            <div class="flex items-center space-x-1">
              <!-- Language Switch -->
              <button id="raksha-lang-toggle" class="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white border border-white/20 transition-all uppercase">
                ${this.currentLang === 'en' ? 'हिन्दी' : 'EN'}
              </button>
              <button id="raksha-clear" class="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Clear History">
                <i data-lucide="trash-2" class="w-4 h-4 text-white/80 group-hover:text-white"></i>
              </button>
              <button id="raksha-minimize" class="p-2 hover:bg-white/10 rounded-lg transition-colors group">
                <i data-lucide="minus" class="w-4 h-4 text-white/80 group-hover:text-white"></i>
              </button>
              <button id="raksha-close" class="p-2 hover:bg-white/10 rounded-lg transition-colors group">
                <i data-lucide="x" class="w-4 h-4 text-white/80 group-hover:text-white"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Chat Area: Floating Bubbles Layout -->
        <div id="raksha-messages" class="flex-1 -mt-4 bg-white rounded-t-3xl relative z-20 p-5 overflow-y-auto space-y-4 scroll-smooth no-scrollbar">
          <!-- Messages flow here -->
        </div>

        <!-- Suggestions: Chip layout -->
        <div id="raksha-suggestions" class="px-4 py-3 bg-white flex space-x-2 overflow-x-auto no-scrollbar border-t border-gray-50/50">
          <button class="raksha-chip whitespace-nowrap text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-3 py-1.5 rounded-full hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all">Animal Status</button>
          <button class="raksha-chip whitespace-nowrap text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-3 py-1.5 rounded-full hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all">Vaccine Due</button>
          <button class="raksha-chip whitespace-nowrap text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-3 py-1.5 rounded-full hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all">Cow Health</button>
        </div>

        <!-- Input: Modern Bar -->
        <div class="p-4 bg-white border-t border-gray-100">
          <form id="raksha-form" class="flex items-center space-x-2 bg-gray-50 rounded-2xl p-1.5 border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all shadow-sm">
            <button type="button" id="raksha-mic" class="p-2.5 text-gray-400 hover:text-primary transition-colors hover:bg-white rounded-xl">
              <i data-lucide="mic" class="w-5 h-5"></i>
            </button>
            <textarea id="raksha-input" rows="1" placeholder="Ask Raksha AI..." class="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 py-2 no-scrollbar resize-none max-h-32" style="height: 24px;"></textarea>
            <button type="submit" id="raksha-send" class="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-40 disabled:active:scale-100">
              <i data-lucide="arrow-up" class="w-5 h-5"></i>
            </button>
          </form>
        </div>
      </div>

      <!-- Floating Button (FAB) -->
      <button id="raksha-fab" class="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark text-white rounded-[24px] shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center relative group overflow-hidden border-2 border-white/20">
        <div class="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors"></div>
        <i data-lucide="sparkles" class="w-8 h-8 relative z-10 group-hover:rotate-12 transition-transform"></i>
        <div id="raksha-badge" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center scale-0 transition-transform">1</div>
      </button>
    `;

    document.body.appendChild(container);
    if (window.lucide) window.lucide.createIcons();

    // 2. Element Mapping
    this.els = {
      root: container,
      panel: document.getElementById('raksha-panel'),
      fab: document.getElementById('raksha-fab'),
      messagesBox: document.getElementById('raksha-messages'),
      form: document.getElementById('raksha-form'),
      input: document.getElementById('raksha-input'),
      sendBtn: document.getElementById('raksha-send'),
      micBtn: document.getElementById('raksha-mic'),
      langToggle: document.getElementById('raksha-lang-toggle'),
      clearBtn: document.getElementById('raksha-clear'),
      minimizeBtn: document.getElementById('raksha-minimize'),
      closeBtn: document.getElementById('raksha-close'),
      suggestions: document.querySelectorAll('.raksha-chip')
    };

    // 3. Setup Listeners
    this.setupListeners();
    this.renderMessages();
  }

  setupListeners() {
    this.els.fab.addEventListener('click', () => this.togglePanel());
    this.els.closeBtn.addEventListener('click', () => this.togglePanel(false));
    this.els.minimizeBtn.addEventListener('click', () => this.minimize());
    this.els.clearBtn.addEventListener('click', () => this.clearChat());
    this.els.langToggle.addEventListener('click', () => this.toggleLang());
    
    this.els.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleUserSubmit();
    });

    this.els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleUserSubmit();
      }
    });

    this.els.input.addEventListener('input', () => {
      this.els.input.style.height = '24px';
      this.els.input.style.height = (this.els.input.scrollHeight) + 'px';
    });

    this.els.suggestions.forEach(btn => {
      btn.addEventListener('click', () => {
        this.els.input.value = btn.textContent;
        this.handleUserSubmit();
      });
    });

    // Voice Input Setup
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = this.currentLang === 'en' ? 'en-IN' : 'hi-IN';

      this.els.micBtn.addEventListener('click', () => {
        if (this.isListening) {
          recognition.stop();
        } else {
          recognition.start();
          this.els.micBtn.classList.add('text-red-500', 'animate-pulse');
          this.isListening = true;
        }
      });

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        this.els.input.value = text;
        this.els.micBtn.classList.remove('text-red-500', 'animate-pulse');
        this.isListening = false;
        this.handleUserSubmit();
      };

      recognition.onerror = () => {
        this.els.micBtn.classList.remove('text-red-500', 'animate-pulse');
        this.isListening = false;
      };

      recognition.onend = () => {
        this.els.micBtn.classList.remove('text-red-500', 'animate-pulse');
        this.isListening = false;
      };
    } else {
      this.els.micBtn.style.display = 'none';
    }
  }

  togglePanel(force) {
    this.isOpen = force !== undefined ? force : !this.isOpen;
    if (this.isOpen) {
      this.els.panel.classList.remove('scale-90', 'opacity-0', 'pointer-events-none', 'translate-y-4');
      this.els.panel.classList.add('scale-100', 'opacity-100', 'pointer-events-auto', 'translate-y-0');
      this.isMinimized = false;
      this.els.panel.style.height = '600px';
      setTimeout(() => this.els.input.focus(), 500);
      this.scrollToBottom();
    } else {
      this.els.panel.classList.add('scale-90', 'opacity-0', 'pointer-events-none', 'translate-y-4');
      this.els.panel.classList.remove('scale-100', 'opacity-100', 'pointer-events-auto', 'translate-y-0');
    }
  }

  minimize() {
    this.isMinimized = !this.isMinimized;
    if (this.isMinimized) {
      this.els.panel.style.height = '100px';
      this.els.messagesBox.style.display = 'none';
      document.getElementById('raksha-suggestions').style.display = 'none';
      this.els.form.parentElement.style.display = 'none';
    } else {
      this.els.panel.style.height = '600px';
      setTimeout(() => {
        this.els.messagesBox.style.display = 'block';
        document.getElementById('raksha-suggestions').style.display = 'flex';
        this.els.form.parentElement.style.display = 'block';
        this.scrollToBottom();
      }, 300);
    }
  }

  toggleLang() {
    this.currentLang = this.currentLang === 'en' ? 'hi' : 'en';
    localStorage.setItem('raksha_lang', this.currentLang);
    this.els.langToggle.textContent = this.currentLang === 'en' ? 'हिन्दी' : 'EN';
    window.showToast(`Switched to ${this.currentLang === 'en' ? 'English' : 'Hindi'}`, 'info');
    // Re-initialize speech recognition lang if active
  }

  formatTime(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  renderMessages() {
    this.els.messagesBox.innerHTML = '';
    
    // Welcome
    this.appendMessage({
      role: 'assistant',
      content: this.currentLang === 'en' ? 'Namaste! I am Raksha AI. How can I help with your livestock today?' : 'नमस्ते! मैं रक्षा एआई हूँ। आज मैं आपके पशुओं की कैसे मदद कर सकता हूँ?',
      timestamp: new Date().toISOString(),
      isWelcome: true
    });

    this.messages.forEach(msg => this.appendMessage(msg));
    this.scrollToBottom();
  }

  appendMessage(msg) {
    const isUser = msg.role === 'user';
    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in mb-4 px-1`;
    if (msg.id) div.id = msg.id;

    const innerHtml = `
      <div class="flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]">
        <div class="msg-bubble px-4 py-3 rounded-2xl ${isUser ? 'bg-primary text-white rounded-tr-none shadow-md' : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'} text-[13.5px] leading-relaxed whitespace-pre-wrap">
          ${msg.content}
        </div>
        <span class="text-[9px] text-gray-400 mt-1 font-medium tracking-wide uppercase px-1">
          ${isUser ? 'You' : 'Raksha AI'} • ${this.formatTime(msg.timestamp)}
        </span>
      </div>
    `;

    div.innerHTML = innerHtml;
    this.els.messagesBox.appendChild(div);
    this.scrollToBottom();
  }

  showTypingIndicator() {
    this.isTyping = true;
    const div = document.createElement('div');
    div.id = 'raksha-typing';
    div.className = 'flex justify-start animate-fade-in mb-4 px-1';
    div.innerHTML = `
      <div class="flex flex-col items-start">
        <div class="bg-gray-100 border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1.5">
          <div class="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style="animation-delay: 0s"></div>
          <div class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    `;
    this.els.messagesBox.appendChild(div);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.isTyping = false;
    const el = document.getElementById('raksha-typing');
    if (el) el.remove();
  }

  scrollToBottom() {
    setTimeout(() => {
      this.els.messagesBox.scrollTop = this.els.messagesBox.scrollHeight;
    }, 50);
  }

  clearChat() {
    if (confirm(this.currentLang === 'en' ? 'Clear all chat history?' : 'क्या आप सारी चैट मिटाना चाहते हैं?')) {
      this.messages = [];
      this.saveHistory();
      this.renderMessages();
    }
  }

  async handleUserSubmit() {
    const text = this.els.input.value.trim();
    if (!text || this.isTyping || this.isCooldown) return;

    this.els.input.value = '';
    this.els.input.style.height = '24px';
    
    const userMsg = { role: 'user', content: text, timestamp: new Date().toISOString() };
    this.messages.push(userMsg);
    this.saveHistory();
    this.appendMessage(userMsg);
    this.scrollToBottom();

    this.showTypingIndicator();
    this.els.sendBtn.disabled = true;

    try {
      const responseContent = await window.aiService.sendMessage(text);
      this.hideTypingIndicator();
      
      const aiMsg = { role: 'assistant', content: responseContent, timestamp: new Date().toISOString() };
      this.messages.push(aiMsg);
      this.saveHistory();
      this.appendMessage(aiMsg);

    } catch (error) {
      this.hideTypingIndicator();
      if (error.status === 429) {
        this.isCooldown = true;
        this.appendMessage({ role: 'assistant', content: "AI is busy. Please retry in 1 minute.", timestamp: new Date().toISOString() });
        this.els.input.disabled = true;
        this.els.input.placeholder = "Cooldown (30s)...";
        setTimeout(() => {
          this.isCooldown = false;
          this.els.input.disabled = false;
          this.els.sendBtn.disabled = false;
          this.els.input.placeholder = "Ask Raksha AI...";
          this.els.input.value = text;
          this.handleUserSubmit();
        }, 30000);
        return;
      }
      window.showToast('Network error. Check your connection.', 'error');
    } finally {
      if (!this.isCooldown) {
        this.els.sendBtn.disabled = false;
        this.isTyping = false;
      }
      this.scrollToBottom();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.rakshaAI = new RakshaAIComponent();
});
