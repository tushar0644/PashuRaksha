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
          animals ( animal_code, animal_name, species ),
          diseases ( disease_name ),
          medicines ( medicine_name, category ),
          doctors ( doctor_name )
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching treatments:', error);
      return [];
    }
  }

  async getFormData() {
    try {
      const [animalsRes, diseasesRes, medicinesRes, doctorsRes] = await Promise.all([
        this.supabase.from('animals').select('id, animal_code, animal_name, species, breed'),
        this.supabase.from('diseases').select('id, disease_name'),
        this.supabase.from('medicines').select('id, medicine_name, category, withdrawal_days'),
        this.supabase.from('doctors').select('id, doctor_name')
      ]);

      // Seed if empty (Demo Mode)
      if ((!animalsRes.data || animalsRes.data.length === 0) && 
          (!medicinesRes.data || medicinesRes.data.length === 0)) {
        await this.seedDemoData();
        return this.getFormData(); // Recurse once seeded
      }

      return {
        animals: animalsRes.data || [],
        diseases: diseasesRes.data || [],
        medicines: medicinesRes.data || [],
        doctors: doctorsRes.data || []
      };
    } catch (error) {
      console.error('Error fetching form data:', error);
      return { animals: [], diseases: [], medicines: [], doctors: [] };
    }
  }

  async seedDemoData() {
    console.log('Seeding Demo Data...');
    try {
      const animals = [
        { animal_code: 'COW-001', animal_name: 'Gauri', species: 'Cow', breed: 'Gir', age_months: 36, status: 'Healthy' },
        { animal_code: 'COW-002', animal_name: 'Laxmi', species: 'Cow', breed: 'Holstein', age_months: 48, status: 'Healthy' },
        { animal_code: 'BUF-001', animal_name: 'Kali', species: 'Buffalo', breed: 'Murrah', age_months: 60, status: 'Healthy' }
      ];
      const medicines = [
        { medicine_name: 'Oxytetracycline', category: 'Antibiotic', withdrawal_days: 7 },
        { medicine_name: 'Amoxicillin', category: 'Antibiotic', withdrawal_days: 4 },
        { medicine_name: 'Meloxicam', category: 'Pain Relief', withdrawal_days: 5 }
      ];
      const diseases = [
        { disease_name: 'Mastitis', symptoms: 'Swollen udder, fever' },
        { disease_name: 'FMD', symptoms: 'Blisters, drooling' }
      ];
      const doctors = [
        { doctor_name: 'Dr. Sharma', specialization: 'Veterinary Surgeon' },
        { doctor_name: 'Dr. Verma', specialization: 'Livestock Specialist' }
      ];

      await Promise.all([
        this.supabase.from('animals').insert(animals),
        this.supabase.from('medicines').insert(medicines),
        this.supabase.from('diseases').insert(diseases),
        this.supabase.from('doctors').insert(doctors)
      ]);
      console.log('Demo Data Seeded Successfully');
    } catch (err) {
      console.error('Seeding failed:', err);
    }
  }

  async addTreatment(treatmentData) {
    try {
      // 1. Calculate fields
      const medId = treatmentData.medicine_id;
      const { data: med } = await this.supabase.from('medicines').select('withdrawal_days').eq('id', medId).single();
      
      const withdrawalDays = med ? (med.withdrawal_days || 0) : 0;
      const milkStatus = withdrawalDays > 0 ? 'Blocked' : 'Safe';
      
      const safeReleaseDate = new Date(treatmentData.start_date);
      safeReleaseDate.setDate(safeReleaseDate.getDate() + withdrawalDays);
      const safeReleaseStr = safeReleaseDate.toISOString().split('T')[0];

      // 2. Insert
      const payload = {
        animal_id: treatmentData.animal_id,
        disease_id: treatmentData.disease_id,
        medicine_id: treatmentData.medicine_id,
        doctor_id: treatmentData.doctor_id,
        dosage: treatmentData.dosage,
        route: treatmentData.route,
        start_date: treatmentData.start_date,
        end_date: treatmentData.end_date,
        notes: treatmentData.notes || '',
        milk_status: milkStatus,
        safe_release_date: safeReleaseStr,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase.from(this.table).insert([payload]).select();

      if (error) throw error;
      
      window.showToast('Treatment logged successfully', 'success');
      return data[0];
    } catch (error) {
      console.error('Save failed:', error);
      window.showToast('Error: ' + error.message, 'error');
      return null;
    }
  }
}

window.treatmentService = new TreatmentService();
