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
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching treatments:', error);
      if (window.mockData) return window.mockData.treatments;
      return [];
    }
  }

  async addTreatment(treatmentData) {
    const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out (10s)')), ms));

    try {
      // 1. Verify session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      if (sessionError || !session) throw new Error("Authentication failed: No active session.");

      // 2. Fetch farm_id
      const { data: farmData, error: farmError } = await this.supabase
        .from('farms')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();

      if (farmError || !farmData) throw new Error("Farm profile not found. Please complete your profile first.");

      // 3. Construct Forensic Payload (Mapping to user's expected schema)
      const payload = {
        farm_id: farmData.id,
        animal_id: treatmentData.animal_id,
        medicine_id: treatmentData.medicine_id,
        medicine_name: treatmentData.medicine_name || treatmentData.medicine, // Standardizing
        diagnosis: treatmentData.diagnosis || treatmentData.disease || 'General Treatment',
        dosage: treatmentData.dosage,
        route: treatmentData.route,
        start_date: treatmentData.start_date,
        end_date: treatmentData.end_date,
        withdrawal_end_date: treatmentData.withdrawal_end_date,
        prescribed_by: treatmentData.prescribed_by || treatmentData.vet || 'Unknown Vet',
        notes: treatmentData.notes || ''
      };

      console.group('🔍 Forensic Debug: Log Treatment');
      console.log('Table: treatments');
      console.log('User ID:', session.user.id);
      console.log('Payload:', payload);
      console.groupEnd();

      // 4. Execute Insert
      const { data, error, status } = await Promise.race([
        this.supabase.from(this.table).insert([payload]).select(),
        timeout(10000)
      ]);

      console.group('💾 Supabase Response');
      console.log('Status:', status);
      console.log('Data:', data);
      console.log('Error:', error);
      console.groupEnd();

      if (error) {
        throw new Error(`${error.message} (Code: ${error.code})`);
      }

      if (!data || data.length === 0) {
        throw new Error("Insert succeeded but no data was returned. Check RLS policies.");
      }

      window.showToast('Treatment logged successfully!', 'success');
      return data[0];
    } catch (error) {
      console.error('❌ Forensic Debug Failure:', error);
      window.showToast(`Log Failed: ${error.message}`, 'error');
      return null;
    }
  }
}

window.treatmentService = new TreatmentService();
