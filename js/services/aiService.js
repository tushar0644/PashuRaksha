class AIService {
  constructor() {
    this.endpoint = 'https://wgfbmdhhjaybgrpqojef.supabase.co/functions/v1/raksha-ai';
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
        const healthy = animals.filter(a => (a.status || '').toLowerCase() === 'healthy').length;
        const underTreatment = animals.filter(a => (a.status || '').toLowerCase() === 'under_treatment').length;
        const observation = animals.filter(a => (a.status || '').toLowerCase() === 'observation').length;
        
        context += `[HERD SUMMARY]\nTotal Animals: ${animals.length}\nHealthy: ${healthy} | Under Treatment: ${underTreatment} | Observation: ${observation}\n\n`;
        
        context += `[ANIMAL REGISTRY]\n`;
        animals.forEach(a => {
           context += `- Tag: ${a.animal_code}, Breed: ${a.breed}, Age: ${a.age_months}m, Status: ${a.status || 'healthy'}\n`;
        });
        context += '\n';
      }

      // 3. Treatments
      const { data: treatments } = await this.supabase.from('treatments').select('*, animals(animal_code), medicines(medicine_name)');
      if (treatments && treatments.length > 0) {
        context += `[ACTIVE TREATMENTS & WITHDRAWALS]\n`;
        treatments.forEach(t => {
          const tag = t.animals ? t.animals.animal_code : t.animal_id;
          const med = t.medicines ? t.medicines.medicine_name : 'Unknown';
          context += `- Animal ${tag} | Medicine: ${med} | Dosage: ${t.dosage} | Route: ${t.route} | Ends: ${t.end_date} | Milk Status: ${t.milk_status} | Safe Release: ${t.safe_release_date}\n`;
        });
        context += '\n';
      }

    } catch (e) {
      console.warn("Raksha AI Context Error:", e);
      context += "Some database tables could not be read. Provide guidance based on general livestock knowledge.";
    }
    return context;
  }

  async sendMessage(userInput) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.ENV?.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          message: userInput
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          const err = new Error('Rate limit exceeded');
          err.status = 429;
          throw err;
        }
        throw new Error(`AI Service Error (${response.status})`);
      }

      const data = await response.json();
      return data.reply || "I'm sorry, I couldn't process that request.";

    } catch (error) {
      clearTimeout(timeoutId);
      console.error('AI Service Error:', error);
      if (error.name === 'AbortError') {
        throw new Error("Request timed out. Please try again.");
      }
      throw error;
    }
  }
}

window.aiService = new AIService();
