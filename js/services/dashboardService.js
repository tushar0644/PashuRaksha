class DashboardService {
  constructor() {
    this.supabase = window.supabaseClient;
  }

  async getDashboardStats() {
    try {
      // 1. Total Animals
      const { count: animalCount, error: animalError } = await this.supabase
        .from('animals')
        .select('*', { count: 'exact', head: true });
        
      // 2. Active Treatments (Simplified query)
      const { count: treatmentCount, error: treatmentError } = await this.supabase
        .from('treatments')
        .select('*', { count: 'exact', head: true });
        
      if (animalError || treatmentError) throw new Error('Failed to fetch stats');

      return {
        totalAnimals: animalCount || 0,
        activeTreatments: treatmentCount || 0,
        restrictedCount: 0 // In real app, calculate this via edge function or DB view
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { totalAnimals: 0, activeTreatments: 0, restrictedCount: 0 };
    }
  }

  async getAMUTrends(monthsLimit = 6) {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - monthsLimit);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Fetch treatments with medicine details
      const { data: treatments, error } = await this.supabase
        .from('treatments')
        .select(`
          treatment_date,
          medicines ( category )
        `)
        .gte('treatment_date', startDateStr);

      if (error) throw error;

      // Group by month
      const months = [];
      for (let i = monthsLimit - 1; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(d.toLocaleString('default', { month: 'short' }));
      }

      const antibioticCounts = new Array(monthsLimit).fill(0);
      const vaccineCounts = new Array(monthsLimit).fill(0);

      const monthNames = months;
      
      treatments.forEach(t => {
        const tDate = new Date(t.treatment_date);
        const monthName = tDate.toLocaleString('default', { month: 'short' });
        const monthIndex = monthNames.indexOf(monthName);
        
        if (monthIndex !== -1) {
          const category = t.medicines?.category;
          if (category === 'Antibiotic') {
            antibioticCounts[monthIndex]++;
          } else if (category === 'Vaccine') {
            vaccineCounts[monthIndex]++;
          }
        }
      });

      // Calculate percentage changes vs previous month (last index vs second to last)
      const lastIdx = monthsLimit - 1;
      const prevIdx = monthsLimit - 2;
      
      const calcChange = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const antiChange = calcChange(antibioticCounts[lastIdx], antibioticCounts[prevIdx]);
      const vacChange = calcChange(vaccineCounts[lastIdx], vaccineCounts[prevIdx]);

      return {
        labels: monthNames,
        antibiotics: antibioticCounts,
        vaccines: vaccineCounts,
        totalAntibiotics: antibioticCounts.reduce((a, b) => a + b, 0),
        totalVaccines: vaccineCounts.reduce((a, b) => a + b, 0),
        antiChange,
        vacChange
      };
    } catch (error) {
      console.error('Error fetching AMU trends:', error);
      return { labels: [], antibiotics: [], vaccines: [], totalAntibiotics: 0, totalVaccines: 0 };
    }
  }
}

window.dashboardService = new DashboardService();
