import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Absence from '@/models/Absence';
import { sendEmail } from '@/lib/email';
import { generateAbsencePDF } from '@/lib/pdf';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    const { actionStatus, actionComment, role } = await request.json();
    const absence = await Absence.findById(params.id);

    if (!absence) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    const now = new Date();
    let newStatus = absence.status;

    // Handle role-based transitions
    if (role === 'chef') {
      absence.chefApproval = {
        status: actionStatus,
        comment: actionComment,
        date: now
      };
      if (actionStatus === 'approved') {
        newStatus = 'pending_rh';
      } else {
        newStatus = 'rejected';
      }
    } else if (role === 'dg') {
      absence.dgApproval = {
        status: actionStatus,
        comment: actionComment,
        date: now
      };
      if (actionStatus === 'approved') {
        newStatus = 'pending_rh';
      } else {
        newStatus = 'rejected';
      }
    } else if (role === 'rh') {
      absence.rhOpinion = {
        comment: actionComment,
        date: now
      };
      absence.adminResponse = actionComment; // Sync for summary
      newStatus = actionStatus; // 'approved' or 'rejected'
    }

    absence.status = newStatus;
    absence.updatedAt = now;
    await absence.save();

    console.log(`[WORKFLOW] Status updated to: ${newStatus} for absence ${absence.matricule}`);

    // Trigger final notification if the flow is finished
    if (newStatus === 'approved' || newStatus === 'rejected') {
      console.log(`[WORKFLOW] Generating final PDF for ${absence.matricule}...`);
      try {
        // Convert to plain object to ensure all virtuals and properties are correctly accessed
        const absenceData = absence.toObject ? absence.toObject() : JSON.parse(JSON.stringify(absence));
        
        const pdfBuffer = await generateAbsencePDF(absenceData);
        console.log(`[WORKFLOW] PDF generated successfully (${pdfBuffer.length} bytes)`);

        const subject = newStatus === 'approved' ? 'Demande d\'absence approuvée' : 'Demande d\'absence rejetée';
        const finalSentence = newStatus === 'approved'
          ? '<p><strong>Décision :</strong> Votre demande est approuvée — vous pouvez prendre vos congés aux dates indiquées.</p>'
          : '<p><strong>Décision :</strong> Votre demande est rejetée — vous ne pouvez pas prendre ces congés tels que demandés.</p>';
        const html = `
          <p>Bonjour ${absence.employee.firstName} ${absence.employee.name},</p>
          <p>La décision finale concernant votre demande d'absence <strong>${absence.matricule}</strong> a été rendue.</p>
          <p>Statut: <strong>${newStatus === 'approved' ? 'APPROUVÉE' : 'REJETÉE'}</strong></p>
          ${finalSentence}
          ${actionComment ? `<p>Commentaire RH: ${actionComment}</p>` : ''}
          <p>Veuillez trouver ci-joint le document officiel récapitulatif contenant les accords hiérarchiques.</p>
          <p>Cordialement,<br/>Service RH Doualair</p>
        `;

        console.log(`[WORKFLOW] Sending final email to ${absence.employee.email}...`);
        await sendEmail(absence.employee.email, subject, html, [
          {
            filename: `Absence_${absence.matricule}.pdf`,
            content: pdfBuffer,
          }
        ]);
        console.log(`[WORKFLOW] Final email sent successfully with PDF attachment.`);
      } catch (err: any) {
        console.error('[WORKFLOW] FAILED to generate or send final notification:', err.message || err);
      }
    }

    return NextResponse.json(absence);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    const absence = await Absence.findByIdAndDelete(params.id);
    if (!absence) return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}