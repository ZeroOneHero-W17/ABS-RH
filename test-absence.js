const fs = require('fs');

async function testAbsenceSubmission() {
  try {
    console.log('🧪 Testing absence submission API...\n');
    
    const formData = new FormData();
    formData.append('name', 'Dupont');
    formData.append('firstName', 'Jean');
    formData.append('email', 'jeanlouisnchare@gmail.com');
    formData.append('service', 'Informatique');
    formData.append('function', 'Developer');
    formData.append('requesterType', 'employee');
    formData.append('type', 'Congés');
    formData.append('reason', 'Vacances familiales');
    formData.append('startDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    formData.append('endDate', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    
    const response = await fetch('http://localhost:3000/api/absences', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    console.log('✓ Submission response:', data);
    
    if (response.ok && data.matricule) {
      console.log('\n✅ Absence submitted with matricule:', data.matricule);
      console.log('📧 Check your email for confirmation!');
    } else {
      console.log('\n❌ Submission failed:', data.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAbsenceSubmission();
