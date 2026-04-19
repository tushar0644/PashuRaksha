class RakshaAIComponent {
  constructor() {
    this.messages = this.loadHistory();
    this.isOpen = false;
    this.isTyping = false;
    this.isListening = false;
    this.isSpeaking = false;
    this.isVoiceEnabled = localStorage.getItem('raksha_voice_enabled') === 'true';
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
    container.id = 'raksha-ai-root';
    container.className = 'fixed bottom-6 right-6 z-[9999]';
    
    container.innerHTML = `
      <!-- Floating Action Button -->
      <button id="raksha-fab" class="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center border-2 border-white/20 active:scale-95 group overflow-hidden">
        <div class="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors"></div>
        <i data-lucide="sparkles" class="w-8 h-8 relative z-10 group-hover:rotate-12 transition-transform"></i>
      </button>

      <!-- Voice + Chat Panel -->
      <div id="raksha-panel" class="absolute bottom-20 right-0 w-[calc(100vw-32px)] md:w-[420px] h-[650px] max-h-[85vh] bg-white rounded-[32px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform scale-0 opacity-0 origin-bottom-right pointer-events-none translate-y-10">
        
        <!-- Premium Header -->
        <div class="p-6 bg-gradient-to-br from-primary-dark via-primary to-emerald-500 text-white relative overflow-hidden flex-shrink-0">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          
          <div class="flex justify-between items-start relative z-10">
            <div class="flex items-center space-x-4">
              <div class="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-[20px] border border-white/30 flex items-center justify-center shadow-inner relative group">
                <i data-lucide="mic" id="raksha-speaking-icon" class="w-7 h-7 text-white transition-transform ${this.isSpeaking ? 'animate-pulse scale-110' : ''}"></i>
                <!-- Voice wave animation while AI is talking -->
                <div id="raksha-speaking-wave" class="absolute inset-0 flex items-center justify-center space-x-0.5 pointer-events-none ${this.isSpeaking ? '' : 'hidden'}">
                  <div class="w-1 h-3 bg-white/60 rounded-full animate-voice-bar"></div>
                  <div class="w-1 h-5 bg-white/80 rounded-full animate-voice-bar" style="animation-delay: 0.1s"></div>
                  <div class="w-1 h-4 bg-white/60 rounded-full animate-voice-bar" style="animation-delay: 0.2s"></div>
                </div>
              </div>
              <div>
                <h3 class="font-bold text-xl tracking-tight leading-none brand-font">Raksha Voice AI</h3>
                <p class="text-[10px] text-white/80 font-semibold uppercase tracking-[0.1em] mt-1.5">Smart Livestock Assistant</p>
              </div>
            </div>
            <div class="flex items-center space-x-1.5">
              <!-- Voice Toggle -->
              <button id="raksha-voice-toggle" class="p-2.5 hover:bg-white/10 rounded-xl transition-all ${this.isVoiceEnabled ? 'text-white' : 'text-white/40'}" title="Voice Output ON/OFF">
                <i data-lucide="${this.isVoiceEnabled ? 'volume-2' : 'volume-x'}" class="w-4 h-4"></i>
              </button>
              <button id="raksha-lang-toggle" class="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold text-white border border-white/10 transition-all uppercase">
                ${this.currentLang === 'en' ? 'हिन्दी' : 'EN'}
              </button>
              <button id="raksha-close" class="p-2.5 hover:bg-white/10 rounded-xl transition-all">
                <i data-lucide="x" class="w-5 h-5 text-white"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Chat Area -->
        <div id="raksha-messages" class="flex-1 bg-white p-5 overflow-y-auto space-y-6 scroll-smooth no-scrollbar relative z-10 -mt-2 rounded-t-[32px]">
          <!-- Welcome Message -->
        </div>

        <!-- Voice Quick Actions -->
        <div id="raksha-shortcuts" class="px-5 py-3 bg-white flex space-x-2 overflow-x-auto no-scrollbar border-t border-gray-50/50 flex-shrink-0">
          <button class="raksha-shortcut whitespace-nowrap text-[11px] font-bold bg-gray-50 text-gray-500 border border-gray-100 px-3 py-2 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">Farm Summary</button>
          <button class="raksha-shortcut whitespace-nowrap text-[11px] font-bold bg-gray-50 text-gray-500 border border-gray-100 px-3 py-2 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">Vaccines Due</button>
          <button class="raksha-shortcut whitespace-nowrap text-[11px] font-bold bg-gray-50 text-gray-500 border border-gray-100 px-3 py-2 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">Sick Animals</button>
          <button class="raksha-shortcut whitespace-nowrap text-[11px] font-bold bg-gray-50 text-gray-500 border border-gray-100 px-3 py-2 rounded-xl hover:bg-primary/5 hover:text-primary transition-all">Milk Safe?</button>
        </div>

        <!-- Unified Input: Mic + Text -->
        <div class="p-5 pt-0 bg-white flex-shrink-0">
          <div id="raksha-voice-wave" class="hidden mb-3 h-8 flex items-center justify-center space-x-1">
             <div class="w-1 h-4 bg-primary animate-pulse"></div>
             <div class="w-1 h-8 bg-primary animate-pulse" style="animation-delay: 0.1s"></div>
             <div class="w-1 h-6 bg-primary animate-pulse" style="animation-delay: 0.2s"></div>
             <div class="w-1 h-4 bg-primary animate-pulse" style="animation-delay: 0.3s"></div>
          </div>
          
          <form id="raksha-form" class="bg-gray-50 border border-gray-200 rounded-[24px] p-2 flex items-end space-x-2 shadow-inner focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all">
            <button type="button" id="raksha-mic" class="p-3.5 text-gray-400 hover:text-primary transition-all rounded-2xl hover:bg-white flex-shrink-0 relative">
              <i data-lucide="mic" class="w-6 h-6"></i>
              <div id="raksha-mic-ring" class="absolute inset-0 border-2 border-primary rounded-2xl animate-ping opacity-0"></div>
            </button>
            <textarea id="raksha-input" rows="1" placeholder="Type or ask by voice..." class="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-700 py-3 px-1 no-scrollbar resize-none max-h-32" style="height: 48px;"></textarea>
            <button type="submit" id="raksha-send" class="bg-primary hover:bg-primary-dark text-white p-3.5 rounded-2xl shadow-lg transition-all transform active:scale-90 disabled:opacity-30 disabled:scale-100">
              <i data-lucide="arrow-up" class="w-5 h-5"></i>
            </button>
          </form>
          <p class="text-[9px] text-gray-400 text-center mt-3 font-bold uppercase tracking-widest">Alexa for livestock farmers • Raksha AI Assistant</p>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    if (window.lucide) window.lucide.createIcons();

    this.els = {
      fab: document.getElementById('raksha-fab'),
      panel: document.getElementById('raksha-panel'),
      messagesBox: document.getElementById('raksha-messages'),
      form: document.getElementById('raksha-form'),
      input: document.getElementById('raksha-input'),
      sendBtn: document.getElementById('raksha-send'),
      micBtn: document.getElementById('raksha-mic'),
      micRing: document.getElementById('raksha-mic-ring'),
      voiceToggle: document.getElementById('raksha-voice-toggle'),
      langToggle: document.getElementById('raksha-lang-toggle'),
      closeBtn: document.getElementById('raksha-close'),
      shortcuts: document.querySelectorAll('.raksha-shortcut'),
      speakingWave: document.getElementById('raksha-speaking-wave'),
      speakingIcon: document.getElementById('raksha-speaking-icon'),
      inputWave: document.getElementById('raksha-voice-wave')
    };

    this.setupListeners();
    this.renderMessages();
  }

  setupListeners() {
    this.els.fab.addEventListener('click', () => this.togglePanel());
    this.els.closeBtn.addEventListener('click', () => this.togglePanel(false));
    this.els.langToggle.addEventListener('click', () => this.toggleLang());
    this.els.voiceToggle.addEventListener('click', () => this.toggleVoice());
    
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

    this.els.shortcuts.forEach(btn => {
      btn.addEventListener('click', () => {
        this.els.input.value = btn.textContent;
        this.handleUserSubmit();
      });
    });

    // 1. Voice Recognition (Input)
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = this.currentLang === 'en' ? 'en-IN' : 'hi-IN';

      this.els.micBtn.addEventListener('click', () => {
        if (this.isSpeaking) window.speechSynthesis.cancel();
        if (this.isListening) {
          recognition.stop();
        } else {
          recognition.start();
        }
      });

      recognition.onstart = () => {
        this.isListening = true;
        this.els.micBtn.classList.add('text-red-500');
        this.els.micRing.classList.remove('opacity-0');
        this.els.inputWave.classList.remove('hidden');
        this.els.input.placeholder = "Listening...";
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        this.els.input.value = transcript;
      };

      recognition.onend = () => {
        this.isListening = false;
        this.els.micBtn.classList.remove('text-red-500');
        this.els.micRing.classList.add('opacity-0');
        this.els.inputWave.classList.add('hidden');
        this.els.input.placeholder = "Type or ask by voice...";
        if (this.els.input.value.trim().length > 3) {
          this.handleUserSubmit();
        }
      };

      recognition.onerror = () => {
        this.isListening = false;
        this.els.micBtn.classList.remove('text-red-500');
        this.els.micRing.classList.add('opacity-0');
        this.els.inputWave.classList.add('hidden');
      };
    }

    // 2. Speech Synthesis Setup (Output)
    window.speechSynthesis.onvoiceschanged = () => {
      this.voices = window.speechSynthesis.getVoices();
    };
  }

  togglePanel(force) {
    this.isOpen = force !== undefined ? force : !this.isOpen;
    if (this.isOpen) {
      this.els.panel.classList.remove('scale-0', 'opacity-0', 'pointer-events-none', 'translate-y-10');
      this.els.panel.classList.add('scale-100', 'opacity-100', 'pointer-events-auto', 'translate-y-0');
      this.scrollToBottom();
    } else {
      this.els.panel.classList.add('scale-0', 'opacity-0', 'pointer-events-none', 'translate-y-10');
      this.els.panel.classList.remove('scale-100', 'opacity-100', 'pointer-events-auto', 'translate-y-0');
      window.speechSynthesis.cancel();
    }
  }

  toggleVoice() {
    this.isVoiceEnabled = !this.isVoiceEnabled;
    localStorage.setItem('raksha_voice_enabled', this.isVoiceEnabled);
    this.els.voiceToggle.classList.toggle('text-white', this.isVoiceEnabled);
    this.els.voiceToggle.classList.toggle('text-white/40', !this.isVoiceEnabled);
    this.els.voiceToggle.innerHTML = `<i data-lucide="${this.isVoiceEnabled ? 'volume-2' : 'volume-x'}" class="w-4 h-4"></i>`;
    if(window.lucide) window.lucide.createIcons();
    if (!this.isVoiceEnabled) window.speechSynthesis.cancel();
    window.showToast(`Voice Reading ${this.isVoiceEnabled ? 'Enabled' : 'Disabled'}`, 'info');
  }

  toggleLang() {
    this.currentLang = this.currentLang === 'en' ? 'hi' : 'en';
    localStorage.setItem('raksha_lang', this.currentLang);
    this.els.langToggle.textContent = this.currentLang === 'en' ? 'हिन्दी' : 'EN';
    window.showToast(`Assistant Mode: ${this.currentLang === 'en' ? 'English' : 'Hindi'}`, 'info');
    // Recognition object needs to be updated or recreated if we want real-time language switch
    location.reload(); // Simplest way to re-bind recognition lang
  }

  speakResponse(text) {
    if (!this.isVoiceEnabled || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Detect language and pick voice
    const isHindi = /[\u0900-\u097F]/.test(text);
    utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
    
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.els.speakingWave.classList.remove('hidden');
      this.els.speakingIcon.classList.add('animate-pulse', 'scale-110');
    };
    
    utterance.onend = () => {
      this.isSpeaking = false;
      this.els.speakingWave.classList.add('hidden');
      this.els.speakingIcon.classList.remove('animate-pulse', 'scale-110');
    };
    
    window.speechSynthesis.speak(utterance);
  }

  formatTime(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  renderMessages() {
    this.els.messagesBox.innerHTML = '';
    this.appendMessage({
      role: 'assistant',
      content: this.currentLang === 'en' ? 'Namaste! I am Raksha Voice AI. Speak or type to manage your livestock.' : 'नमस्ते! मैं रक्षा वॉइस एआई हूँ। अपने पशुओं के प्रबंधन के लिए बोलें या टाइप करें।',
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
    
    div.innerHTML = `
      <div class="flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] group">
        <div class="px-5 py-4 rounded-[24px] ${isUser ? 'bg-primary text-white rounded-tr-[4px] shadow-lg' : 'bg-gray-100 text-gray-800 rounded-tl-[4px] border border-gray-100'} text-[14.5px] leading-[1.6] relative">
          ${msg.content}
          ${!isUser ? `<button class="raksha-read-msg absolute -right-8 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="volume-2" class="w-3.5 h-3.5"></i></button>` : ''}
        </div>
        <span class="text-[9px] text-gray-400 mt-2 font-bold uppercase tracking-widest px-1">
          ${isUser ? 'You' : 'Assistant'} • ${this.formatTime(msg.timestamp)}
        </span>
      </div>
    `;

    this.els.messagesBox.appendChild(div);
    if(window.lucide) window.lucide.createIcons();

    const readBtn = div.querySelector('.raksha-read-msg');
    if(readBtn) readBtn.addEventListener('click', () => this.speakResponse(msg.content));
    
    this.scrollToBottom();
  }

  showTypingIndicator() {
    this.isTyping = true;
    const div = document.createElement('div');
    div.id = 'raksha-typing';
    div.className = 'flex justify-start animate-fade-in mb-6';
    div.innerHTML = `
      <div class="bg-gray-50 border border-gray-100 px-6 py-4 rounded-[24px] rounded-tl-[4px] flex items-center space-x-2">
        <div class="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
        <div class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
        <div class="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
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

  async handleUserSubmit() {
    const text = this.els.input.value.trim();
    if (!text || this.isTyping) return;

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
      
      // Voice output
      this.speakResponse(responseContent);

    } catch (error) {
      this.hideTypingIndicator();
      window.showToast('AI Connection Issue', 'error');
    } finally {
      this.els.sendBtn.disabled = false;
      this.isTyping = false;
      this.scrollToBottom();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.rakshaAI = new RakshaAIComponent();
});
