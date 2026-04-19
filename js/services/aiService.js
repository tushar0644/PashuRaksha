class AIService {
  constructor() {
    // Configured via config.js
    this.apiKey = window.OPENAI_API_KEY || '';
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
  }

  async generateFarmContext() {
    let context = 'Live Supabase Farm Context:\n\n';
    this.supabase = window.supabaseClient;
    
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) return "User is not logged in.";
      const userId = session.user.id;

      // 1. Users & Farms
      const userMeta = session.user.user_metadata || {};
      const { data: farmData } = await this.supabase.from('farms').select('*').eq('owner_id', userId).single();
      
      context += `[USER PROFILE]\nName: ${userMeta.full_name || 'Unknown'}\nRole: ${userMeta.role || 'Farmer'}\nFarm: ${farmData?.farm_name || 'Unknown'}\n\n`;

      // 2. Animals
      const { data: animals } = await this.supabase.from('animals').select('*');
      if (animals) {
        const healthy = animals.filter(a => (a.health_status || '').toLowerCase() === 'healthy').length;
        const underTreatment = animals.filter(a => (a.health_status || '').toLowerCase() === 'under_treatment').length;
        const observation = animals.filter(a => (a.health_status || '').toLowerCase() === 'observation').length;
        
        context += `[HERD SUMMARY]\nTotal Animals: ${animals.length}\nHealthy: ${healthy} | Under Treatment: ${underTreatment} | Observation: ${observation}\n\n`;
        
        context += `[ANIMAL REGISTRY]\n`;
        animals.forEach(a => {
           context += `- Tag: ${a.animal_tag}, Breed: ${a.breed}, Age: ${a.age}, Weight: ${a.weight}, Status: ${a.health_status || 'healthy'}\n`;
        });
        context += '\n';
      }

      // 3. Treatments
      const { data: treatments } = await this.supabase.from('treatments').select('*, animals(animal_tag), medicines(name)');
      if (treatments && treatments.length > 0) {
        context += `[ACTIVE TREATMENTS & WITHDRAWALS]\n`;
        treatments.forEach(t => {
          const tag = t.animals ? t.animals.animal_tag : t.animalId;
          const med = t.medicines ? t.medicines.name : t.medicine;
          context += `- Animal ${tag} | Medicine: ${med} | Dosage: ${t.dosage} | Route: ${t.route} | Ends: ${t.end_date} | Withdrawal Ends: ${t.withdrawal_end_date}\n`;
        });
        context += '\n';
      }

      // 4. Vaccinations
      const { data: vaccines, error: vacError } = await this.supabase.from('vaccinations').select('*').limit(10);
      if (vaccines && !vacError && vaccines.length > 0) {
         context += `[VACCINATIONS]\n`;
         vaccines.forEach(v => context += `- ${JSON.stringify(v)}\n`);
         context += '\n';
      }

      // 5. Alerts
      const { data: alerts, error: alertError } = await this.supabase.from('alerts').select('*').limit(10);
      if (alerts && !alertError && alerts.length > 0) {
         context += `[SYSTEM ALERTS]\n`;
         alerts.forEach(a => context += `- ${JSON.stringify(a)}\n`);
         context += '\n';
      }

    } catch (e) {
      console.warn("Raksha AI Context Error:", e);
      context += "Some database tables could not be read. Provide guidance based on general livestock knowledge.";
    }
    return context;
  }

  getSystemPrompt(farmContext) {
    return `You are Raksha AI, a smart, polite, and expert livestock assistant for the "PashuRaksha" farm management app. 
Tagline: Helping Farmers Make Better Decisions.

Your capabilities:
1. Provide insights on the user's farm based on the provided context.
2. Provide first-level guidance on animal health symptoms (fever, limping, milk drop, etc.).
3. Assist with MRL (Maximum Residue Limit) and withdrawal period questions.

Safety Rules:
- If a user reports severe medical symptoms, ALWAYS advise them to consult a licensed veterinarian.
- Add a short disclaimer if giving medical advice: "(Note: AI guidance is informational. Please consult a vet for severe cases.)"
- Support English and Hindi seamlessly.

Here is the current live data for the user's farm:
${farmContext}

Keep your responses concise, modern, and easily readable. Use bullet points where appropriate.`;
  }

  async sendMessage(messages) {
    if (!this.apiKey || this.apiKey === 'YOUR_OPENAI_API_KEY') {
      // Fallback Demo Mode if no API key is provided
      await new Promise(r => setTimeout(r, 1500)); // Simulate delay
      const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
      
      let reply = "Namaste! I am Raksha AI. Please add your OpenAI API Key in `js/config.js` to enable my full intelligence.";
      
      if (lastUserMessage.includes('treatment') || lastUserMessage.includes('under treatment')) {
        const farmContext = await this.generateFarmContext();
        reply = "Here is what I found:\n" + farmContext;
      } else if (lastUserMessage.includes('milk') || lastUserMessage.includes('withdrawal')) {
        reply = "I see you're asking about milk withdrawal. Please check the treatment logs. Animals under active withdrawal periods should NOT have their milk sold for human consumption. (Note: AI guidance is informational.)";
      } else if (lastUserMessage.includes('fever') || lastUserMessage.includes('sick')) {
        reply = "Fever can indicate an infection. Please isolate the animal and monitor its temperature. (Note: AI guidance is informational. Please consult a vet for severe cases.)";
      }

      return reply;
    }

    const farmContext = await this.generateFarmContext();
    const systemPrompt = this.getSystemPrompt(farmContext);

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: apiMessages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'API Error');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }
}

window.aiService = new AIService();
