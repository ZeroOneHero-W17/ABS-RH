const { generateAbsencePDF } = require('./lib/pdf');
const fs = require('fs');

async function test() {
  const absence = {
    matricule: 'ABS-TEST-001',
    employee: {
      name: 'Test',
      firstName: 'User',
      email: 'test@example.com',
      service: 'Informatique',
      function: 'Dev'
    },
    requesterType: 'employee',
    absence: {
      type: 'Congé',
      reason: 'Repos',
      startDate: new Date(),
      endDate: new Date(),
      startTime: '08:00',
      endTime: '17:00'
    },
    status: 'approved',
    chefApproval: {
      status: 'approved',
      comment: 'Ok',
      date: new Date()
    },
    rhOpinion: {
      comment: 'Final OK',
      date: new Date()
    }
  };

  try {
    const buffer = await generateAbsencePDF(absence);
    console.log('PDF generated, size:', buffer.length);
    fs.writeFileSync('test-absence.pdf', buffer);
    console.log('Saved to test-absence.pdf');
  } catch (err) {
    console.error('Error generating PDF:', err);
  }
}

test();
