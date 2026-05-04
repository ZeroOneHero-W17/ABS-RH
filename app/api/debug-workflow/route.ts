import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Absence from '@/models/Absence';
import { sendEmail } from '@/lib/email';
import { generateAbsencePDF } from '@/lib/pdf';

export async function GET() {
  const steps: string[] = [];
  
  try {
    // 1. Connexion DB
    steps.push('1. Connexion à la base de données...');
    await dbConnect();
    steps.push('   ✅ DB connectée');

    // 2. Chercher une demande récente
    steps.push('2. Recherche d\'une demande d\'absence...');
    const absence = await Absence.findOne().sort({ createdAt: -1 });
    
    if (!absence) {
      return NextResponse.json({ success: false, steps, error: 'Aucune demande trouvée en base' });
    }
    
    steps.push(`   ✅ Demande trouvée: ${absence.matricule}`);
    steps.push(`   Email employé: ${absence.employee?.email}`);
    steps.push(`   Statut: ${absence.status}`);

    // 3. Convertir en objet
    steps.push('3. Conversion en objet plain...');
    const absenceData = absence.toObject ? absence.toObject() : JSON.parse(JSON.stringify(absence));
    steps.push(`   ✅ Converti. Clés: ${Object.keys(absenceData).join(', ')}`);
    steps.push(`   employee: ${JSON.stringify(absenceData.employee)}`);
    steps.push(`   absence: ${JSON.stringify(absenceData.absence)}`);

    // 4. Générer le PDF
    steps.push('4. Génération du PDF...');
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateAbsencePDF(absenceData);
      steps.push(`   ✅ PDF généré: ${pdfBuffer.length} bytes`);
    } catch (pdfError: any) {
      steps.push(`   ❌ ERREUR PDF: ${pdfError.message}`);
      steps.push(`   Stack: ${pdfError.stack}`);
      return NextResponse.json({ success: false, steps, error: `PDF: ${pdfError.message}` });
    }

    // 5. Envoyer l'email (à soi-même pour test)
    steps.push('5. Envoi de l\'email avec PDF en pièce jointe...');
    steps.push(`   Destinataire: ${process.env.SMTP_USER} (test)`);
    try {
      const info = await sendEmail(
        process.env.SMTP_USER!, // envoyer à soi-même pour tester
        'DIAGNOSTIC - Test workflow complet',
        `<h2>Test du workflow complet</h2>
         <p>Demande: ${absence.matricule}</p>
         <p>Le PDF est en pièce jointe.</p>`,
        [{
          filename: `Absence_${absence.matricule}.pdf`,
          content: pdfBuffer,
        }]
      );
      steps.push(`   ✅ Email envoyé ! MessageID: ${info.messageId}`);
    } catch (emailError: any) {
      steps.push(`   ❌ ERREUR EMAIL: ${emailError.message}`);
      steps.push(`   Code: ${emailError.code}`);
      return NextResponse.json({ success: false, steps, error: `Email: ${emailError.message}` });
    }

    return NextResponse.json({ success: true, steps });

  } catch (error: any) {
    steps.push(`❌ ERREUR GLOBALE: ${error.message}`);
    steps.push(`Stack: ${error.stack}`);
    return NextResponse.json({ success: false, steps, error: error.message });
  }
}
