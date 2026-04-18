class AnimalService {
  constructor() {
    this.supabase = window.supabaseClient;
    this.table = 'animals';
  }

  async getAnimals() {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching animals:', error);
      // Fallback to mock data for demo purposes if Supabase is not configured
      if(window.mockData) {
          console.log('Falling back to mock data');
          return window.mockData.animals;
      }
      return [];
    }
  }

  async addAnimal(animalData) {
    // 10-second timeout utility
    const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out (10s)')), ms));

    try {
      // Verify session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      if (sessionError || !session) throw new Error("You must be logged in to add an animal.");

      // Fetch logged-in user's farm_id
      const { data: farmData, error: farmError } = await this.supabase
        .from('farms')
        .select('id')
        .eq('owner_id', session.user.id)
        .single();
        
      if (farmError || !farmData) {
        throw new Error("Could not find your farm profile. Please set it up in your Profile first.");
      }

      // Exact fields only
      const payload = {
        farm_id: farmData.id,
        animal_tag: animalData.animal_tag,
        breed: animalData.breed || null,
        age: animalData.age || null,
        weight: animalData.weight || null,
        health_status: animalData.health_status || animalData.status || 'Healthy'
      };

      console.log('Sending insert to Supabase:', payload);

      const insertPromise = this.supabase
        .from(this.table)
        .insert([payload])
        .select();

      const { data, error } = await Promise.race([
        insertPromise,
        timeout(10000)
      ]);

      if (error) throw error;
      
      console.log('Supabase Insert Successful:', data);
      return data[0];
    } catch (error) {
      console.error('Supabase Error:', error);
      throw error; // Throw so app.js can catch and display toast
    }
  }

  async updateAnimal(id, updates) {
    try {
      const { data, error } = await this.supabase
        .from(this.table)
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      window.showToast('Animal updated', 'success');
      return data[0];
    } catch (error) {
      window.showToast('Failed to update animal: ' + error.message, 'error');
      return null;
    }
  }

  async deleteAnimal(id) {
    try {
      const { error } = await this.supabase
        .from(this.table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      window.showToast('Animal removed', 'success');
      return true;
    } catch (error) {
      window.showToast('Failed to delete animal: ' + error.message, 'error');
      return false;
    }
  }
}

window.animalService = new AnimalService();
