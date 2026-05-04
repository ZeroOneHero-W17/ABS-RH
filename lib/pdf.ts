import PDFDocument from 'pdfkit';

const formatDate = (date: any) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export async function generateAbsencePDF(absence: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Utiliser les fonts intégrées de PDFKit directement (pas de fichiers externes)
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        font: 'Helvetica', // Force la font intégrée dès l'initialisation
        bufferPages: true,
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));

      // ── HEADER ──────────────────────────────────────────
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e3a8a')
        .text('DOUALAIR', { align: 'center' });

      doc.fontSize(10).font('Helvetica').fillColor('#64748b')
        .text('AUTORISATION D\'ABSENCE — DOCUMENT OFFICIEL', { align: 'center' });

      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.5);

      doc.fontSize(9).fillColor('#1e3a8a')
        .text(`Matricule: ${absence.matricule} | Genere: ${formatDate(new Date())}`, { align: 'center' });

      doc.moveDown(1);

      // ── SECTION 1: DEMANDEUR ─────────────────────────────
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('1. INFORMATIONS DU DEMANDEUR');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.3);

      doc.fontSize(10).font('Helvetica').fillColor('#0f172a');
      doc.text(`Nom: ${absence.employee.name} ${absence.employee.firstName}`);
      doc.text(`Service: ${absence.employee.service || 'N/A'}`);
      doc.text(`Fonction: ${absence.employee.function || 'N/A'}`);
      doc.text(`Email: ${absence.employee.email}`);

      doc.moveDown(0.5);

      // ── SECTION 2: DÉTAILS ───────────────────────────────
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('2. DETAILS DE LA DEMANDE');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.3);

      const startDate = formatDate(absence.absence.startDate);
      const endDate = formatDate(absence.absence.endDate);

      doc.fontSize(10).font('Helvetica').fillColor('#0f172a');
      doc.text(`Type: ${absence.absence.type || 'N/A'}`);
      doc.text(`Motif: ${absence.absence.reason || 'Non precise'}`);
      doc.text(`Debut: ${startDate} ${absence.absence.startTime ? `a ${absence.absence.startTime}` : ''}`);
      doc.text(`Fin: ${endDate} ${absence.absence.endTime ? `a ${absence.absence.endTime}` : ''}`);

      doc.moveDown(0.5);

      // ── SECTION 3: APPROBATIONS ──────────────────────────
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('3. CHAINE D\'APPROBATION');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.3);

      const approvals = [];
      if (absence.requesterType === 'chef_service') {
        approvals.push({
          role: 'Direction Generale',
          status: absence.dgApproval?.status === 'approved' ? 'ACCORDE' : absence.dgApproval?.status === 'rejected' ? 'REJETE' : 'EN ATTENTE',
          statusSymbol: absence.dgApproval?.status === 'approved' ? '[OK]' : absence.dgApproval?.status === 'rejected' ? '[X]' : '[--]',
          date: absence.dgApproval?.date ? formatDate(absence.dgApproval.date) : '--'
        });
      } else {
        approvals.push({
          role: 'Chef de Service',
          status: absence.chefApproval?.status === 'approved' ? 'ACCORDE' : absence.chefApproval?.status === 'rejected' ? 'REJETE' : 'EN ATTENTE',
          statusSymbol: absence.chefApproval?.status === 'approved' ? '[OK]' : absence.chefApproval?.status === 'rejected' ? '[X]' : '[--]',
          date: absence.chefApproval?.date ? formatDate(absence.chefApproval.date) : '--'
        });
      }

      approvals.push({
        role: 'Ressources Humaines',
        status: absence.status === 'approved' ? 'ACCORDE' : absence.status === 'rejected' ? 'REJETE' : 'EN ATTENTE',
        statusSymbol: absence.status === 'approved' ? '[OK]' : absence.status === 'rejected' ? '[X]' : '[--]',
        date: absence.rhOpinion?.date ? formatDate(absence.rhOpinion.date) : '--'
      });

      doc.fontSize(9).font('Helvetica');
      approvals.forEach((app) => {
        const statusColor = app.status === 'ACCORDE' ? '#16a34a' : app.status === 'REJETE' ? '#dc2626' : '#64748b';
        
        doc.fillColor('#0f172a').text(`${app.role}: `, { continued: true });
        doc.fillColor(statusColor).font('Helvetica-Bold').text(`${app.statusSymbol} ${app.status}`);
        doc.fillColor('#64748b').font('Helvetica').text(`  Date: ${app.date}`);
        doc.moveDown(0.2);
      });

      doc.moveDown(0.5);

      // ── SECTION 4: DÉCISION ──────────────────────────────
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('4. DECISION FINALE');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.3);

      const decisionColor = absence.status === 'approved' ? '#16a34a' : absence.status === 'rejected' ? '#dc2626' : '#d97706';
      const decisionLabel = absence.status === 'approved' ? 'DEMANDE APPROUVEE' : absence.status === 'rejected' ? 'DEMANDE REJETEE' : 'EN ATTENTE';

      doc.fontSize(14).font('Helvetica-Bold').fillColor(decisionColor)
        .text(decisionLabel, { align: 'center' });

      if (absence.rhOpinion?.comment) {
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').fillColor('#475569')
          .text(`Commentaire RH: ${absence.rhOpinion.comment}`, { align: 'center' });
      }

      doc.moveDown(2);

      // ── FOOTER ───────────────────────────────────────────
      doc.fontSize(7).fillColor('#94a3b8')
        .text('Document genere automatiquement par le Systeme de Gestion des Absences -- DOUALAIR', {
          align: 'center',
          width: 500,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
