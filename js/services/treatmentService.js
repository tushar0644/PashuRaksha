class TreatmentService {
  constructor() {
    this.supabase = window.supabaseClient;
    this.table = 'treatments';
  }

  async getTreatments() {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select(`
          *,
          animals ( animal_tag ),
          medicines ( name, withdrawal_milk, withdrawal_meat, residue_limit )
        `)
        .order('treatment_date', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching treatments:', error);
      if(window.mockData) return window.mockData.treatments;
      return [];
    }
  }

  async addTreatment(treatmentData) {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .insert([treatmentData])
        .select();

      if (error) throw error;
      window.showToast('Treatment logged successfully!', 'success');
      return data[0];
    } catch (error) {
      window.showToast('Failed to log treatment: ' + error.message, 'error');
      return null;
    }
  }
}

window.treatmentService = new TreatmentService();
