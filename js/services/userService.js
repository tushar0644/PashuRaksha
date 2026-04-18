class UserService {
  constructor() {
    this.supabase = window.supabaseClient;
    this.table = 'farms';
  }

  async getProfile() {
    let profileData = {
      full_name: 'Tushar K.',
      email: 'tusharbhati0644@gmail.com',
      phone: '+91 9876543210',
      role: 'Farmer',
      farm_name: 'Green Valley Farm',
      village: 'Karnal',
      district: 'Karnal',
      state: 'Haryana',
      plan: 'Pro'
    };

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (user) {
        profileData.email = user.email;
        if(user.user_metadata) {
            profileData.full_name = user.user_metadata.full_name || profileData.full_name;
            profileData.phone = user.user_metadata.phone || profileData.phone;
            profileData.role = user.user_metadata.role || profileData.role;
        }

        // Fetch farm data
        const { data: farmData, error } = await this.supabase
          .from(this.table)
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (farmData && !error) {
          profileData.farm_name = farmData.farm_name || profileData.farm_name;
          profileData.village = farmData.village || profileData.village;
          profileData.district = farmData.district || profileData.district;
          profileData.state = farmData.state || profileData.state;
          profileData.plan = farmData.plan || profileData.plan;
        }
      }
    } catch (e) {
      console.warn("Could not fetch user profile from Supabase, using mock data", e);
    }
    return profileData;
  }

  async updateProfile(updates) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Update auth metadata
      const { error: authError } = await this.supabase.auth.updateUser({
        data: { 
          full_name: updates.full_name,
          phone: updates.phone
        }
      });
      if (authError) throw authError;

      // Upsert farm data
      const { error: farmError } = await this.supabase
        .from(this.table)
        .upsert({
          user_id: user.id,
          farm_name: updates.farm_name,
          village: updates.village,
          district: updates.district,
          state: updates.state
        });
        
      if (farmError && farmError.code !== '42P01') { // Ignore if table doesn't exist for MVP
        throw farmError;
      }

      window.showToast('Profile updated successfully!', 'success');
      return true;
    } catch (e) {
      console.error(e);
      window.showToast('Could not update profile: ' + e.message, 'error');
      return false;
    }
  }
}

window.userService = new UserService();
