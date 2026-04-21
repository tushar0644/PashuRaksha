window.healthService = {
  async getLatestHealthLogs() {
    try {
      const { data, error } = await window.supabaseClient
        .from('animal_health_logs')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching health logs:', error);
      return [];
    }
  }
};
