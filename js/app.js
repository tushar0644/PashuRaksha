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

async function renderProfile(container) {
  const profile = await window.userService.getProfile();
  const stats = await window.dashboardService.getDashboardStats();
  const animals = await window.animalService.getAnimals();
  const treatments = await window.treatmentService.getTreatments();

  // Update sidebar names to sync with profile
  const sidebarUser = document.getElementById('sidebar-user-name');
  const sidebarFarm = document.getElementById('sidebar-farm-name');
  if(sidebarUser) sidebarUser.textContent = profile.full_name;
  if(sidebarFarm) sidebarFarm.textContent = profile.farm_name;

  let activityHtml = treatments.slice(0, 3).map(t => `
    <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg mb-2 border border-gray-100">
      <div class="bg-primary text-white p-2 rounded-full"><i data-lucide="syringe" class="w-4 h-4"></i></div>
      <div>
        <p class="text-sm font-semibold text-gray-800">Treatment Logged for ${t.animals ? t.animals.animal_tag : t.animalId}</p>
        <p class="text-xs text-gray-500">${new Date(t.treatment_date || t.date).toLocaleDateString()} - ${t.medicines ? t.medicines.name : t.medicine}</p>
      </div>
    </div>
  `).join('');

  if(!activityHtml) activityHtml = '<p class="text-sm text-gray-500">No recent activity.</p>';

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
            <i data-lucide="edit-3" class="w-4 h-4 mr-2"></i> Edit Profile
          </button>
          <button onclick="window.authService.signOut()" class="px-5 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition-colors flex items-center">
            <i data-lucide="log-out" class="w-4 h-4 mr-2"></i> Logout
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
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Total Herd</p>
            </div>
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
              <div class="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-2">
                <i data-lucide="activity" class="w-5 h-5"></i>
              </div>
              <p class="text-2xl font-bold text-gray-800">${animals.filter(a => (a.health_status || a.status || '').toLowerCase() === 'healthy').length || 0}</p>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Healthy</p>
            </div>
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
              <div class="w-10 h-10 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mb-2">
                <i data-lucide="thermometer" class="w-5 h-5"></i>
              </div>
              <p class="text-2xl font-bold text-gray-800">${treatments.length || stats.activeTreatments || 0}</p>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Treated</p>
            </div>
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
              <div class="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
                <i data-lucide="shield" class="w-5 h-5"></i>
              </div>
              <p class="text-2xl font-bold text-gray-800">98%</p>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Compliance</p>
            </div>
            <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center sm:col-span-2">
              <h3 class="text-sm font-bold text-gray-800 mb-3 w-full text-left">Quick Actions</h3>
              <div class="flex space-x-2 w-full">
                <button onclick="document.querySelector('[data-view=\\'animals\\']').click(); window.openAddAnimalModal()" class="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200">Add Animal</button>
                <button onclick="window.openAddTreatmentModal()" class="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg text-sm font-medium shadow-sm transition-colors">Log Treatment</button>
              </div>
            </div>
          </div>

          <!-- Farm Summary -->
          <div class="glass-panel p-6 border border-gray-100">
            <h3 class="text-lg font-bold text-gray-800 brand-font mb-4 flex items-center">
              <i data-lucide="file-text" class="w-5 h-5 mr-2 text-primary"></i> Farm Summary
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
            <i data-lucide="clock" class="w-5 h-5 mr-2 text-gray-400"></i> Recent Activity
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
window.openAddTreatmentModal = async function(preselectedAnimalId = null) {
  const container = document.getElementById('modal-container');
  
  // Show loading state first
  container.innerHTML = `
    <div class="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 fade-in">
      <div class="bg-white rounded-2xl shadow-xl p-8 m-4 flex justify-center items-center">
        <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-primary"></i>
      </div>
    </div>
  `;
  if(window.lucide) window.lucide.createIcons();

  // Fetch data
  const animals = await window.animalService.getAnimals();
  const medicines = window.mockData ? window.mockData.medicines : [];

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
    if(window.lucide) window.lucide.createIcons();
    return;
  }

  let animalOptions = animals.map(a => `<option value="${a.id}" ${a.id === preselectedAnimalId || a.animal_tag === preselectedAnimalId ? 'selected' : ''}>${a.animal_tag || a.id} - ${a.breed}</option>`).join('');
  let medicineOptions = medicines.map(m => `<option value="${m.name}">${m.name} (${m.category})</option>`).join('');

  container.innerHTML = `
    <div class="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex justify-center items-start z-50 fade-in overflow-y-auto pt-10 pb-10">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 m-4 relative mt-10">
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center space-x-3">
            <div class="bg-emerald-50 text-primary p-2 rounded-lg">
              <i data-lucide="syringe" class="w-6 h-6"></i>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-800 brand-font">Log Treatment</h2>
              <p class="text-sm text-gray-500 mt-1">Record medicine, dosage, and start withdrawal tracking.</p>
            </div>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML=''" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="treatment-form" class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Select Animal <span class="text-red-500">*</span></label>
              <select id="trt-animal" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white">
                <option value="" disabled selected>Search or select an animal...</option>
                ${animalOptions}
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Disease / Condition</label>
              <input type="text" id="trt-disease" placeholder="e.g. Mastitis" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Medicine Name <span class="text-red-500">*</span></label>
              <select id="trt-medicine" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white">
                <option value="" disabled selected>Choose medicine</option>
                ${medicineOptions}
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Dosage <span class="text-red-500">*</span></label>
              <input type="text" id="trt-dosage" required placeholder="e.g. 15ml" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Route</label>
              <select id="trt-route" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white">
                <option value="Injection (IM)">Injection (IM)</option>
                <option value="Injection (SC)">Injection (SC)</option>
                <option value="Oral">Oral</option>
                <option value="Topical">Topical</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Date <span class="text-red-500">*</span></label>
              <input type="date" id="trt-start-date" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">End Date <span class="text-red-500">*</span></label>
              <input type="date" id="trt-end-date" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Prescribed By</label>
              <input type="text" id="trt-vet" placeholder="Dr. Name" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes / Instructions</label>
            <textarea id="trt-notes" rows="3" placeholder="Additional treatment notes..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"></textarea>
          </div>

          <div class="pt-5 flex justify-end space-x-3 border-t border-gray-100 mt-6">
            <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
            <button type="submit" id="trt-submit" class="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium shadow-md transition-all flex items-center hover:-translate-y-0.5">
              <i data-lucide="check-circle" class="w-4 h-4 mr-2"></i>
              <span>Save Treatment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  if(window.lucide) window.lucide.createIcons();
  
  // Set default dates
  const todayStr = formatDateForDB(new Date());
  document.getElementById('trt-start-date').value = todayStr;
  document.getElementById('trt-end-date').value = todayStr;

  // Handle form submission
  document.getElementById('treatment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const startDateVal = document.getElementById('trt-start-date').value;
    const endDateVal = document.getElementById('trt-end-date').value;
    
    const start_date = formatDateForDB(startDateVal);
    const end_date = formatDateForDB(endDateVal);
    
    if (!start_date || !end_date || new Date(start_date) > new Date(end_date)) {
      window.showToast('Invalid date range. End date must be after start date.', 'error');
      return;
    }

    const btn = document.getElementById('trt-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mr-2"></i> <span>Saving...</span>';
    btn.disabled = true;
    btn.classList.add('opacity-75', 'cursor-not-allowed');
    if(window.lucide) window.lucide.createIcons();

    const selectedMedicine = document.getElementById('trt-medicine').value;
    const medInfo = medicines.find(m => m.name === selectedMedicine);
    let withdrawal_end_date = end_date;
    
    if (medInfo && medInfo.withdrawalMilk) {
      const wDate = new Date(end_date);
      wDate.setDate(wDate.getDate() + medInfo.withdrawalMilk);
      withdrawal_end_date = formatDateForDB(wDate);
    }

    // Map data to schema
    const data = {
      animalId: document.getElementById('trt-animal').options[document.getElementById('trt-animal').selectedIndex].text.split(' - ')[0],
      medicine: selectedMedicine,
      disease: document.getElementById('trt-disease').value,
      dose: document.getElementById('trt-dosage').value,
      route: document.getElementById('trt-route').value,
      start_date: start_date,
      end_date: end_date,
      withdrawal_end_date: withdrawal_end_date,
      treatment_date: start_date, // For backward compatibility with existing views
      vet: document.getElementById('trt-vet').value,
      notes: document.getElementById('trt-notes').value
    };

    // Use Supabase Service if active, otherwise fallback inside the service handles mockData insertion
    const res = await window.treatmentService.addTreatment(data); 
    
    if (res || window.mockData) {
      if(window.mockData && !res) {
          window.mockData.treatments.unshift(data);
      }
      document.getElementById('modal-container').innerHTML = '';
      
      // Navigate to treatments view to refresh UI and Dashboard calculations
      const activeNav = document.querySelector('.nav-item.active').dataset.view;
      document.querySelector(`[data-view="${activeNav}"]`).click(); // Reload current view
      
      // We don't need to manually show toast here because addTreatment service handles it
    } else {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.classList.remove('opacity-75', 'cursor-not-allowed');
    }
  });
};

window.openAddAnimalModal = function() {
  const container = document.getElementById('modal-container');
  
  container.innerHTML = `
    <div class="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex justify-center items-start z-50 fade-in overflow-y-auto pt-10 pb-10">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 m-4 relative mt-10">
        <div class="flex justify-between items-center mb-6">
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
              <input type="text" id="anm-id" required placeholder="e.g. TAG-106" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <input type="text" id="anm-breed" placeholder="e.g. Holstein" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="text" id="anm-age" placeholder="e.g. 2 years" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Weight</label>
              <input type="text" id="anm-weight" placeholder="e.g. 500kg" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Health Status</label>
            <select id="anm-status" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all bg-gray-50 focus:bg-white">
              <option value="healthy">Healthy</option>
              <option value="observation">Observation</option>
              <option value="under_treatment">Under Treatment</option>
            </select>
          </div>

          <div class="pt-5 flex justify-end space-x-3 border-t border-gray-100 mt-6">
            <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium transition-colors">Cancel</button>
            <button type="submit" id="anm-submit" class="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium shadow-md transition-all flex items-center hover:-translate-y-0.5">
              <i data-lucide="check-circle" class="w-4 h-4 mr-2"></i>
              <span>Register Animal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  if(window.lucide) window.lucide.createIcons();

  document.getElementById('animal-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('anm-submit');
    const originalText = btn.innerHTML;
    
    try {
      btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin mr-2"></i> <span>Saving...</span>';
      btn.disabled = true;
      btn.classList.add('opacity-75', 'cursor-not-allowed');
      if(window.lucide) window.lucide.createIcons();

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
        if(window.mockData && !res) {
            window.mockData.animals.push(mockMappedData);
            window.showToast('Animal added to local data successfully!', 'success');
        } else {
            window.showToast('Animal added successfully!', 'success');
        }
        document.getElementById('modal-container').innerHTML = '';
        
        const activeNav = document.querySelector('.nav-item.active');
        if(activeNav) {
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

window.openEditProfileModal = async function() {
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
  
  if(window.lucide) window.lucide.createIcons();

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
      if(sidebarUser) sidebarUser.textContent = data.full_name;
      if(sidebarFarm) sidebarFarm.textContent = data.farm_name;

      // Refresh the main container if we're on the profile view
      const activeNav = document.querySelector('.nav-item.active');
      if(activeNav && activeNav.dataset.view === 'profile') {
        activeNav.click(); // Triggers a fresh render
      }
    } else {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });
};
