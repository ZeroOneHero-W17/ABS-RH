import PDFDocument from 'pdfkit';
import path from 'path';

export async function generateAbsencePDF(absence: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    try {
      // Enregistrer les fonts avec les fichiers .afm du répertoire public
      const fontDir = path.join(process.cwd(), 'public', 'fonts');
      try {
        doc.registerFont('Helvetica-Bold', path.join(fontDir, 'Helvetica-Bold.afm'));
        doc.registerFont('Helvetica', path.join(fontDir, 'Helvetica.afm'));
      } catch (fontError) {
        console.warn('[PDF] Impossible de charger les fonts personnalisées, utilisation des fonts système');
        // Les fonts système seront utilisées en cas d'erreur
      }

      // ── HEADER ──────────────────────────────────────────
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e3a8a')
        .text('DOUALAIR', { align: 'center' });

      doc.fontSize(10).font('Helvetica').fillColor('#64748b')
        .text('AUTORISATION D\'ABSENCE — DOCUMENT OFFICIEL', { align: 'center' });

      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.3);

      doc.fontSize(9).fillColor('#1e3a8a')
        .text(`Matricule: ${absence.matricule} | Généré: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });

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
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('2. DÉTAILS DE LA DEMANDE');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.3);

      doc.fontSize(10).font('Helvetica').fillColor('#0f172a');
      const startDate = new Date(absence.absence.startDate).toLocaleDateString('fr-FR');
      const endDate = new Date(absence.absence.endDate).toLocaleDateString('fr-FR');

      doc.text(`Type: ${absence.absence.type || 'N/A'}`);
      doc.text(`Motif: ${absence.absence.reason || 'Non précisé'}`);
      doc.text(`Début: ${startDate}`);
      doc.text(`Fin: ${endDate}`);

      doc.moveDown(0.5);

      // ── SECTION 3: APPROBATIONS ──────────────────────────
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('3. CHAÎNE D\'APPROBATION');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.3);

      const approvals = [];
      if (absence.requesterType === 'chef_service') {
        approvals.push({
          role: 'Direction Générale',
          status: absence.dgApproval?.status === 'approved' ? '✓ ACCORDÉ' : absence.dgApproval?.status === 'rejected' ? '✗ REJETÉ' : '— EN ATTENTE',
          date: absence.dgApproval?.date ? new Date(absence.dgApproval.date).toLocaleDateString('fr-FR') : '—'
        });
      } else {
        approvals.push({
          role: 'Chef de Service',
          status: absence.chefApproval?.status === 'approved' ? '✓ ACCORDÉ' : absence.chefApproval?.status === 'rejected' ? '✗ REJETÉ' : '— EN ATTENTE',
          date: absence.chefApproval?.date ? new Date(absence.chefApproval.date).toLocaleDateString('fr-FR') : '—'
        });
      }

      approvals.push({
        role: 'Ressources Humaines',
        status: absence.status === 'approved' ? '✓ ACCORDÉ' : absence.status === 'rejected' ? '✗ REJETÉ' : '— EN ATTENTE',
        date: absence.rhOpinion?.date ? new Date(absence.rhOpinion.date).toLocaleDateString('fr-FR') : '—'
      });

      doc.fontSize(9).font('Helvetica');
      approvals.forEach((app, idx) => {
        const y = doc.y;
        const statusColor = app.status.includes('✓') ? '#16a34a' : app.status.includes('✗') ? '#dc2626' : '#64748b';
        
        doc.fillColor('#0f172a').text(`${app.role}:`, { continued: true });
        doc.fillColor(statusColor).font('Helvetica-Bold').text(`  ${app.status}`);
        doc.fillColor('#64748b').font('Helvetica').text(`  Date: ${app.date}`);
        doc.moveDown(0.2);
      });

      doc.moveDown(0.5);

      // ── SECTION 4: DÉCISION ──────────────────────────────
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af').text('4. DÉCISION FINALE');
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#e2e8f0');
      doc.moveDown(0.3);

      const decisionColor = absence.status === 'approved' ? '#16a34a' : absence.status === 'rejected' ? '#dc2626' : '#d97706';
      const decisionLabel = absence.status === 'approved' ? 'APPROUVÉE ✓' : absence.status === 'rejected' ? 'REJETÉE ✗' : 'EN ATTENTE';

      doc.fontSize(14).font('Helvetica-Bold').fillColor(decisionColor)
        .text(`DEMANDE ${decisionLabel}`, { align: 'center' });

      if (absence.rhOpinion?.comment) {
        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica').fillColor('#475569')
          .text(`Commentaire RH: ${absence.rhOpinion.comment}`, { align: 'center' });
      }

      doc.moveDown(2);

      // ── FOOTER ───────────────────────────────────────────
      doc.fontSize(7).fillColor('#94a3b8')
        .text('Document généré automatiquement par le Système de Gestion des Absences — DOUALAIR', {
          align: 'center',
          width: 500,
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
