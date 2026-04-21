class DashboardService {
  constructor() {
    this.supabase = window.supabaseClient;
  }

  async getDashboardSummary() {
    try {
      const { data, error } = await this.supabase
        .from('dashboard_summary')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return {
        total_live_animals: 0,
        critical_animals: 0,
        active_mrl_alerts: 0,
        total_antibiotic_doses: 0
      };
    }
  }

  async getLiveHealthLogs() {
    try {
      const { data, error } = await this.supabase
        .from('live_health_sensor')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching live health logs:', error);
      return [];
    }
  }

  async getMRLAlerts() {
    try {
      const { data, error } = await this.supabase
        .from('mrl_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching MRL alerts:', error);
      return [];
    }
  }

  async getAMUTrends(monthsLimit = 6) {
    try {
      const { data, error } = await this.supabase
        .from('amu_trends')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(monthsLimit);

      if (error) throw error;

      if (!data || data.length === 0) return { labels: [], antibiotics: [], totalAntibiotics: 0 };

      const labels = data.map(d => d.month_name);
      const antibiotics = data.map(d => d.antibiotic_doses);
      const treatmentCounts = data.map(d => d.treatment_count);
      const totalAntibiotics = antibiotics.reduce((a, b) => a + b, 0);

      // Simple calculation for change vs last month
      let antiChange = 0;
      if (data.length >= 2) {
        const last = data[data.length - 1].antibiotic_doses;
        const prev = data[data.length - 2].antibiotic_doses;
        antiChange = prev === 0 ? (last > 0 ? 100 : 0) : Math.round(((last - prev) / prev) * 100);
      }

      return {
        labels,
        antibiotics,
        treatmentCounts,
        totalAntibiotics,
        antiChange
      };
    } catch (error) {
      console.error('Error fetching AMU trends:', error);
      return { labels: [], antibiotics: [], totalAntibiotics: 0 };
    }
  }
}

window.dashboardService = new DashboardService();
