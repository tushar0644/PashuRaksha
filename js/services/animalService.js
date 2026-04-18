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
    try {
      // Assuming RLS automatically attaches user_id/farm_id if configured, 
      // or we must provide it.
      const { data, error } = await this.supabase
        .from(this.table)
        .insert([animalData])
        .select();

      if (error) throw error;
      window.showToast('Animal registered successfully!', 'success');
      return data[0];
    } catch (error) {
      window.showToast('Failed to add animal: ' + error.message, 'error');
      return null;
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
