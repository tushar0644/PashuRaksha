const mockData = {
  animals: [
    { id: 'TAG-101', breed: 'Holstein Friesian', gender: 'Female', age: '3 years', weight: '650kg', status: 'Healthy', lastCheck: '2026-04-10' },
    { id: 'TAG-102', breed: 'Jersey', gender: 'Female', age: '2.5 years', weight: '450kg', status: 'Under Treatment', lastCheck: '2026-04-18' },
    { id: 'TAG-103', breed: 'Murrah Buffalo', gender: 'Female', age: '4 years', weight: '700kg', status: 'Healthy', lastCheck: '2026-04-12' },
    { id: 'TAG-104', breed: 'Gir', gender: 'Female', age: '3.2 years', weight: '520kg', status: 'Observation', lastCheck: '2026-04-15' },
    { id: 'TAG-105', breed: 'Holstein Friesian', gender: 'Female', age: '5 years', weight: '680kg', status: 'Healthy', lastCheck: '2026-04-05' }
  ],
  
  medicines: [
    { id: 'MED-01', name: 'Oxytetracycline (LA)', category: 'Antibiotic', route: 'IM', withdrawalMilk: 7, withdrawalMeat: 28, residueLimit: '100 µg/kg' },
    { id: 'MED-02', name: 'Amoxicillin', category: 'Antibiotic', route: 'IM', withdrawalMilk: 4, withdrawalMeat: 14, residueLimit: '4 µg/kg' },
    { id: 'MED-03', name: 'Ivermectin', category: 'Dewormer', route: 'SC', withdrawalMilk: 28, withdrawalMeat: 35, residueLimit: '10 µg/kg' },
    { id: 'MED-04', name: 'Meloxicam', category: 'Pain Relief', route: 'IM', withdrawalMilk: 5, withdrawalMeat: 15, residueLimit: '15 µg/kg' },
    { id: 'MED-05', name: 'FMD Vaccine', category: 'Vaccine', route: 'SC', withdrawalMilk: 0, withdrawalMeat: 0, residueLimit: 'N/A' }
  ],

  diseases: [
    { id: 'DIS-01', name: 'Mastitis', symptoms: 'Swollen udder, abnormal milk, fever' },
    { id: 'DIS-02', name: 'Lameness', symptoms: 'Limping, reluctant to stand, swollen joints' },
    { id: 'DIS-03', name: 'Respiratory Infection', symptoms: 'Coughing, nasal discharge, rapid breathing' },
    { id: 'DIS-04', name: 'FMD', symptoms: 'Blisters in mouth and hooves, drooling' },
    { id: 'DIS-05', name: 'Preventive', symptoms: 'Routine vaccination or deworming' }
  ],

  treatments: [
    { id: 'TRT-1001', animalId: 'TAG-102', medicine: 'Oxytetracycline (LA)', date: '2026-04-15', dose: '20ml', vet: 'Dr. Sharma', disease: 'Mastitis' },
    { id: 'TRT-1002', animalId: 'TAG-104', medicine: 'Meloxicam', date: '2026-04-16', dose: '15ml', vet: 'Dr. Sharma', disease: 'Lameness' },
    { id: 'TRT-1003', animalId: 'TAG-101', medicine: 'FMD Vaccine', date: '2026-04-01', dose: '2ml', vet: 'Dr. Verma', disease: 'Preventive' },
    { id: 'TRT-1004', animalId: 'TAG-105', medicine: 'Amoxicillin', date: '2026-03-25', dose: '10ml', vet: 'Dr. Sharma', disease: 'Respiratory Infection' }
  ],

  amuStats: {
    monthly: [
      { month: 'Nov', antibiotics: 120, vaccines: 200, dewormers: 50 },
      { month: 'Dec', antibiotics: 150, vaccines: 50, dewormers: 80 },
      { month: 'Jan', antibiotics: 180, vaccines: 100, dewormers: 40 },
      { month: 'Feb', antibiotics: 130, vaccines: 250, dewormers: 60 },
      { month: 'Mar', antibiotics: 90, vaccines: 80, dewormers: 120 },
      { month: 'Apr', antibiotics: 110, vaccines: 150, dewormers: 30 }
    ],
    topDiseases: [
      { name: 'Mastitis', count: 45 },
      { name: 'FMD Prevention', count: 35 },
      { name: 'Respiratory', count: 25 },
      { name: 'Lameness', count: 15 }
    ]
  }
};

// Utility functions for MRL calculation
function calculateWithdrawal(treatmentDate, withdrawalDays) {
  const date = new Date(treatmentDate);
  date.setDate(date.getDate() + withdrawalDays);
  return date;
}

function getMRLStatus(treatmentDate, withdrawalDays) {
  if (withdrawalDays === 0) return { status: 'Safe', color: 'safe', remaining: 0 };
  
  const end = calculateWithdrawal(treatmentDate, withdrawalDays);
  const now = new Date(); // Use current real time or mocked "today"
  
  // For demo, let's assume today is '2026-04-19'
  const today = new Date('2026-04-19T00:00:00');
  
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return { status: 'Safe', color: 'safe', remaining: 0 };
  if (diffDays <= 2) return { status: 'Warning', color: 'warning', remaining: diffDays };
  return { status: 'Restricted', color: 'danger', remaining: diffDays };
}

function normalizeCategory(cat) {
  if (!cat) return 'Other';
  const c = cat.toLowerCase().trim();
  const map = {
    'vaccine': 'Vaccine',
    'antibiotic': 'Antibiotic',
    'pain relief': 'Pain Relief',
    'anti-inflammatory': 'Pain Relief',
    'dewormer': 'Dewormer',
    'antiparasitic': 'Antiparasitic'
  };
  return map[c] || cat.charAt(0).toUpperCase() + cat.slice(1);
}
