class NotificationService {
  constructor() {
    this.supabase = window.supabaseClient;
    this.notifications = [];
    this.unreadCount = 0;
    this.listeners = [];
  }

  async fetchNotifications() {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      this.notifications = data || [];
      this.unreadCount = this.notifications.filter(n => !n.is_read).length;
      this.notifyListeners();
      return this.notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback: Generate dynamic alerts from other data if table missing
      return await this.generateLocalAlerts();
    }
  }

  async generateLocalAlerts() {
    // Generate alerts based on treatments/MRL
    const treatments = await window.treatmentService.getTreatments();
    const localAlerts = [];
    
    treatments.forEach(t => {
      const medName = t.medicines ? t.medicines.name : t.medicine;
      const med = mockData.medicines.find(m => m.name === medName);
      if(med) {
        const status = getMRLStatus(t.treatment_date || t.date, med.withdrawalMilk);
        if(status.status === 'Restricted') {
          localAlerts.push({
            id: `mrl-${t.id}`,
            type: 'mrl',
            title: 'MRL Restriction Active',
            message: `Animal ${t.animals?.animal_tag || t.animal_id} is still under withdrawal period for ${medName}.`,
            created_at: t.treatment_date || t.created_at,
            is_read: false
          });
        }
      }
    });

    this.notifications = localAlerts;
    this.unreadCount = this.notifications.length;
    this.notifyListeners();
    return this.notifications;
  }

  async markAsRead(id) {
    try {
      if (id === 'all') {
        const { error } = await this.supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('is_read', false);
        if (error) throw error;
        this.notifications.forEach(n => n.is_read = true);
      } else {
        const { error } = await this.supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
        if (error) throw error;
        const n = this.notifications.find(notif => notif.id === id);
        if (n) n.is_read = true;
      }
      
      this.unreadCount = this.notifications.filter(n => !n.is_read).length;
      this.notifyListeners();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    // Initial call
    callback({ notifications: this.notifications, unreadCount: this.unreadCount });
    
    // Supabase Realtime
    this.supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        this.notifications.unshift(payload.new);
        this.unreadCount++;
        this.notifyListeners();
        window.showToast('New Alert Received!', 'info');
      })
      .subscribe();
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb({ 
        notifications: this.notifications, 
        unreadCount: this.unreadCount 
    }));
  }
}

window.notificationService = new NotificationService();
