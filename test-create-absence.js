// Test de création d'absence avec API
const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');

async function testCreateAbsence() {
  console.log('🟡 Création d\'une demande d\'absence via API...\n');
  
  const formData = new FormData();
  formData.append('name', 'Dupont');
  formData.append('firstName', 'Jean');
  formData.append('email', 'testuser@gmail.com');  // Adresse différente
  formData.append('service', 'Informatique');
  formData.append('function', 'Développeur');
  formData.append('requesterType', 'employee');
  formData.append('type', 'Congé');
  formData.append('reason', 'Vacances familiales');
  formData.append('startDate', '2026-05-01');
  formData.append('endDate', '2026-05-10');
  formData.append('startTime', '08:00');
  formData.append('endTime', '17:00');

  try {
    console.log('📤 POST vers http://localhost:3001/api/absences\n');
    const response = await fetch('http://localhost:3001/api/absences', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Réponse:`, JSON.stringify(data, null, 2));

    if (response.ok && data.matricule) {
      console.log(`\n Demande créée: ${data.matricule}`);
      console.log(' Un email de confirmation devrait avoir été envoyé à testuser@gmail.com');
    } else {
      console.log('\n❌ Erreur lors de la création');
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message);
  }
}

testCreateAbsence();
