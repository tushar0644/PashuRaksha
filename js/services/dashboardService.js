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
        .limit(6);
      
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

      let finalData = data;

      // Demo Data Fallback if table is empty
      if (!finalData || finalData.length === 0) {
        console.log('AMU Trends empty, using demo fallback data');
        finalData = [
          { month_name: 'Nov', antibiotic_doses: 12, treatment_count: 5 },
          { month_name: 'Dec', antibiotic_doses: 18, treatment_count: 8 },
          { month_name: 'Jan', antibiotic_doses: 15, treatment_count: 6 },
          { month_name: 'Feb', antibiotic_doses: 22, treatment_count: 10 },
          { month_name: 'Mar', antibiotic_doses: 10, treatment_count: 4 },
          { month_name: 'Apr', antibiotic_doses: 14, treatment_count: 7 }
        ];
      }

      const labels = finalData.map(d => d.month_name);
      const antibiotics = finalData.map(d => d.antibiotic_doses);
      const treatmentCounts = finalData.map(d => d.treatment_count);
      const totalAntibiotics = antibiotics.reduce((a, b) => a + b, 0);

      // Simple calculation for change vs last month
      let antiChange = 0;
      if (finalData.length >= 2) {
        const last = finalData[finalData.length - 1].antibiotic_doses;
        const prev = finalData[finalData.length - 2].antibiotic_doses;
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
      return { 
        labels: ['Jan', 'Feb', 'Mar'], 
        antibiotics: [0, 0, 0], 
        treatmentCounts: [0, 0, 0],
        totalAntibiotics: 0 
      };
    }
  }
}

window.dashboardService = new DashboardService();
