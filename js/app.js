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
      title: 'Reports & Analytics',
      subtitle: 'Export data for audits and compliance.',
      render: renderReports
    }
  };

  async function switchView(viewName) {
    // Update active nav
    navItems.forEach(item => {
      item.classList.remove('active', 'bg-emerald-50', 'text-primary-dark');
      if(item.dataset.view === viewName) {
        item.classList.add('active');
      }
    });

    // Update Headers
    const viewMeta = views[viewName];
    if(viewMeta) {
      pageTitle.textContent = viewMeta.title;
      pageSubtitle.textContent = viewMeta.subtitle;
      
      // Clear container with fade out
      viewContainer.innerHTML = '<div class="flex justify-center p-12"><i data-lucide="loader-2" class="w-8 h-8 animate-spin text-primary"></i></div>';
      if(window.lucide) window.lucide.createIcons();
      viewContainer.className = 'pb-20 fade-in'; // trigger animation
      
      // Render Content
      await viewMeta.render(viewContainer);
      
      // Re-initialize icons for newly added HTML
      if(window.lucide) {
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
      
      // Close mobile sidebar on click
      if(window.innerWidth < 768 && sidebar) {
        sidebar.classList.add('hidden');
      }
    });
  });

  // Load default view
  switchView('dashboard');
});

// --- View Renderers ---

async function renderDashboard(container) {
  // Fetch real stats from Supabase
  const stats = await window.dashboardService.getDashboardStats();
  const treatments = await window.treatmentService.getTreatments();
  
  const activeTreatments = treatments.length || stats.activeTreatments;
  const totalAnimals = stats.totalAnimals || mockData.animals.length; // fallback
  
  let restrictedCount = 0;
  treatments.forEach(t => {
    // Fallback logic for demo
    const medName = t.medicines ? t.medicines.name : t.medicine;
    const med = mockData.medicines.find(m => m.name === medName);
    if(med) {
      const status = getMRLStatus(t.treatment_date || t.date, med.withdrawalMilk);
      if(status.status === 'Restricted') restrictedCount++;
    }
  });

  const html = `
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="glass-panel p-6 hover-card stagger-1 border-l-4 border-l-blue-500">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500 font-medium">Total Animals</p>
            <h3 class="text-3xl font-bold text-gray-800 mt-1">${totalAnimals}</h3>
          </div>
          <div class="bg-blue-50 p-2 rounded-lg text-blue-500"><i data-lucide="paw-print"></i></div>
        </div>
        <p class="text-xs text-green-600 mt-4 flex items-center"><i data-lucide="trending-up" class="w-3 h-3 mr-1"></i> +2 this month</p>
      </div>
      
      <div class="glass-panel p-6 hover-card stagger-2 border-l-4 border-l-purple-500">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500 font-medium">Active Treatments</p>
            <h3 class="text-3xl font-bold text-gray-800 mt-1">${activeTreatments}</h3>
          </div>
          <div class="bg-purple-50 p-2 rounded-lg text-purple-500"><i data-lucide="activity"></i></div>
        </div>
      </div>

      <div class="glass-panel p-6 hover-card stagger-3 border-l-4 border-l-red-500">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500 font-medium">MRL Restricted</p>
            <h3 class="text-3xl font-bold text-gray-800 mt-1">${restrictedCount}</h3>
          </div>
          <div class="bg-red-50 p-2 rounded-lg text-red-500"><i data-lucide="alert-triangle"></i></div>
        </div>
        <p class="text-xs text-red-500 mt-4 flex items-center font-medium">Milk/Meat withheld</p>
      </div>

      <div class="glass-panel p-6 hover-card stagger-4 border-l-4 border-l-primary">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm text-gray-500 font-medium">AMU Index</p>
            <h3 class="text-3xl font-bold text-gray-800 mt-1">Safe</h3>
          </div>
          <div class="bg-emerald-50 p-2 rounded-lg text-primary"><i data-lucide="shield-check"></i></div>
        </div>
        <p class="text-xs text-gray-500 mt-4 flex items-center">Below resistance threshold</p>
      </div>
    </div>

    <!-- Charts Area -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 glass-panel p-6 slide-up">
        <h3 class="text-lg font-bold text-gray-800 mb-4 brand-font">Antimicrobial Usage (AMU) Trends</h3>
        <div class="relative h-72 w-full">
          <canvas id="amuChart"></canvas>
        </div>
      </div>
      
      <div class="glass-panel p-6 slide-up" style="animation-delay: 0.2s">
        <h3 class="text-lg font-bold text-gray-800 mb-4 brand-font">Active MRL Alerts</h3>
        <div class="space-y-4" id="dashboard-alerts">
          <!-- Alerts generated via JS -->
        </div>
        <button class="w-full mt-6 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors" onclick="document.querySelector('[data-view=\\'mrl\\']').click()">View All Restrictions</button>
      </div>
    </div>
  `;
  
  container.innerHTML = html;

  // Render Alerts
  const alertsContainer = document.getElementById('dashboard-alerts');
  let alertHtml = '';
  treatments.forEach(t => {
    const medName = t.medicines ? t.medicines.name : t.medicine;
    const med = mockData.medicines.find(m => m.name === medName);
    if(med) {
      const dateStr = t.treatment_date || t.date;
      const status = getMRLStatus(dateStr, med.withdrawalMilk);
      if(status.status !== 'Safe') {
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
  if(!alertHtml) alertHtml = '<p class="text-sm text-gray-500">No active restrictions. All products safe for release.</p>';
  alertsContainer.innerHTML = alertHtml;

  // Render Chart
  const ctx = document.getElementById('amuChart').getContext('2d');
  const labels = mockData.amuStats.monthly.map(d => d.month);
  const antibiotics = mockData.amuStats.monthly.map(d => d.antibiotics);
  const vaccines = mockData.amuStats.monthly.map(d => d.vaccines);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Antibiotics (Doses)',
          data: antibiotics,
          backgroundColor: '#ef4444', // Red 500
          borderRadius: 4
        },
        {
          label: 'Vaccines (Doses)',
          data: vaccines,
          backgroundColor: '#10b981', // Emerald 500
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [2, 4], color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    }
  });
}

async function renderAnimals(container) {
  const animals = await window.animalService.getAnimals();

  let rows = animals.map(a => `
    <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td class="py-4 px-6 font-medium text-gray-900">${a.animal_tag || a.id}</td>
      <td class="py-4 px-6 text-gray-600">${a.breed}</td>
      <td class="py-4 px-6 text-gray-600">${a.age || a.weight}</td>
      <td class="py-4 px-6">
        <span class="status-pill ${a.status === 'Healthy' ? 'status-safe' : (a.status === 'Observation' ? 'status-warning' : 'status-danger')}">
          ${a.status || 'Healthy'}
        </span>
      </td>
      <td class="py-4 px-6 text-gray-500 text-sm">${a.lastCheck || new Date(a.created_at).toLocaleDateString() || 'N/A'}</td>
      <td class="py-4 px-6 text-right">
        <button class="text-primary hover:text-primary-dark font-medium text-sm" onclick="window.showToast('Edit mode coming soon', 'warning')">Edit</button>
        <button class="text-red-500 hover:text-red-700 font-medium text-sm ml-2" onclick="window.animalService.deleteAnimal('${a.id}').then(() => window.location.reload())">Delete</button>
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="glass-panel overflow-hidden slide-up">
      <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
        <h3 class="text-lg font-bold text-gray-800 brand-font">Herd Overview</h3>
        <div class="relative">
          <i data-lucide="search" class="absolute left-3 top-2.5 w-4 h-4 text-gray-400"></i>
          <input type="text" placeholder="Search by Tag ID..." class="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
        </div>
      </div>
      <div class="overflow-x-auto">
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
    </div>
  `;
}

async function renderTreatments(container) {
  const treatments = await window.treatmentService.getTreatments();

  let rows = treatments.map(t => {
    const date = t.treatment_date ? new Date(t.treatment_date).toLocaleDateString() : t.date;
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

  container.innerHTML = `
    <div class="glass-panel overflow-hidden slide-up">
      <div class="p-6 border-b border-gray-100 bg-white">
        <h3 class="text-lg font-bold text-gray-800 brand-font">Recent Treatments</h3>
      </div>
      <div class="overflow-x-auto">
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
    </div>
  `;
}

async function renderMRL(container) {
  const treatments = await window.treatmentService.getTreatments();
  
  let rows = treatments.map(t => {
    const medName = t.medicines ? t.medicines.name : t.medicine;
    const med = mockData.medicines.find(m => m.name === medName);
    if(!med) return '';
    
    const dateStr = t.treatment_date || t.date;
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
      <div class="overflow-x-auto">
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
    </div>
  `;
}

function renderReports(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 slide-up">
      <div class="glass-panel p-8 text-center hover-card cursor-pointer border border-gray-100">
        <div class="w-16 h-16 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <i data-lucide="file-check-2" class="w-8 h-8"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-800 brand-font">Compliance Audit Report</h3>
        <p class="text-gray-500 text-sm mt-2 mb-6">Generate full MRL and AMU logs for regulatory inspectors and buyers.</p>
        <button class="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Download PDF</button>
      </div>

      <div class="glass-panel p-8 text-center hover-card cursor-pointer border border-gray-100">
        <div class="w-16 h-16 mx-auto bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
          <i data-lucide="qr-code" class="w-8 h-8"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-800 brand-font">Safe Batch QR Badge</h3>
        <p class="text-gray-500 text-sm mt-2 mb-6">Generate traceability QR codes to prove milk/meat safety to buyers.</p>
        <button class="px-6 py-2 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors">Generate QR</button>
      </div>
    </div>
  `;
}

// Global modal function
window.openAddTreatmentModal = function() {
  alert('In a real app, this would open a dynamic form to log medicine, dosage, and auto-start the withdrawal timer.');
};
