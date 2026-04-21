document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('aside');

  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
      sidebar.classList.toggle('absolute');
      sidebar.classList.toggle('bg-white');
      sidebar.classList.toggle('w-64');
      sidebar.classList.toggle('h-full');
      sidebar.classList.toggle('z-50');
      sidebar.classList.toggle('left-0');
      sidebar.classList.toggle('top-0');
    });
  }

  // Navigation Logic
  const navItems = document.querySelectorAll('.nav-item');
  const viewContainer = document.getElementById('view-container');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  function formatDateForDB(date) {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  }

  const views = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Overview of AMU and MRL Compliance.',
      render: renderDashboard
    },
    animals: {
      title: 'Animal Registry',
      subtitle: 'Manage and monitor your livestock herd.',
      render: renderAnimals
    },
    treatments: {
      title: 'Treatment Logs',
      subtitle: 'Track medical treatments and prescriptions.',
      render: renderTreatments
    },
    mrl: {
      title: 'MRL Tracker',
      subtitle: 'Monitor withdrawal periods for milk and meat.',
      render: renderMRL
    },
    reports: {
      title: 'Compliance Reports',
      subtitle: 'Generate MRL logs and certificates.',
      render: renderReports
    },
    profile: {
      title: 'User Dashboard',
      subtitle: 'Manage your farm profile and settings.',
      render: renderProfile
    }
  };

  window.switchView = async function(viewName) {
    // Update active nav
    navItems.forEach(item => {
      item.classList.remove('active', 'bg-emerald-50', 'text-primary-dark');
      if (item.dataset.view === viewName) {
        item.classList.add('active');
      }
    });

    // Update Headers
    const viewMeta = views[viewName];
    if (viewMeta) {
      pageTitle.setAttribute('data-i18n', `header.title.${viewName}`);
      pageTitle.textContent = window.i18n ? window.i18n.t(`header.title.${viewName}`) : viewMeta.title;

      pageSubtitle.setAttribute('data-i18n', `header.subtitle.${viewName}`);
      pageSubtitle.textContent = window.i18n ? window.i18n.t(`header.subtitle.${viewName}`) : viewMeta.subtitle;

      // Clear container with fade out
      viewContainer.innerHTML = '<div class="flex justify-center p-12"><i data-lucide="loader-2" class="w-8 h-8 animate-spin text-primary"></i></div>';
      if (window.lucide) window.lucide.createIcons();
      viewContainer.className = 'pb-20 fade-in'; // trigger animation

      // Render Content
      await viewMeta.render(viewContainer);

      if (window.i18n) window.i18n.updateDOM();

      // Re-initialize icons for newly added HTML
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }
  }

  // Event Listeners for Nav
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const viewName = e.currentTarget.dataset.view;
      switchView(viewName);

      // Close notification dropdown on click
      const dropdown = document.getElementById('notification-dropdown');
      if (dropdown) {
        dropdown.classList.add('hidden', 'opacity-0', 'scale-95');
      }

      // Close mobile sidebar on click
      if (window.innerWidth < 768 && sidebar) {
        sidebar.classList.add('hidden');
      }
    });
  });

  // Initialize Notifications
  initNotifications();

  // Load default view
  switchView('dashboard');
});

function initNotifications() {
  const bell = document.getElementById('notification-bell');
  const dropdown = document.getElementById('notification-dropdown');
  const badge = document.getElementById('notification-badge');
  const list = document.getElementById('notification-list');

  if (!bell || !dropdown) return;

  // Toggle Dropdown
  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = dropdown.classList.contains('hidden');
    if (isHidden) {
      dropdown.classList.remove('hidden');
      setTimeout(() => {
        dropdown.classList.remove('opacity-0', 'scale-95');
        dropdown.classList.add('opacity-100', 'scale-100');
      }, 10);
    } else {
      dropdown.classList.remove('opacity-100', 'scale-100');
      dropdown.classList.add('opacity-0', 'scale-95');
      setTimeout(() => dropdown.classList.add('hidden'), 200);
    }
  });

  // Close on outside click
  document.addEventListener('click', () => {
    dropdown.classList.remove('opacity-100', 'scale-100');
    dropdown.classList.add('opacity-0', 'scale-95');
    setTimeout(() => dropdown.classList.add('hidden'), 200);
  });

  dropdown.addEventListener('click', (e) => e.stopPropagation());

  // Subscribe to Service
  window.notificationService.subscribe(({ notifications, unreadCount }) => {
    // Update Badge
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }

    // Update List
    if (notifications.length === 0) {
      list.innerHTML = `
        <div class="p-8 text-center">
          <div class="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <i data-lucide="bell-off" class="w-6 h-6 text-gray-300"></i>
          </div>
          <p class="text-sm text-gray-500">No new alerts</p>
        </div>
      `;
    } else {
      list.innerHTML = notifications.map(n => `
        <div class="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-start space-x-3 ${!n.is_read ? 'bg-emerald-50/30' : ''}" onclick="window.notificationService.markAsRead('${n.id}')">
          <div class="p-2 rounded-lg ${n.type === 'mrl' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} mt-0.5">
            <i data-lucide="${n.type === 'mrl' ? 'alert-triangle' : 'info'}" class="w-4 h-4"></i>
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <h5 class="text-xs font-bold text-gray-800">${n.title}</h5>
              <span class="text-[10px] text-gray-400">${new Date(n.created_at).toLocaleDateString()}</span>
            </div>
            <p class="text-[11px] text-gray-500 mt-1 leading-relaxed">${n.message}</p>
          </div>
        </div>
      `).join('');
    }
    if (window.lucide) window.lucide.createIcons();
  });

  // Initial Fetch
  window.notificationService.fetchNotifications();
}

// --- View Renderers ---

async function renderDashboard(container) {
  // Initial fetch for stats
  const stats = await window.dashboardService.getDashboardStats();
  const treatments = await window.treatmentService.getTreatments();

  const activeTreatments = treatments.length || stats.activeTreatments;
  const totalAnimals = stats.totalAnimals;

  let restrictedCount = 0;
  // Calculate restricted count based on MRL status
  treatments.forEach(t => {
    const medName = t.medicines ? t.medicines.name : t.medicine;
    const med = mockData.medicines.find(m => m.name === medName);
    if (med) {
      const status = getMRLStatus(t.start_date || t.date, med.withdrawalMilk);
      if (status.status === 'Restricted') restrictedCount++;
    }
  });

  const html = `
    <!-- AMU Summary Cards -->
    <div id="amu-summary-cards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
       <!-- Loaded dynamically -->
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="glass-panel p-6 hover-card stagger-1 border-l-4 border-l-blue-500">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500 font-medium" data-i18n="dashboard.totalAnimals">Total Animals</p>
            <h3 class="text-3xl font-bold text-gray-800 mt-1">${totalAnimals}</h3>
          </div>
          <div class="bg-blue-50 p-2 rounded-lg text-blue-500"><i data-lucide="paw-print"></i></div>
        </div>
      </div>
      
      <div class="glass-panel p-6 hover-card stagger-2 border-l-4 border-l-purple-500">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500 font-medium" data-i18n="dashboard.activeTreatments">Active Treatments</p>
            <h3 class="text-3xl font-bold text-gray-800 mt-1">${activeTreatments}</h3>
          </div>
          <div class="bg-purple-50 p-2 rounded-lg text-purple-500"><i data-lucide="activity"></i></div>
        </div>
      </div>

      <div class="glass-panel p-6 hover-card stagger-3 border-l-4 border-l-red-500">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500 font-medium" data-i18n="dashboard.mrlRestricted">MRL Restricted</p>
            <h3 class="text-3xl font-bold text-gray-800 mt-1">${restrictedCount}</h3>
          </div>
          <div class="bg-red-50 p-2 rounded-lg text-red-500"><i data-lucide="alert-triangle"></i></div>
        </div>
        <p class="text-xs text-red-500 mt-4 flex items-center font-medium">Milk/Meat withheld</p>
      </div>

      <div class="glass-panel p-6 hover-card stagger-4 border-l-4 border-l-primary">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500 font-medium" data-i18n="dashboard.amuIndex">AMU Index</p>
            <h3 class="text-3xl font-bold text-gray-800 mt-1" data-i18n="dashboard.safe">Safe</h3>
          </div>
          <div class="bg-emerald-50 p-2 rounded-lg text-primary"><i data-lucide="shield-check"></i></div>
        </div>
        <p class="text-xs text-gray-500 mt-4 flex items-center">Below resistance threshold</p>
      </div>
    </div>

    <!-- Health Scanner Section -->
    <div class="glass-panel p-6 mb-8 slide-up" style="animation-delay: 0.1s">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-lg font-bold text-gray-800 brand-font flex items-center">
          <i data-lucide="activity" class="w-5 h-5 mr-2 text-primary"></i>
          Live Health Scanner
        </h3>
        <span class="flex items-center text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-wider animate-pulse">
          <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
          Live Feed
        </span>
      </div>
      <div id="health-scanner-content" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="flex justify-center p-8 col-span-full">
          <i data-lucide="loader-2" class="w-6 h-6 animate-spin text-primary"></i>
        </div>
      </div>
    </div>

    <!-- Charts Area -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 glass-panel p-6 slide-up">
        <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h3 class="text-lg font-bold text-gray-800 brand-font" data-i18n="dashboard.amuTrends">AMU Live Analytics</h3>
          <div class="flex items-center space-x-2">
            <select id="amu-range" class="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="3">Last 3 Months</option>
              <option value="6" selected>Last 6 Months</option>
              <option value="12">Last 12 Months</option>
            </select>
          </div>
        </div>
        <div id="chart-loading" class="hidden flex justify-center items-center h-72">
          <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-primary"></i>
        </div>
        <div id="chart-container" class="relative h-72 w-full">
          <canvas id="amuChart"></canvas>
        </div>
        <div id="empty-chart-state" class="hidden flex flex-col justify-center items-center h-72 text-center">
           <div class="bg-gray-50 p-4 rounded-full mb-4 text-gray-400"><i data-lucide="bar-chart-2" class="w-8 h-8"></i></div>
           <p class="text-gray-500 font-medium">No treatment records available yet.</p>
           <button class="mt-4 text-primary font-bold text-sm hover:underline" onclick="window.openAddTreatmentModal()">Log first treatment</button>
        </div>
      </div>
      
      <div class="glass-panel p-6 slide-up" style="animation-delay: 0.2s">
        <h3 class="text-lg font-bold text-gray-800 mb-4 brand-font" data-i18n="dashboard.activeAlerts">Active MRL Alerts</h3>
        <div class="space-y-4" id="dashboard-alerts">
          <!-- Alerts generated via JS -->
        </div>
        <button class="w-full mt-6 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors" onclick="document.querySelector('[data-view=\\'mrl\\']').click()" data-i18n="dashboard.viewAll">View All Restrictions</button>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Function to refresh chart data
  async function refreshAMUChart(months = 6) {
    const loading = document.getElementById('chart-loading');
    const chartContainer = document.getElementById('chart-container');
    const emptyState = document.getElementById('empty-chart-state');
    const summaryContainer = document.getElementById('amu-summary-cards');

    loading.classList.remove('hidden');
    chartContainer.classList.add('hidden');
    emptyState.classList.add('hidden');

    const data = await window.dashboardService.getAMUTrends(months);

    loading.classList.add('hidden');

    // Summary Cards
    const antiChangeColor = data.antiChange > 0 ? 'text-red-500' : 'text-emerald-500';
    const vacChangeColor = data.vacChange >= 0 ? 'text-emerald-500' : 'text-red-500';
    const antiIcon = data.antiChange > 0 ? 'trending-up' : 'trending-down';
    const vacIcon = data.vacChange >= 0 ? 'trending-up' : 'trending-down';

    summaryContainer.innerHTML = `
      <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
        <div class="bg-red-50 text-red-500 p-2.5 rounded-lg"><i data-lucide="flask-conical"></i></div>
        <div>
          <p class="text-xs text-gray-500 font-bold uppercase tracking-wider">Antibiotics</p>
          <h4 class="text-xl font-bold text-gray-800">${data.totalAntibiotics} doses</h4>
          <p class="text-[10px] ${antiChangeColor} mt-1 flex items-center font-bold">
            <i data-lucide="${antiIcon}" class="w-2.5 h-2.5 mr-1"></i> ${Math.abs(data.antiChange)}% vs last month
          </p>
        </div>
      </div>
      <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
        <div class="bg-emerald-50 text-primary p-2.5 rounded-lg"><i data-lucide="shield-plus"></i></div>
        <div>
          <p class="text-xs text-gray-500 font-bold uppercase tracking-wider">Vaccinations</p>
          <h4 class="text-xl font-bold text-gray-800">${data.totalVaccines} doses</h4>
          <p class="text-[10px] ${vacChangeColor} mt-1 flex items-center font-bold">
            <i data-lucide="${vacIcon}" class="w-2.5 h-2.5 mr-1"></i> ${Math.abs(data.vacChange)}% vs last month
          </p>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    if (data.labels.length === 0 || (data.totalAntibiotics === 0 && data.totalVaccines === 0)) {
      emptyState.classList.remove('hidden');
      return;
    }

    chartContainer.classList.remove('hidden');
    const ctx = document.getElementById('amuChart').getContext('2d');

    if (window.myAMUChart) window.myAMUChart.destroy();

    window.myAMUChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Antibiotics',
            data: data.antibiotics,
            backgroundColor: '#ef4444',
            borderRadius: 6
          },
          {
            label: 'Vaccines',
            data: data.vaccines,
            backgroundColor: '#10b981',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1e293b',
            bodyColor: '#64748b',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            usePointStyle: true,
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.formattedValue} doses`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f8fafc', drawBorder: false },
            ticks: { stepSize: 1, color: '#94a3b8', font: { size: 10 } }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#64748b', font: { size: 10, weight: '600' } }
          }
        }
      }
    });
  }

  // Range Listener
  const rangeSelect = document.getElementById('amu-range');
  rangeSelect.addEventListener('change', (e) => refreshAMUChart(parseInt(e.target.value)));

  // Initial Chart Render
  refreshAMUChart(6);

  // Render Alerts (keeping existing logic but ensuring lucide icons work)
  const alertsContainer = document.getElementById('dashboard-alerts');
  let alertHtml = '';
  treatments.forEach(t => {
    const medName = t.medicines ? t.medicines.name : t.medicine;
    const med = mockData.medicines.find(m => m.name === medName);
    if (med) {
      const dateStr = t.start_date || t.date;
      const status = getMRLStatus(dateStr, med.withdrawalMilk);
      if (status.status !== 'Safe') {
        const tag = t.animals ? t.animals.animal_tag : t.animalId;
        alertHtml += `
          <div class="flex items-start p-3 border border-gray-100 rounded-lg bg-white shadow-sm">
            <div class="${status.status === 'Restricted' ? 'text-red-500 bg-red-50' : 'text-yellow-600 bg-yellow-50'} p-2 rounded-lg mr-3">
              <i data-lucide="clock" class="w-4 h-4"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-gray-800">${tag} - ${med.name}</p>
              <p class="text-xs text-gray-500">Milk Safe in: <span class="font-bold ${status.status === 'Restricted' ? 'text-red-500' : 'text-yellow-600'}">${status.remaining} days</span></p>
            </div>
          </div>
        `;
      }
    }
  });
  if (!alertHtml) alertHtml = '<p class="text-sm text-gray-500">No active restrictions. All products safe for release.</p>';
  alertsContainer.innerHTML = alertHtml;
  if (window.lucide) window.lucide.createIcons();

  // Health Scanner Update Logic
  async function updateHealthScanner() {
    const logs = await window.healthService.getLatestHealthLogs();
    const scannerContent = document.getElementById('health-scanner-content');
    if (!scannerContent) {
      clearInterval(window.healthScannerInterval);
      return;
    }

    if (!logs || logs.length === 0) {
      scannerContent.innerHTML = '<p class="text-sm text-gray-500 col-span-full text-center py-8">No live health data received yet.</p>';
      return;
    }

    scannerContent.innerHTML = logs.map(log => {
      const isFever = parseFloat(log.temperature) > 102.5;
      const statusColor = isFever ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100';
      const tempColor = isFever ? 'text-red-600' : 'text-gray-800';

      return `
        <div class="p-4 border rounded-xl bg-white shadow-sm hover:shadow-md transition-all ${isFever ? 'border-red-200 bg-red-50/10' : 'border-gray-100'}">
          <div class="flex justify-between items-start mb-3">
            <div>
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Animal ID</p>
              <h4 class="text-base font-bold text-gray-800">${log.animal_id}</h4>
            </div>
            <div class="px-2 py-1 rounded-lg ${statusColor} text-[10px] font-bold border">
              ${log.status || (isFever ? 'Fever Alert' : 'Normal')}
            </div>
          </div>
          
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-center">
              <div class="p-1.5 rounded-lg ${isFever ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-primary'} mr-2.5">
                <i data-lucide="thermometer" class="w-4 h-4"></i>
              </div>
              <span class="text-xl font-bold ${tempColor}">${log.temperature}°F</span>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-gray-400">Last Sync</p>
              <p class="text-[10px] font-medium text-gray-600">${new Date(log.updated_at).toLocaleTimeString()}</p>
            </div>
          </div>
          
          ${isFever ? `
            <div class="mt-3 p-2 bg-red-600 text-white rounded-lg flex items-center space-x-2 shadow-sm animate-bounce">
              <i data-lucide="alert-triangle" class="w-3 h-3 text-white"></i>
              <span class="text-[10px] font-bold uppercase tracking-wider">Possible Fever</span>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // Initial update
  updateHealthScanner();

  // Set auto-refresh
  if (window.healthScannerInterval) clearInterval(window.healthScannerInterval);
  window.healthScannerInterval = setInterval(updateHealthScanner, 5000);
}

async function renderAnimals(container) {
  const animals = await window.animalService.getAnimals();

  let rows = animals.map(a => {
    const rawStatus = a.health_status || a.status || 'healthy';
    const formattedStatus = rawStatus.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const statusColor = rawStatus.toLowerCase() === 'healthy' ? 'status-safe'
      : (rawStatus.toLowerCase() === 'observation' ? 'status-warning' : 'status-danger');

    return `
    <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td class="py-4 px-6 font-medium text-gray-900">${a.animal_tag || a.id}</td>
      <td class="py-4 px-6 text-gray-600">${a.breed}</td>
      <td class="py-4 px-6 text-gray-600">${a.age || a.weight}</td>
      <td class="py-4 px-6">
        <span class="status-pill ${statusColor}">
          ${formattedStatus}
        </span>
      </td>
      <td class="py-4 px-6 text-gray-500 text-sm">${a.lastCheck || new Date(a.created_at).toLocaleDateString() || 'N/A'}</td>
      <td class="py-4 px-6 text-right whitespace-nowrap">
        <button class="bg-emerald-50 text-primary hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors shadow-sm" onclick="window.openAddTreatmentModal('${a.id}')">
          <i data-lucide="syringe" class="w-3 h-3 inline-block mr-1"></i> Treat
        </button>
        <button class="text-gray-400 hover:text-red-600 font-medium text-sm ml-3 transition-colors" title="Delete Animal" onclick="if(confirm('Are you sure you want to remove this animal?')) window.animalService.deleteAnimal('${a.id}').then(() => document.querySelector('[data-view=\\'animals\\']').click())">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </td>
    </tr>
  `}).join('');

  let mobileCards = animals.map(a => {
    const rawStatus = a.health_status || a.status || 'healthy';
    const formattedStatus = rawStatus.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const statusColor = rawStatus.toLowerCase() === 'healthy' ? 'status-safe'
      : (rawStatus.toLowerCase() === 'observation' ? 'status-warning' : 'status-danger');

    return `
    <div class="bg-white p-4 border-b border-gray-100 flex flex-col space-y-3">
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-bold text-gray-900 text-base">${a.animal_tag || a.id}</h4>
          <p class="text-sm text-gray-500">${a.breed} • ${a.age || a.weight}</p>
        </div>
        <span class="status-pill ${statusColor} text-[10px] py-0.5 px-2">
          ${formattedStatus}
        </span>
      </div>
      <div class="flex justify-between items-center text-xs text-gray-500 border-t border-gray-50 pt-2">
        <span>Last Check: ${a.lastCheck || new Date(a.created_at).toLocaleDateString() || 'N/A'}</span>
        <div class="flex space-x-2">
          <button class="text-red-400 hover:text-red-600 p-2" onclick="if(confirm('Are you sure you want to remove this animal?')) window.animalService.deleteAnimal('${a.id}').then(() => document.querySelector('[data-view=\\'animals\\']').click())">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
          <button class="bg-emerald-50 text-primary px-3 py-1.5 rounded-lg font-medium shadow-sm flex items-center" onclick="window.openAddTreatmentModal('${a.id}')">
            <i data-lucide="syringe" class="w-3 h-3 mr-1"></i> Treat
          </button>
        </div>
      </div>
    </div>
  `}).join('');

  container.innerHTML = `
    <div class="glass-panel overflow-hidden slide-up">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white flex-wrap gap-4">
        <h3 class="text-lg font-bold text-gray-800 brand-font">Herd Overview</h3>
        <div class="flex items-center space-x-3 w-full md:w-auto">
          <div class="relative flex-grow">
            <i data-lucide="search" class="absolute left-3 top-2.5 w-4 h-4 text-gray-400"></i>
            <input type="text" placeholder="Search by Tag ID..." class="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
          </div>
          <button onclick="openAddAnimalModal()" class="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center space-x-2 whitespace-nowrap">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Add Animal</span>
          </button>
        </div>
      </div>
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
              <th class="py-3 px-6 font-semibold">Animal ID</th>
              <th class="py-3 px-6 font-semibold">Breed</th>
              <th class="py-3 px-6 font-semibold">Age</th>
              <th class="py-3 px-6 font-semibold">Health Status</th>
              <th class="py-3 px-6 font-semibold">Last Checked</th>
              <th class="py-3 px-6 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody class="bg-white">
            ${rows}
          </tbody>
        </table>
      </div>
      <!-- Mobile Cards -->
      <div class="md:hidden flex flex-col bg-gray-50">
        ${mobileCards}
      </div>
    </div>
  `;
}

async function renderTreatments(container) {
  const treatments = await window.treatmentService.getTreatments();

  let rows = treatments.map(t => {
    const date = t.start_date ? new Date(t.start_date).toLocaleDateString() : t.date;
    const tag = t.animals ? t.animals.animal_tag : t.animalId;
    const medName = t.medicines ? t.medicines.name : t.medicine;

    return `
    <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td class="py-4 px-6 font-medium text-gray-900">${date}</td>
      <td class="py-4 px-6 text-primary font-bold">${tag}</td>
      <td class="py-4 px-6 text-gray-800">${medName}</td>
      <td class="py-4 px-6 text-gray-600">${t.disease || t.notes || 'N/A'}</td>
      <td class="py-4 px-6 text-gray-600">${t.dosage || t.dose || 'N/A'}</td>
      <td class="py-4 px-6 text-gray-500 text-sm">${t.vet_id || t.vet || 'Unknown'}</td>
    </tr>
  `}).join('');

  let mobileCards = treatments.map(t => {
    const date = t.start_date ? new Date(t.start_date).toLocaleDateString() : t.date;
    const tag = t.animals ? t.animals.animal_tag : t.animalId;
    const medName = t.medicines ? t.medicines.name : t.medicine;

    return `
    <div class="bg-white p-4 border-b border-gray-100 flex flex-col space-y-2">
      <div class="flex justify-between items-start">
        <h4 class="font-bold text-primary text-base">${tag}</h4>
        <span class="text-xs text-gray-500 font-medium">${date}</span>
      </div>
      <div>
        <p class="text-sm font-bold text-gray-800">${medName} <span class="text-gray-500 font-normal">(${t.dosage || t.dose || 'N/A'})</span></p>
        <p class="text-sm text-gray-600 mt-1"><span class="text-gray-400 text-xs uppercase">Diagnosis:</span> ${t.disease || t.notes || 'N/A'}</p>
      </div>
      <div class="flex justify-between items-center text-xs text-gray-500 border-t border-gray-50 pt-2 mt-2">
        <span><i data-lucide="user" class="w-3 h-3 inline mr-1"></i>${t.vet_id || t.vet || 'Unknown'}</span>
      </div>
    </div>
  `}).join('');

  container.innerHTML = `
    <div class="glass-panel overflow-hidden slide-up">
      <div class="p-6 border-b border-gray-100 bg-white">
        <h3 class="text-lg font-bold text-gray-800 brand-font">Recent Treatments</h3>
      </div>
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
              <th class="py-3 px-6 font-semibold">Date</th>
              <th class="py-3 px-6 font-semibold">Animal ID</th>
              <th class="py-3 px-6 font-semibold">Medicine Administered</th>
              <th class="py-3 px-6 font-semibold">Diagnosis</th>
              <th class="py-3 px-6 font-semibold">Dosage</th>
              <th class="py-3 px-6 font-semibold">Veterinarian</th>
            </tr>
          </thead>
          <tbody class="bg-white">
            ${rows}
          </tbody>
        </table>
      </div>
      <!-- Mobile Cards -->
      <div class="md:hidden flex flex-col bg-gray-50">
        ${mobileCards}
      </div>
    </div>
  `;
}

async function renderMRL(container) {
  const treatments = await window.treatmentService.getTreatments();

  let rows = treatments.map(t => {
    const medName = t.medicines ? t.medicines.name : t.medicine;
    const med = mockData.medicines.find(m => m.name === medName);
    if (!med) return '';

    const dateStr = t.start_date || t.date;
    const tag = t.animals ? t.animals.animal_tag : t.animalId;

    const milkStatus = getMRLStatus(dateStr, med.withdrawalMilk);
    const meatStatus = getMRLStatus(dateStr, med.withdrawalMeat);

    const milkEnd = calculateWithdrawal(dateStr, med.withdrawalMilk).toISOString().split('T')[0];

    return `
      <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
        <td class="py-4 px-6 font-bold text-gray-900">${tag}</td>
        <td class="py-4 px-6 text-gray-600">${medName}</td>
        <td class="py-4 px-6 text-gray-500 text-sm">${dateStr.substring(0, 10)}</td>
        <td class="py-4 px-6">
          <div class="flex items-center space-x-2">
            <span class="status-pill ${milkStatus.color === 'safe' ? 'status-safe' : (milkStatus.color === 'warning' ? 'status-warning' : 'status-danger')}">
              ${milkStatus.status}
            </span>
            ${milkStatus.status !== 'Safe' ? `<span class="text-xs text-gray-500 font-medium">(${milkStatus.remaining} days left)</span>` : ''}
          </div>
        </td>
        <td class="py-4 px-6 text-gray-600 text-sm">${med.withdrawalMilk === 0 ? 'N/A' : milkEnd}</td>
      </tr>
    `;
  }).join('');

  let mobileCards = treatments.map(t => {
    const medName = t.medicines ? t.medicines.name : t.medicine;
    const med = mockData.medicines.find(m => m.name === medName);
    if (!med) return '';

    const dateStr = t.start_date || t.date;
    const tag = t.animals ? t.animals.animal_tag : t.animalId;

    const milkStatus = getMRLStatus(dateStr, med.withdrawalMilk);
    const milkEnd = calculateWithdrawal(dateStr, med.withdrawalMilk).toISOString().split('T')[0];

    return `
    <div class="bg-white p-4 border-b border-gray-100 flex flex-col space-y-2">
      <div class="flex justify-between items-start">
        <h4 class="font-bold text-gray-900 text-base">${tag}</h4>
        <span class="status-pill ${milkStatus.color === 'safe' ? 'status-safe' : (milkStatus.color === 'warning' ? 'status-warning' : 'status-danger')} text-[10px] py-0.5 px-2">
          ${milkStatus.status}
        </span>
      </div>
      <div>
        <p class="text-sm font-bold text-gray-800">${medName}</p>
        <p class="text-sm text-gray-600 mt-1">Treated: ${dateStr.substring(0, 10)}</p>
      </div>
      <div class="flex justify-between items-center text-xs border-t border-gray-50 pt-2 mt-2">
        <span class="text-gray-500">Safe Release:</span>
        <span class="${milkStatus.status !== 'Safe' ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'}">${med.withdrawalMilk === 0 ? 'Immediately' : milkEnd}</span>
      </div>
    </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100 mb-8 slide-up flex items-center justify-between">
      <div>
        <h3 class="text-xl font-bold text-primary-dark brand-font flex items-center"><i data-lucide="shield-check" class="mr-2"></i> MRL Compliance Engine active</h3>
        <p class="text-sm text-primary mt-1">Automatically tracking residue limits to prevent contaminated milk/meat entering the supply chain.</p>
      </div>
      <div class="hidden md:block">
        <div class="animate-pulse flex items-center justify-center w-12 h-12 bg-white rounded-full text-primary shadow-sm">
          <i data-lucide="activity"></i>
        </div>
      </div>
    </div>

    <div class="glass-panel overflow-hidden slide-up stagger-1">
      <div class="p-6 border-b border-gray-100 bg-white">
        <h3 class="text-lg font-bold text-gray-800 brand-font">Withdrawal Period Tracker</h3>
      </div>
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
              <th class="py-3 px-6 font-semibold">Animal ID</th>
              <th class="py-3 px-6 font-semibold">Medicine</th>
              <th class="py-3 px-6 font-semibold">Treated On</th>
              <th class="py-3 px-6 font-semibold">Milk Status</th>
              <th class="py-3 px-6 font-semibold">Safe Release Date</th>
            </tr>
          </thead>
          <tbody class="bg-white">
            ${rows}
          </tbody>
        </table>
      </div>
      <!-- Mobile Cards -->
      <div class="md:hidden flex flex-col bg-gray-50">
        ${mobileCards}
      </div>
    </div>
  `;
}

function renderReports(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 slide-up">
      <div class="glass-panel p-8 text-center hover-card cursor-pointer border border-gray-100 group" onclick="window.reportService.generateCompliancePDF()">
        <div class="w-20 h-20 mx-auto bg-blue-50 text-blue-600 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
          <i data-lucide="file-check-2" class="w-10 h-10"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 brand-font">Compliance Audit Report</h3>
        <p class="text-gray-500 text-sm mt-3 mb-8 px-4 leading-relaxed">Generate full MRL and AMU logs based on your live farm records for regulatory inspectors and cooperatives.</p>
        <button class="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all transform active:scale-95 flex items-center justify-center space-x-2">
          <i data-lucide="download" class="w-4 h-4"></i>
          <span>Download PDF Report</span>
        </button>
      </div>

      <div class="glass-panel p-8 text-center hover-card cursor-pointer border border-gray-100 group" onclick="window.reportService.generateSafeBatchQR()">
        <div class="w-20 h-20 mx-auto bg-emerald-50 text-emerald-600 rounded-[24px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
          <i data-lucide="qr-code" class="w-10 h-10"></i>
        </div>
        <h3 class="text-2xl font-bold text-gray-800 brand-font">Safe Batch QR Badge</h3>
        <p class="text-gray-500 text-sm mt-3 mb-8 px-4 leading-relaxed">Generate traceability QR codes to prove milk/meat safety to buyers. Requires zero active MRL restrictions.</p>
        <button class="w-full py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-all transform active:scale-95 flex items-center justify-center space-x-2">
          <i data-lucide="plus" class="w-4 h-4"></i>
          <span>Generate Safe Badge</span>
        </button>
      </div>
    </div>

    <!-- Empty State Helper -->
    <div class="mt-12 p-8 border-2 border-dashed border-gray-200 rounded-[32px] text-center bg-gray-50/50">
       <p class="text-gray-400 text-sm italic">Reports are dynamically generated using your real-time Supabase records. Ensure all treatments are logged accurately for valid compliance.</p>
    </div>
  `;
}

async function renderProfile(container) {
  const profile = await window.userService.getProfile();
  const stats = await window.dashboardService.getDashboardStats();
  const animals = await window.animalService.getAnimals();
  const treatments = await window.treatmentService.getTreatments();

  // Update sidebar names to sync with profile
  const sidebarUser = document.getElementById('sidebar-user-name');
  const sidebarFarm = document.getElementById('sidebar-farm-name');
  if (sidebarUser) sidebarUser.textContent = profile.full_name;
  if (sidebarFarm) sidebarFarm.textContent = profile.farm_name;

  let activityHtml = treatments.slice(0, 3).map(t => `
    <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg mb-2 border border-gray-100">
      <div class="bg-primary text-white p-2 rounded-full"><i data-lucide="syringe" class="w-4 h-4"></i></div>
      <div>
        <p class="text-sm font-semibold text-gray-800">Treatment Logged for ${t.animals ? t.animals.animal_tag : t.animalId}</p>
        <p class="text-xs text-gray-500">${new Date(t.start_date || t.date).toLocaleDateString()} - ${t.medicines ? t.medicines.name : t.medicine}</p>
      </div>
    </div>
  `).join('');

  if (!activityHtml) activityHtml = '<p class="text-sm text-gray-500">No recent activity.</p>';

  container.innerHTML = `
    <div class="space-y-6 slide-up">
      <!-- Header Section -->
      <div class="glass-panel p-6 flex flex-col md:flex-row items-center md:justify-between border border-gray-100 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
        <div class="flex items-center space-x-5 z-10">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=059669&color=fff&size=128" alt="Avatar" class="w-20 h-20 rounded-full shadow-md border-4 border-white">
          <div>
            <h2 class="text-2xl font-bold text-gray-800 brand-font">${profile.full_name}</h2>
            <div class="flex items-center space-x-3 mt-1 text-sm text-gray-600">
              <span class="flex items-center"><i data-lucide="shield-check" class="w-4 h-4 mr-1 text-primary"></i> ${profile.role}</span>
              <span class="flex items-center"><i data-lucide="map-pin" class="w-4 h-4 mr-1 text-gray-400"></i> ${profile.village}, ${profile.state}</span>
            </div>
            <p class="text-primary font-medium text-sm mt-1">${profile.farm_name}</p>
          </div>
        </div>
        <div class="mt-5 md:mt-0 flex space-x-3 z-10">
          <button onclick="window.openEditProfileModal()" class="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm flex items-center">
            <i data-lucide="edit-3" class="w-4 h-4 mr-2"></i> <span data-i18n="btn.editProfile">Edit Profile</span>
          </button>
          <button onclick="window.authService.signOut()" class="px-5 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors flex items-center">
            <i data-lucide="log-out" class="w-4 h-4 mr-2"></i> <span data-i18n="btn.logout">Logout</span>
          </button>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Stats & Actions Column -->
        <div class="lg:col-span-2 space-y-6">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
              <div class="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
                <i data-lucide="paw-print" class="w-5 h-5"></i>
              </div>
              <p class="text-2xl font-bold text-gray-800">${animals.length || stats.totalAnimals || 0}</p>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1" data-i18n="profile.totalHerd">Total Herd</p>
            </div>
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
              <div class="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-2">
                <i data-lucide="activity" class="w-5 h-5"></i>
              </div>
              <p class="text-2xl font-bold text-gray-800">${animals.filter(a => (a.health_status || a.status || '').toLowerCase() === 'healthy').length || 0}</p>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1" data-i18n="profile.healthy">Healthy</p>
            </div>
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
              <div class="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-2">
                <i data-lucide="thermometer" class="w-5 h-5"></i>
              </div>
              <p class="text-2xl font-bold text-gray-800">${treatments.length || stats.activeTreatments || 0}</p>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1" data-i18n="profile.treated">Treated</p>
            </div>
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
              <div class="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                <i data-lucide="shield" class="w-5 h-5"></i>
              </div>
              <p class="text-2xl font-bold text-gray-800">98%</p>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1" data-i18n="profile.compliance">Compliance</p>
            </div>
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center sm:col-span-2">
              <h3 class="text-sm font-bold text-gray-800 mb-3 w-full text-left" data-i18n="profile.quickActions">Quick Actions</h3>
              <div class="flex space-x-2 w-full">
                <button onclick="document.querySelector('[data-view=\\'animals\\']').click(); window.openAddAnimalModal()" class="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200" data-i18n="btn.addAnimal">Add Animal</button>
                <button onclick="window.openAddTreatmentModal()" class="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg text-sm font-medium shadow-sm transition-colors" data-i18n="btn.logTreatment">Log Treatment</button>
              </div>
            </div>
          </div>

          <!-- Farm Summary -->
          <div class="glass-panel p-6 border border-gray-100">
            <h3 class="text-lg font-bold text-gray-800 brand-font mb-4 flex items-center">
              <i data-lucide="file-text" class="w-5 h-5 mr-2 text-primary"></i> <span data-i18n="profile.farmSummary">Farm Summary</span>
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div class="flex justify-between border-b border-gray-50 pb-2">
                <span class="text-gray-500">Farm Type</span>
                <span class="font-medium text-gray-800">Dairy / Livestock</span>
              </div>
              <div class="flex justify-between border-b border-gray-50 pb-2">
                <span class="text-gray-500">Plan</span>
                <span class="font-medium text-primary bg-emerald-50 px-2 py-0.5 rounded-md">${profile.plan}</span>
              </div>
              <div class="flex justify-between border-b border-gray-50 pb-2">
                <span class="text-gray-500">Location</span>
                <span class="font-medium text-gray-800">${profile.district}, ${profile.state}</span>
              </div>
              <div class="flex justify-between border-b border-gray-50 pb-2">
                <span class="text-gray-500">Last Checked</span>
                <span class="font-medium text-gray-800">Today</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity Feed Column -->
        <div class="glass-panel p-6 border border-gray-100">
          <h3 class="text-lg font-bold text-gray-800 brand-font mb-4 flex items-center">
            <i data-lucide="clock" class="w-5 h-5 mr-2 text-gray-400"></i> <span data-i18n="profile.recentActivity">Recent Activity</span>
          </h3>
          <div class="space-y-3">
            ${activityHtml}
          </div>
        </div>
        
      </div>
    </div>
  `;
}

// Global modal functions
window.openAddTreatmentModal = async function (preselectedAnimalId = null) {
  const container = document.getElementById('modal-container');

  // Show loading state first
  container.innerHTML = `
    <div class="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 fade-in">
      <div class="bg-white rounded-2xl shadow-xl p-8 m-4 flex justify-center items-center">
        <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-primary"></i>
      </div>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();

  // Fetch data
  const animals = await window.animalService.getAnimals();
  let diseases = [];
  let medicines = [];

  if (window.supabaseClient) {
    // 1. Fetch Diseases
    const { data: dbDiseases, error: diseaseError } = await window.supabaseClient
      .from('diseases')
      .select('id, name, symptoms');

    if (diseaseError) {
      console.error('Error fetching diseases:', diseaseError);
      diseases = window.mockData && window.mockData.diseases ? window.mockData.diseases : [];
    } else {
      diseases = dbDiseases || [];
    }

    // 2. Fetch Medicines
    const { data: dbMedicines, error: medError } = await window.supabaseClient
      .from('medicines')
      .select('id, name, category, withdrawal_milk_days');

    if (medError) {
      console.error('Error fetching medicines:', medError);
      medicines = window.mockData ? window.mockData.medicines : [];
    } else {
      medicines = dbMedicines || [];
    }
  } else {
    diseases = window.mockData && window.mockData.diseases ? window.mockData.diseases : [];
    medicines = window.mockData ? window.mockData.medicines : [];
  }

  if (!animals || animals.length === 0) {
    container.innerHTML = `
      <div class="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 fade-in">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 m-4 relative text-center">
          <div class="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <i data-lucide="alert-circle" class="w-8 h-8"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">No Animals Found</h3>
          <p class="text-gray-500 mb-6">You need to add an animal to your registry before logging a treatment.</p>
          <div class="flex justify-center space-x-3">
            <button onclick="document.getElementById('modal-container').innerHTML=''" class="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
            <button onclick="document.getElementById('modal-container').innerHTML=''; document.querySelector('[data-view=\\'animals\\']').click(); window.openAddAnimalModal();" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium shadow-sm transition-colors">Add Animal First</button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  let animalOptions = animals.map(a => `<option value="${a.id}" ${a.id === preselectedAnimalId || a.animal_tag === preselectedAnimalId ? 'selected' : ''}>${a.animal_tag || a.id} - ${a.breed}</option>`).join('');
  let diseaseOptions = diseases.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  let medicineOptions = medicines.map(m => `<option value="${m.id}">${m.name} (${normalizeCategory(m.category)})</option>`).join('');

  window.modalDiseases = diseases;
  window.modalMedicines = medicines;

  container.innerHTML = `
    <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-end md:items-start z-50 fade-in">
      <div class="bg-white rounded-t-3xl md:rounded-2xl shadow-xl w-full max-w-2xl p-6 md:p-8 m-0 md:m-4 relative md:mt-10 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-2">
          <div class="flex items-center space-x-3">
            <div class="bg-emerald-50 text-primary p-2 rounded-lg">
              <i data-lucide="syringe" class="w-6 h-6"></i>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-800 brand-font" data-i18n="modal.logTreatment.title">Log Treatment</h2>
              <p class="text-sm text-gray-500 mt-1" data-i18n="modal.logTreatment.desc">Record medicine, dosage, and start withdrawal tracking.</p>
            </div>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML=''" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="treatment-form" class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1"><span data-i18n="modal.selectAnimal">Select Animal</span> <span class="text-red-500">*</span></label>
              <select id="trt-animal" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white">
                <option value="" disabled selected>Search or select an animal...</option>
                ${animalOptions}
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" data-i18n="modal.disease">Disease / Condition</label>
              ${diseases.length > 0 ? `
              <select id="trt-disease" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white">
                <option value="" disabled selected>Search or select disease...</option>
                ${diseaseOptions}
              </select>
              <p id="trt-disease-symptoms" class="text-xs text-primary mt-1 hidden font-medium"></p>
              ` : '<p class="text-sm text-gray-500 italic p-2 bg-gray-50 rounded-lg border border-gray-100">No data found</p>'}
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"><span data-i18n="modal.medicineName">Medicine Name</span> <span class="text-red-500">*</span></label>
              ${medicines.length > 0 ? `
              <select id="trt-medicine" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white">
                <option value="" disabled selected>Choose medicine</option>
                ${medicineOptions}
              </select>
              <div id="trt-medicine-info" class="mt-2 space-y-1 hidden bg-blue-50 p-2 rounded-lg border border-blue-100">
                <p class="text-xs text-blue-800 flex items-center"><i data-lucide="tag" class="w-3 h-3 mr-1 opacity-70"></i> Category: <span id="trt-med-cat" class="ml-1 font-bold"></span></p>
                <p class="text-xs text-red-600 flex items-center"><i data-lucide="alert-circle" class="w-3 h-3 mr-1 opacity-70"></i> Withdrawal: <span id="trt-med-withdraw" class="ml-1 font-bold"></span></p>
              </div>
              ` : '<p class="text-sm text-gray-500 italic p-2 bg-gray-50 rounded-lg border border-gray-100">No data found</p>'}
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"><span data-i18n="modal.dosage">Dosage</span> <span class="text-red-500">*</span></label>
              <input type="text" id="trt-dosage" required placeholder="e.g. 15ml" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" data-i18n="modal.route">Route</label>
              <select id="trt-route" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white">
                <option value="Injection (IM)">Injection (IM)</option>
                <option value="Injection (SC)">Injection (SC)</option>
                <option value="Oral">Oral</option>
                <option value="Topical">Topical</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"><span data-i18n="modal.startDate">Start Date</span> <span class="text-red-500">*</span></label>
              <input type="date" id="trt-start-date" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"><span data-i18n="modal.endDate">End Date</span> <span class="text-red-500">*</span></label>
              <input type="date" id="trt-end-date" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1" data-i18n="modal.prescribedBy">Prescribed By</label>
              <select id="trt-vet" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white">
                <option value="" disabled selected>Select Doctor</option>
                <option value="Dr. Sharma">Dr. Sharma</option>
                <option value="Dr. Verma">Dr. Verma</option>
                <option value="Dr. Singh">Dr. Singh</option>
                <option value="Dr. Patel">Dr. Patel</option>
              </select>
            </div>
          </div>
          
          <div class="md:col-span-2 pb-20 md:pb-0">
            <label class="block text-sm font-medium text-gray-700 mb-1" data-i18n="modal.notes">Notes / Instructions</label>
            <textarea id="trt-notes" rows="3" placeholder="Additional treatment notes..." class="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"></textarea>
          </div>

          <div class="fixed md:static bottom-0 left-0 right-0 p-4 md:p-0 md:pt-5 bg-white md:bg-transparent border-t border-gray-100 flex flex-col md:flex-row justify-end md:space-x-3 mt-6 z-20 shadow-[0_-10px_15px_-3px_rgb(0,0,0,0.05)] md:shadow-none space-y-3 md:space-y-0">
            <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="w-full md:w-auto px-6 py-3.5 md:py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors order-2 md:order-1" data-i18n="modal.cancel">Cancel</button>
            <button type="submit" id="trt-submit" class="w-full md:w-auto px-6 py-3.5 md:py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium shadow-md transition-all flex justify-center items-center hover:-translate-y-0.5 order-1 md:order-2">
              <i data-lucide="check-circle" class="w-5 h-5 mr-2"></i>
              <span data-i18n="modal.saveTreatment">Save Treatment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
  if (window.i18n) window.i18n.updateDOM();

  setTimeout(() => {
    const disSelect = document.getElementById('trt-disease');
    if (disSelect) {
      disSelect.addEventListener('change', (e) => {
        const d = window.modalDiseases.find(x => x.id === e.target.value);
        const sympEl = document.getElementById('trt-disease-symptoms');
        if (d && d.symptoms) {
          sympEl.textContent = 'Common Symptoms: ' + d.symptoms;
          sympEl.classList.remove('hidden');
        } else {
          sympEl.classList.add('hidden');
        }
      });
    }

    const medSelect = document.getElementById('trt-medicine');
    if (medSelect) {
      medSelect.addEventListener('change', (e) => {
        const m = window.modalMedicines.find(x => x.id === e.target.value);
        const infoEl = document.getElementById('trt-medicine-info');
        if (m) {
          const category = normalizeCategory(m.category);
          const withdrawalDays = m.withdrawal_milk_days !== undefined ? m.withdrawal_milk_days : (m.withdrawalMilk || 0);

          document.getElementById('trt-med-cat').textContent = category;
          document.getElementById('trt-med-withdraw').textContent = withdrawalDays ? withdrawalDays + ' Days (Milk)' : 'None';
          infoEl.classList.remove('hidden');
        } else {
          infoEl.classList.add('hidden');
        }
      });
    }
  }, 50);

  // Set default dates (Today in local YYYY-MM-DD format)
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  setTimeout(() => {
    const startInput = document.getElementById('trt-start-date');
    const endInput = document.getElementById('trt-end-date');
    if (startInput) startInput.value = todayStr;
    if (endInput) endInput.value = todayStr;
  }, 100);

  // Handle form submission
  document.getElementById('treatment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Capture Form Data
    const animalId = document.getElementById('trt-animal').value;
    const medicineId = document.getElementById('trt-medicine') ? document.getElementById('trt-medicine').value : '';
    const diseaseId = document.getElementById('trt-disease') ? document.getElementById('trt-disease').value : null;
    const dosage = document.getElementById('trt-dosage').value;
    const route = document.getElementById('trt-route').value;
    const startDateVal = document.getElementById('trt-start-date').value;
    const endDateVal = document.getElementById('trt-end-date').value;
    const prescribedBy = document.getElementById('trt-vet').value;
    const notes = document.getElementById('trt-notes').value;

    // 2. Date Safety (Ensure YYYY-MM-DD for Supabase)
    const toDBDate = (val) => {
      if (!val) return null;
      // If DD-MM-YYYY, convert to YYYY-MM-DD
      if (val.includes('-') && val.split('-')[0].length === 2) {
        const parts = val.split('-');
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return val; // Assume it's already YYYY-MM-DD
    };

    const start_date = toDBDate(startDateVal);
    const end_date = toDBDate(endDateVal);

    // 3. Validation
    if (!animalId) return window.showToast('Animal ID missing. Please try again.', 'error');
    if (!medicineId) return window.showToast('Please select a medicine.', 'warning');
    if (!start_date || !end_date) return window.showToast('Please select start and end dates.', 'warning');

    const btn = document.getElementById('trt-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mr-2"></i> <span>Saving...</span>';
    btn.disabled = true;

    try {
      // 4. Calculate Withdrawal Date
      const medInfo = window.modalMedicines.find(m => m.id === medicineId);
      const diseaseInfo = window.modalDiseases.find(d => d.id === diseaseId);
      
      let withdrawal_end_date = end_date;
      if (medInfo) {
        const withdrawalDays = medInfo.withdrawal_milk_days !== undefined ? medInfo.withdrawal_milk_days : (medInfo.withdrawalMilk || 0);
        if (withdrawalDays > 0) {
          const wDate = new Date(end_date);
          wDate.setDate(wDate.getDate() + withdrawalDays);
          withdrawal_end_date = wDate.toISOString().split('T')[0];
        }
      }

      // 5. Construct Payload
      const payload = {
        animal_id: animalId,
        medicine_id: medicineId,
        medicine_name: medInfo ? medInfo.name : 'Unknown',
        disease_id: diseaseId,
        diagnosis: diseaseInfo ? diseaseInfo.name : (notes.substring(0, 50) || 'General Treatment'),
        dosage: dosage,
        route: route,
        start_date: start_date,
        end_date: end_date,
        withdrawal_end_date: withdrawal_end_date,
        prescribed_by: prescribedBy || 'Self',
        notes: notes
      };

      // 6. Save
      const res = await window.treatmentService.addTreatment(payload);

      if (res) {
        document.getElementById('modal-container').innerHTML = '';
        
        // Refresh current view instantly
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav && window.switchView) {
          window.switchView(activeNav.dataset.view);
        }
        
        if (typeof refreshAMUChart === 'function') refreshAMUChart(6);
      } else {
        throw new Error("Service returned no result");
      }
    } catch (err) {
      console.error('Save failed:', err);
      btn.innerHTML = originalText;
      btn.disabled = false;
      window.showToast('Failed to save treatment: ' + err.message, 'error');
    }
  });
};

window.openAddAnimalModal = function () {
  const container = document.getElementById('modal-container');

  container.innerHTML = `
    <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-end md:items-start z-50 fade-in">
      <div class="bg-white rounded-t-3xl md:rounded-2xl shadow-xl w-full max-w-lg p-6 md:p-8 m-0 md:m-4 relative md:mt-10 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-2">
          <div class="flex items-center space-x-3">
            <div class="bg-emerald-50 text-primary p-2 rounded-lg">
              <i data-lucide="paw-print" class="w-6 h-6"></i>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-800 brand-font">Add New Animal</h2>
              <p class="text-sm text-gray-500 mt-1">Register livestock to your farm.</p>
            </div>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML=''" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="animal-form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Animal ID / Tag <span class="text-red-500">*</span></label>
              <input type="text" id="anm-id" required placeholder="e.g. TAG-106" class="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <input type="text" id="anm-breed" placeholder="e.g. Holstein" class="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="text" id="anm-age" placeholder="e.g. 2 years" class="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Weight</label>
              <input type="text" id="anm-weight" placeholder="e.g. 500kg" class="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
          </div>

          <div class="pb-20 md:pb-0">
            <label class="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
            <select id="anm-status" class="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white">
              <option value="healthy">Healthy</option>
              <option value="observation">Observation</option>
              <option value="under_treatment">Under Treatment</option>
            </select>
          </div>

          <div class="fixed md:static bottom-0 left-0 right-0 p-4 md:p-0 md:pt-5 bg-white md:bg-transparent border-t border-gray-100 flex flex-col md:flex-row justify-end md:space-x-3 mt-6 z-20 shadow-[0_-10px_15px_-3px_rgb(0,0,0,0.05)] md:shadow-none space-y-3 md:space-y-0">
            <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="w-full md:w-auto px-6 py-3.5 md:py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors order-2 md:order-1">Cancel</button>
            <button type="submit" id="anm-submit" class="w-full md:w-auto px-6 py-3.5 md:py-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium shadow-md transition-all flex justify-center items-center hover:-translate-y-0.5 order-1 md:order-2">
              <i data-lucide="check-circle" class="w-5 h-5 mr-2"></i>
              <span>Register Animal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  document.getElementById('animal-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('anm-submit');
    const originalText = btn.innerHTML;

    try {
      btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mr-2"></i> <span>Saving...</span>';
      btn.disabled = true;
      btn.classList.add('opacity-75', 'cursor-not-allowed');
      if (window.lucide) window.lucide.createIcons();

      const data = {
        animal_tag: document.getElementById('anm-id').value,
        breed: document.getElementById('anm-breed').value,
        age: document.getElementById('anm-age').value,
        weight: document.getElementById('anm-weight').value,
        health_status: document.getElementById('anm-status').value
      };

      const mockMappedData = {
        id: data.animal_tag,
        breed: data.breed,
        age: data.age,
        weight: data.weight,
        health_status: data.health_status,
        lastCheck: new Date().toISOString().split('T')[0]
      };

      const res = await window.animalService.addAnimal(data);

      if (res || window.mockData) {
        if (window.mockData && !res) {
          window.mockData.animals.push(mockMappedData);
          window.showToast('Animal added to local data successfully!', 'success');
        } else {
          window.showToast('Animal added successfully!', 'success');
        }
        document.getElementById('modal-container').innerHTML = '';

        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) {
          document.querySelector(`[data-view="${activeNav.dataset.view}"]`).click();
        }
      }
    } catch (error) {
      window.showToast(error.message || 'An error occurred while saving', 'error');
    } finally {
      if (document.getElementById('anm-submit')) {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.classList.remove('opacity-75', 'cursor-not-allowed');
      }
    }
  });
};

window.openEditProfileModal = async function () {
  const container = document.getElementById('modal-container');
  const profile = await window.userService.getProfile();

  container.innerHTML = `
    <div class="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 fade-in overflow-y-auto">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 m-4 relative">
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center space-x-3">
            <div class="bg-emerald-50 text-primary p-2 rounded-lg">
              <i data-lucide="user" class="w-6 h-6"></i>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-800 brand-font">Edit Profile</h2>
            </div>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML=''" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="profile-form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" id="prof-name" value="${profile.full_name}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" id="prof-phone" value="${profile.phone || ''}" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            <div class="md:col-span-2">
              <h3 class="font-bold text-gray-800 border-b border-gray-100 pb-2 mt-2">Farm Details</h3>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Farm Name</label>
              <input type="text" id="prof-farm" value="${profile.farm_name}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            <div class="col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Village/City</label>
              <input type="text" id="prof-village" value="${profile.village}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            <div class="col-span-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input type="text" id="prof-district" value="${profile.district}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input type="text" id="prof-state" value="${profile.state}" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
          </div>

          <div class="pt-5 flex justify-end space-x-3 border-t border-gray-100 mt-6">
            <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
            <button type="submit" id="prof-submit" class="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium shadow-md transition-all flex items-center">
              <i data-lucide="check-circle" class="w-4 h-4 mr-2"></i>
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('prof-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mr-2"></i> <span>Saving...</span>';
    btn.disabled = true;

    const data = {
      full_name: document.getElementById('prof-name').value,
      phone: document.getElementById('prof-phone').value,
      farm_name: document.getElementById('prof-farm').value,
      village: document.getElementById('prof-village').value,
      district: document.getElementById('prof-district').value,
      state: document.getElementById('prof-state').value
    };

    const res = await window.userService.updateProfile(data);

    if (res) {
      document.getElementById('modal-container').innerHTML = '';

      // Instantly update sidebar UI for a snappy feel
      const sidebarUser = document.getElementById('sidebar-user-name');
      const sidebarFarm = document.getElementById('sidebar-farm-name');
      if (sidebarUser) sidebarUser.textContent = data.full_name;
      if (sidebarFarm) sidebarFarm.textContent = data.farm_name;

      // Refresh the main container if we're on the profile view
      const activeNav = document.querySelector('.nav-item.active');
      if (activeNav && activeNav.dataset.view === 'profile') {
        activeNav.click(); // Triggers a fresh render
      }
    } else {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
};
