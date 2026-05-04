const PDFDocument = require('pdfkit');
const fs = require('fs');

async function generateAbsencePDF(absence) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    doc.fontSize(20).text('DOUALAIR TEST', { align: 'center' });
    doc.fontSize(12).text(`Matricule: ${absence.matricule}`);
    doc.text(`Employé: ${absence.employee.name} ${absence.employee.firstName}`);
    doc.text(`Status: ${absence.status}`);
    doc.end();
  });
}

async function test() {
  const absence = {
    matricule: 'ABS-TEST-001',
    employee: { name: 'Test', firstName: 'User' },
    status: 'approved'
  };

  try {
    const buffer = await generateAbsencePDF(absence);
    console.log('PDF generated, size:', buffer.length);
    fs.writeFileSync('test-standalone.pdf', buffer);
    console.log('Saved to test-standalone.pdf');
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
