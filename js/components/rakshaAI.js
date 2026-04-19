class RakshaAIComponent {
  constructor() {
    this.messages = this.loadHistory();
    this.isOpen = false;
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
    const container = document.createElement('div');
    container.id = 'raksha-ai-container';
    container.className = 'fixed bottom-6 right-6 z-[9999]';
    
    container.innerHTML = `
      <!-- Floating Action Button -->
      <button id="raksha-fab" class="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 transform hover:scale-110 flex items-center justify-center border-2 border-white/20 active:scale-95 group overflow-hidden">
        <div class="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <i data-lucide="sparkles" class="w-8 h-8 relative z-10 group-hover:rotate-12 transition-transform"></i>
      </button>

      <!-- Premium Chat Panel -->
      <div id="raksha-panel" class="absolute bottom-20 right-0 w-[calc(100vw-32px)] md:w-[420px] h-[650px] max-h-[85vh] bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform scale-0 opacity-0 origin-bottom-right pointer-events-none translate-y-10">
        
        <!-- Premium Header -->
        <div class="p-6 bg-gradient-to-br from-primary-dark via-primary to-emerald-500 text-white relative overflow-hidden flex-shrink-0">
          <!-- Glassmorphism Background elements -->
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div class="flex justify-between items-center relative z-10">
            <div class="flex items-center space-x-4">
              <div class="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-[20px] border border-white/30 flex items-center justify-center shadow-inner group transition-transform hover:rotate-3">
                <i data-lucide="bot" class="w-7 h-7 text-white"></i>
              </div>
              <div>
                <h3 class="font-bold text-2xl tracking-tight leading-none brand-font">Raksha AI</h3>
                <div class="flex items-center mt-1.5 space-x-1.5">
                  <span class="w-2 h-2 bg-emerald-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(110,231,183,0.8)]"></span>
                  <span class="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/80">Always Active</span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-1">
              <button id="raksha-lang" class="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold text-white border border-white/10 transition-all uppercase">
                ${this.currentLang === 'en' ? 'हिन्दी' : 'EN'}
              </button>
              <button id="raksha-clear" class="p-2.5 hover:bg-white/10 rounded-xl transition-all" title="Clear Chat">
                <i data-lucide="trash-2" class="w-4 h-4 text-white/90"></i>
              </button>
              <button id="raksha-close" class="p-2.5 hover:bg-white/10 rounded-xl transition-all">
                <i data-lucide="x" class="w-5 h-5 text-white"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Chat Area with Custom Scrollbar -->
        <div id="raksha-messages" class="flex-1 bg-white p-6 overflow-y-auto space-y-6 scroll-smooth no-scrollbar relative z-10 -mt-2 rounded-t-[32px]">
          <!-- Messages will be injected here -->
        </div>

        <!-- Quick Prompts Slider -->
        <div id="raksha-suggestions" class="px-6 py-4 bg-white flex space-x-2 overflow-x-auto no-scrollbar border-t border-gray-50/50 flex-shrink-0">
          <button class="raksha-chip whitespace-nowrap text-[12px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-4 py-2 rounded-2xl hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all shadow-sm">Herd Summary</button>
          <button class="raksha-chip whitespace-nowrap text-[12px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-4 py-2 rounded-2xl hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all shadow-sm">Active Treatments</button>
          <button class="raksha-chip whitespace-nowrap text-[12px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-4 py-2 rounded-2xl hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all shadow-sm">Vaccine Alerts</button>
        </div>

        <!-- Premium Input Bar -->
        <div class="p-6 pt-0 bg-white flex-shrink-0">
          <form id="raksha-form" class="bg-gray-50/80 backdrop-blur-sm border border-gray-200 rounded-[24px] p-2 flex items-end space-x-2 shadow-inner focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all">
            <button type="button" id="raksha-mic" class="p-3 text-gray-400 hover:text-primary transition-all rounded-2xl hover:bg-white">
              <i data-lucide="mic" class="w-5 h-5"></i>
            </button>
            <textarea id="raksha-input" rows="1" placeholder="Type your message..." class="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-700 py-3 px-1 no-scrollbar resize-none max-h-32" style="height: 48px;"></textarea>
            <button type="submit" id="raksha-send" class="bg-primary hover:bg-primary-dark text-white p-3.5 rounded-2xl shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-all transform active:scale-90 disabled:opacity-30 disabled:scale-100">
              <i data-lucide="arrow-up" class="w-5 h-5"></i>
            </button>
          </form>
          <p class="text-[9px] text-gray-400 text-center mt-3 font-medium uppercase tracking-[0.1em]">AI guidance is informational only • PashuRaksha</p>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    if (window.lucide) window.lucide.createIcons();

    // Mapping elements
    this.els = {
      fab: document.getElementById('raksha-fab'),
      panel: document.getElementById('raksha-panel'),
      messagesBox: document.getElementById('raksha-messages'),
      form: document.getElementById('raksha-form'),
      input: document.getElementById('raksha-input'),
      sendBtn: document.getElementById('raksha-send'),
      micBtn: document.getElementById('raksha-mic'),
      langBtn: document.getElementById('raksha-lang'),
      clearBtn: document.getElementById('raksha-clear'),
      closeBtn: document.getElementById('raksha-close'),
      suggestions: document.querySelectorAll('.raksha-chip')
    };

    this.setupListeners();
    this.renderMessages();
  }

  setupListeners() {
    this.els.fab.addEventListener('click', () => this.togglePanel());
    this.els.closeBtn.addEventListener('click', () => this.togglePanel(false));
    this.els.clearBtn.addEventListener('click', () => this.clearChat());
    this.els.langBtn.addEventListener('click', () => this.toggleLang());
    
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
      this.els.input.style.height = '48px';
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
        this.handleUserSubmit();
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
      this.els.panel.classList.remove('scale-0', 'opacity-0', 'pointer-events-none', 'translate-y-10');
      this.els.panel.classList.add('scale-100', 'opacity-100', 'pointer-events-auto', 'translate-y-0');
      setTimeout(() => this.els.input.focus(), 600);
      this.scrollToBottom();
    } else {
      this.els.panel.classList.add('scale-0', 'opacity-0', 'pointer-events-none', 'translate-y-10');
      this.els.panel.classList.remove('scale-100', 'opacity-100', 'pointer-events-auto', 'translate-y-0');
    }
  }

  toggleLang() {
    this.currentLang = this.currentLang === 'en' ? 'hi' : 'en';
    localStorage.setItem('raksha_lang', this.currentLang);
    this.els.langBtn.textContent = this.currentLang === 'en' ? 'हिन्दी' : 'EN';
    window.showToast(`AI mode: ${this.currentLang === 'en' ? 'English' : 'Hindi'}`, 'info');
    this.renderMessages();
  }

  formatTime(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  renderMessages() {
    this.els.messagesBox.innerHTML = '';
    
    // Welcome Bubble
    this.appendMessage({
      role: 'assistant',
      content: this.currentLang === 'en' ? 'Namaste! I am Raksha AI. Your smart assistant for livestock and farm productivity. How can I help you today?' : 'नमस्ते! मैं रक्षा एआई हूँ। आपके पशुओं और फार्म की उत्पादकता के लिए आपका स्मार्ट सहायक। मैं आज आपकी क्या मदद कर सकता हूँ?',
      timestamp: new Date().toISOString(),
      isWelcome: true
    });

    this.messages.forEach(msg => this.appendMessage(msg));
    this.scrollToBottom();
  }

  appendMessage(msg) {
    const isUser = msg.role === 'user';
    const div = document.createElement('div');
    div.className = `flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in mb-6`;
    if (msg.id) div.id = msg.id;

    const innerHtml = `
      <div class="flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] relative group">
        <div class="px-5 py-4 rounded-[24px] ${isUser ? 'bg-primary text-white rounded-tr-[4px] shadow-[0_8px_20px_rgba(16,185,129,0.2)]' : 'bg-gray-100/80 text-gray-800 rounded-tl-[4px] border border-gray-100'} text-[14.5px] leading-[1.6] whitespace-pre-wrap font-medium">
          ${msg.content}
        </div>
        <div class="flex items-center mt-2 space-x-2 px-1">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            ${isUser ? 'You' : 'Raksha AI'}
          </span>
          <span class="text-[10px] text-gray-300 font-medium">
            ${this.formatTime(msg.timestamp)}
          </span>
        </div>
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
    div.className = 'flex justify-start animate-fade-in mb-6';
    div.innerHTML = `
      <div class="bg-gray-100/80 border border-gray-100 px-6 py-4 rounded-[24px] rounded-tl-[4px] flex items-center space-x-2 shadow-sm">
        <div class="w-2 h-2 bg-primary/30 rounded-full animate-bounce [animation-delay:-0.32s]"></div>
        <div class="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.16s]"></div>
        <div class="w-2 h-2 bg-primary/80 rounded-full animate-bounce"></div>
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
    if (confirm('Clear entire conversation history?')) {
      this.messages = [];
      this.saveHistory();
      this.renderMessages();
    }
  }

  async handleUserSubmit() {
    const text = this.els.input.value.trim();
    if (!text || this.isTyping || this.isCooldown) return;

    this.els.input.value = '';
    this.els.input.style.height = '48px';
    
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
        this.appendMessage({ role: 'assistant', content: "Our AI is resting for a moment. Automatic retry in 30 seconds.", timestamp: new Date().toISOString() });
        setTimeout(() => {
          this.isCooldown = false;
          this.handleUserSubmit();
        }, 30000);
      } else {
        window.showToast('AI connection lost. Please retry.', 'error');
      }
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
