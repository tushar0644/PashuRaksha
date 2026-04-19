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
    const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out (10s)')), ms));

    try {
      // 1. Verify session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      if (sessionError || !session) throw new Error("You must be logged in to log a treatment.");

      // 2. Fetch farm_id
      const { data: farmData, error: farmError } = await this.supabase
        .from('farms')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();
        
      if (farmError || !farmData) {
        throw new Error("Could not find your farm profile.");
      }

      // 3. Map to snake_case schema
      const payload = {
        farm_id: farmData.id,
        animal_id: treatmentData.animal_id || treatmentData.animalId, // Support both
        medicine_id: treatmentData.medicine_id,
        disease_id: treatmentData.disease_id,
        dosage: treatmentData.dosage || treatmentData.dose,
        route: treatmentData.route,
        treatment_date: treatmentData.treatment_date || treatmentData.start_date,
        start_date: treatmentData.start_date,
        end_date: treatmentData.end_date,
        withdrawal_end_date: treatmentData.withdrawal_end_date,
        vet_id: treatmentData.vet_id || treatmentData.vet || null,
        notes: treatmentData.notes || null
      };

      console.log('Sending treatment insert:', payload);

      const insertPromise = this.supabase
        .from(this.table)
        .insert([payload])
        .select();

      const { data, error } = await Promise.race([
        insertPromise,
        timeout(10000)
      ]);

      if (error) throw error;
      
      window.showToast('Treatment logged successfully!', 'success');
      return data[0];
    } catch (error) {
      console.error('Treatment Insert Error:', error);
      window.showToast('Failed to log treatment: ' + error.message, 'error');
      return null;
    }
  }
}

window.treatmentService = new TreatmentService();
