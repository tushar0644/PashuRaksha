class RakshaAIComponent {
  constructor() {
    this.messages = this.loadHistory();
    this.isOpen = false;
    this.isTyping = false;
    this.isCooldown = false;
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
    // 1. Inject HTML
    const container = document.createElement('div');
    container.innerHTML = `
      <!-- Floating Button -->
      <button id="raksha-fab" class="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center z-40">
        <i data-lucide="bot" class="w-7 h-7"></i>
      </button>

      <!-- Chat Panel -->
      <div id="raksha-panel" class="fixed inset-0 md:inset-auto md:bottom-24 md:right-6 md:w-96 w-full h-full md:h-auto bg-white md:rounded-2xl shadow-2xl md:border border-gray-100 flex flex-col overflow-hidden z-50 transform scale-0 opacity-0 origin-bottom md:origin-bottom-right transition-all duration-300">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-primary to-primary-light text-white p-4 flex justify-between items-center shadow-sm z-10">
          <div class="flex items-center space-x-3">
            <div class="bg-white/20 p-2 rounded-full backdrop-blur-sm">
              <i data-lucide="bot" class="w-5 h-5 text-white"></i>
            </div>
            <div>
              <h3 class="font-bold text-lg brand-font leading-tight">Raksha AI</h3>
              <p class="text-xs text-white/80" data-i18n="ai.subtitle">Smart Livestock Assistant</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button id="raksha-clear" class="p-2 hover:bg-white/20 rounded-lg transition-colors" title="Clear Chat">
              <i data-lucide="trash-2" class="w-4 h-4 text-white"></i>
            </button>
            <button id="raksha-close" class="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <i data-lucide="x" class="w-5 h-5 text-white"></i>
            </button>
          </div>
        </div>

        <!-- Chat Area -->
        <div id="raksha-messages" class="flex-1 p-4 overflow-y-auto bg-[#f8fafc] space-y-4 h-auto md:h-96 relative pb-20 md:pb-4">
          <!-- Welcome Message is dynamically inserted if empty -->
        </div>

        <!-- Quick Prompts (Horizontal Scroll) -->
        <div id="raksha-prompts" class="px-4 py-2 bg-white border-t border-gray-50 flex space-x-2 overflow-x-auto no-scrollbar">
          <button class="raksha-prompt whitespace-nowrap text-xs bg-emerald-50 text-primary-dark border border-emerald-100 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">Which animals are under treatment?</button>
          <button class="raksha-prompt whitespace-nowrap text-xs bg-emerald-50 text-primary-dark border border-emerald-100 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">Can I sell milk from TAG-106?</button>
          <button class="raksha-prompt whitespace-nowrap text-xs bg-emerald-50 text-primary-dark border border-emerald-100 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors">My cow has fever, what should I do?</button>
        </div>

        <!-- Input Area -->
        <form id="raksha-form" class="p-3 bg-white border-t border-gray-100 flex items-end space-x-2">
          <div class="flex-1 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all flex items-center px-3 py-2">
            <textarea id="raksha-input" rows="1" placeholder="Ask Raksha AI..." data-i18n="ai.placeholder" class="w-full bg-transparent border-none outline-none resize-none text-sm text-gray-700 max-h-32" style="min-height: 20px;"></textarea>
          </div>
          <button type="submit" id="raksha-send" class="bg-primary hover:bg-primary-dark text-white p-2.5 rounded-xl transition-colors shadow-sm flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
            <i data-lucide="send" class="w-4 h-4"></i>
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(container);
    if(window.lucide) window.lucide.createIcons();

    // 2. Element References
    this.els = {
      fab: document.getElementById('raksha-fab'),
      panel: document.getElementById('raksha-panel'),
      closeBtn: document.getElementById('raksha-close'),
      clearBtn: document.getElementById('raksha-clear'),
      messagesBox: document.getElementById('raksha-messages'),
      form: document.getElementById('raksha-form'),
      input: document.getElementById('raksha-input'),
      sendBtn: document.getElementById('raksha-send'),
      prompts: document.querySelectorAll('.raksha-prompt')
    };

    // 3. Event Listeners
    this.els.fab.addEventListener('click', () => this.togglePanel());
    this.els.closeBtn.addEventListener('click', () => this.togglePanel(false));
    this.els.clearBtn.addEventListener('click', () => this.clearChat());
    
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

    // Auto-resize textarea
    this.els.input.addEventListener('input', () => {
      this.els.input.style.height = 'auto';
      this.els.input.style.height = (this.els.input.scrollHeight) + 'px';
    });

    this.els.prompts.forEach(btn => {
      btn.addEventListener('click', () => {
        this.els.input.value = btn.textContent;
        this.handleUserSubmit();
      });
    });

    // 4. Initial Render
    this.renderMessages();
  }

  togglePanel(forceState) {
    this.isOpen = forceState !== undefined ? forceState : !this.isOpen;
    if (this.isOpen) {
      this.els.panel.classList.remove('scale-0', 'opacity-0');
      this.els.panel.classList.add('scale-100', 'opacity-100');
      setTimeout(() => this.els.input.focus(), 300);
      this.scrollToBottom();
    } else {
      this.els.panel.classList.remove('scale-100', 'opacity-100');
      this.els.panel.classList.add('scale-0', 'opacity-0');
    }
  }

  formatTime(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  renderMessages() {
    this.els.messagesBox.innerHTML = '';
    
    // Welcome Message
    this.appendMessage({
      role: 'assistant',
      content: window.i18n ? window.i18n.t('ai.welcome') : 'Namaste! I am Raksha AI. How can I help with your farm today?',
      timestamp: new Date().toISOString(),
      isWelcome: true
    });

    // History
    this.messages.forEach(msg => this.appendMessage(msg));
    this.scrollToBottom();
  }

  appendMessage(msg) {
    const isUser = msg.role === 'user';
    const div = document.createElement('div');
    div.className = `flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in mb-4`;
    if(msg.id) div.id = msg.id;
    
    const timeHtml = `<span class="text-[10px] text-gray-400 mt-1 mx-1">${this.formatTime(msg.timestamp)}</span>`;
    
    const innerHtml = `
      <div class="flex items-end space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''} max-w-[85%]">
        ${!isUser && !msg.isWelcome ? `
          <div class="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mb-1">
            <i data-lucide="bot" class="w-3 h-3 text-primary-dark"></i>
          </div>
        ` : ''}
        <div class="msg-bubble px-4 py-2.5 rounded-2xl ${isUser ? 'bg-primary text-white rounded-br-sm shadow-md' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'} text-sm leading-relaxed whitespace-pre-wrap">
          ${msg.content}
        </div>
      </div>
      ${timeHtml}
    `;
    
    div.innerHTML = innerHtml;
    this.els.messagesBox.appendChild(div);
    if(window.lucide) window.lucide.createIcons();
  }

  updateMessage(id, content) {
    const div = document.getElementById(id);
    if (div) {
      const bubble = div.querySelector('.msg-bubble');
      if (bubble) bubble.textContent = content;
    }
  }

  showTypingIndicator() {
    this.isTyping = true;
    const div = document.createElement('div');
    div.id = 'raksha-typing';
    div.className = `flex flex-col items-start animate-fade-in`;
    div.innerHTML = `
      <div class="flex items-end space-x-2 max-w-[85%]">
        <div class="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mb-1">
          <i data-lucide="bot" class="w-3 h-3 text-primary-dark"></i>
        </div>
        <div class="px-4 py-3 bg-white border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm flex space-x-1">
          <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
          <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      </div>
    `;
    this.els.messagesBox.appendChild(div);
    if(window.lucide) window.lucide.createIcons();
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    this.isTyping = false;
    const typing = document.getElementById('raksha-typing');
    if (typing) typing.remove();
  }

  scrollToBottom() {
    setTimeout(() => {
      this.els.messagesBox.scrollTop = this.els.messagesBox.scrollHeight;
    }, 50);
  }

  clearChat() {
    if(confirm('Are you sure you want to clear the chat history?')) {
      this.messages = [];
      this.saveHistory();
      this.renderMessages();
    }
  }

  async handleUserSubmit() {
    const text = this.els.input.value.trim();
    if (!text || this.isTyping || this.isCooldown) return;

    // Reset input
    this.els.input.value = '';
    this.els.input.style.height = 'auto';
    
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
        // Handle Rate Limiting
        this.isCooldown = true;
        this.appendMessage({ 
          role: 'assistant', 
          content: "AI is busy right now. Please retry in 1 minute.", 
          timestamp: new Date().toISOString() 
        });
        
        // Disable UI for 30s
        this.els.input.disabled = true;
        this.els.input.placeholder = "Cooling down... (30s)";
        
        setTimeout(() => {
          this.isCooldown = false;
          this.els.input.disabled = false;
          this.els.sendBtn.disabled = false;
          this.els.input.placeholder = "Ask Raksha AI...";
          this.els.input.focus();
          
          // Auto-retry once after cooldown
          this.appendMessage({ 
            role: 'assistant', 
            content: "Retrying your last request now...", 
            timestamp: new Date().toISOString() 
          });
          this.els.input.value = text;
          this.handleUserSubmit();
        }, 30000);
        
        return;
      }

      window.showToast(error.message || 'Failed to connect to Raksha AI API.', 'error');
      this.appendMessage({ role: 'assistant', content: "I'm having trouble connecting to my brain. Please try again in a moment.", timestamp: new Date().toISOString() });
    } finally {
      if (!this.isCooldown) {
        this.els.sendBtn.disabled = false;
        this.isTyping = false;
      }
      this.scrollToBottom();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.rakshaAI = new RakshaAIComponent();
});
