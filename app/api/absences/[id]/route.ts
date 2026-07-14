import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Absence from '@/models/Absence';
import { sendEmail } from '@/lib/email';
import { generateAbsencePDF } from '@/lib/pdf';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    const { actionStatus, actionComment, aPayer, aPayerNote, retenir, retenirNote } = await request.json();
    const absence = await Absence.findById(params.id);

    if (!absence) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Déterminer le rôle à partir des cookies côté serveur (ne pas faire confiance au client)
    const roleCookie = request.cookies.get('user_role');
    const role = roleCookie ? roleCookie.value : null;
    const deptCookie = request.cookies.get('user_department');
    const userDepartment = deptCookie ? deptCookie.value : null;

    if (!role) {
      return NextResponse.json({ error: 'Rôle inconnu' }, { status: 403 });
    }

    // Interdire DG/RH d'agir avant l'accord du chef
    if ((role === 'dg' || role === 'rh') && absence.status === 'pending_chef') {
      return NextResponse.json({ error: 'Action non autorisée avant accord du chef de service' }, { status: 403 });
    }

    // Vérifier que le chef agit uniquement pour son département et sur le bon statut
    if (role === 'chef') {
      if (!userDepartment || absence.employee.service !== userDepartment) {
        return NextResponse.json({ error: 'Non autorisé pour ce département' }, { status: 403 });
      }
      if (absence.status !== 'pending_chef') {
        return NextResponse.json({ error: 'Action non autorisée pour ce statut' }, { status: 403 });
      }
    }

    // Vérifier les statuts attendus pour RH / DG
    if (role === 'rh' && absence.status !== 'pending_rh') {
      return NextResponse.json({ error: 'Action non autorisée pour ce statut' }, { status: 403 });
    }
    if (role === 'dg' && absence.status !== 'pending_dg') {
      return NextResponse.json({ error: 'Action non autorisée pour ce statut' }, { status: 403 });
    }

    const now = new Date();
    let newStatus = absence.status;

    // Handle role-based transitions (server-side role)
    if (role === 'chef') {
      absence.chefApproval = {
        status: actionStatus,
        comment: actionComment,
        date: now
      };
      if (actionStatus === 'approved') {
        newStatus = 'pending_rh';

        try {
          await sendEmail(
            'ressource@doualair.com',
            `Nouvelle demande d'absence à traiter par RH - ${absence.matricule}`,
            `<p>Bonjour Mme. Elvyre KOYOU,</p>
             <p>La demande d'absence <strong>${absence.matricule}</strong> a été approuvée par le chef de service.</p>
             <p>Collaborateur : <strong>${absence.employee.firstName} ${absence.employee.name}</strong></p>
             <p>Service : <strong>${absence.employee.service}</strong></p>
             <p>Veuillez procéder à l'examen de la demande et transmettre au DG si nécessaire.</p>
             <p><a href="https://abs-rh.vercel.app/">Système de Demande d'Absence RH</a></p>
             <p>Cordialement,<br/>Système RH Doualair</p>`
          );
          console.log(`[WORKFLOW] RH notification sent after chef approval for ${absence.matricule}`);
        } catch (err: any) {
          console.error('[WORKFLOW] RH notification failed:', err.message || err);
        }
      } else {
        newStatus = 'rejected';
      }
    } else if (role === 'rh') {
      // Autoriser uniquement RH à définir les flags de paiement/retenue (contrôle côté serveur)
      if (typeof aPayer !== 'undefined') {
        absence.aPayer = !!aPayer;
        if (absence.aPayer && typeof aPayerNote !== 'undefined') {
          absence.aPayerNote = String(aPayerNote || '');
        } else {
          absence.aPayerNote = '';
        }
      }
      if (typeof retenir !== 'undefined') {
        absence.retenir = !!retenir;
        if (absence.retenir && typeof retenirNote !== 'undefined') {
          absence.retenirNote = String(retenirNote || '');
        } else {
          absence.retenirNote = '';
        }
      }

      absence.rhOpinion = {
        status: actionStatus,
        comment: actionComment,
        date: now
      };
      absence.adminResponse = actionComment; // Sync for summary
      if (actionStatus === 'approved') {
        newStatus = 'pending_dg';

        try {
          await sendEmail(
            'a.nkembe@doualair.com',
            `Nouvelle demande d'absence à traiter par la DG - ${absence.matricule}`,
            `<p>Bonjour Monsieur le Directeur Général,</p>
             <p>La demande d'absence <strong>${absence.matricule}</strong> a été validée par le service RH.</p>
             <p>Collaborateur : <strong>${absence.employee.firstName} ${absence.employee.name}</strong></p>
             <p>Service : <strong>${absence.employee.service}</strong></p>
             <p>Veuillez, s'il vous plaît, traiter cette demande dans les meilleurs délais.</p>
             <p><a href="https://abs-rh.vercel.app/">Système de Demande d'Absence RH</a></p>
             <p>Cordialement,<br/>Système RH Doualair</p>`
          );
          console.log(`[WORKFLOW] DG notification sent after RH approval for ${absence.matricule}`);
        } catch (err: any) {
          console.error('[WORKFLOW] DG notification failed:', err.message || err);
        }
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
        newStatus = 'approved';
      } else {
        newStatus = 'rejected';
      }
    } else {
      return NextResponse.json({ error: 'Rôle non autorisé' }, { status: 403 });
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

        // Récupérer commentaires RH et DG depuis l'objet absence (plus fiable que actionComment)
        const rhComment = absence.rhOpinion?.comment;
        const dgComment = absence.dgApproval?.comment;

        const payLine = absence.aPayer ? '<p><strong>A PAYER:</strong> Oui</p>' : '<p><strong>A PAYER:</strong> Non</p>';
        const retainLine = absence.retenir ? '<p><strong>RETENIR:</strong> Oui</p>' : '<p><strong>RETENIR:</strong> Non</p>';
        const payNoteLine = absence.aPayer && absence.aPayerNote ? `<p><strong>Note A PAYER:</strong> ${absence.aPayerNote}</p>` : '';
        const retainNoteLine = absence.retenir && absence.retenirNote ? `<p><strong>Note RETENIR:</strong> ${absence.retenirNote}</p>` : '';

        const html = `
          <p>Bonjour ${absence.employee.firstName} ${absence.employee.name},</p>
          <p>La décision finale concernant votre demande d'absence <strong>${absence.matricule}</strong> a été rendue.</p>
          <p>Statut: <strong>${newStatus === 'approved' ? 'APPROUVÉE' : 'REJETÉE'}</strong></p>
          ${finalSentence}
          ${rhComment ? `<p>Commentaire RH: ${rhComment}</p>` : ''}
          ${dgComment ? `<p>Commentaire DG: ${dgComment}</p>` : ''}
          ${payLine}
          ${payNoteLine}
          ${retainLine}
          ${retainNoteLine}
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