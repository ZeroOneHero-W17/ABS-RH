import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
 
export const dynamic = 'force-dynamic';
 
import Absence from '@/models/Absence';
import Counter from '@/models/Counter';
import { sendEmail } from '@/lib/email';
import { generateAbsencePDF } from '@/lib/pdf';

async function getNextMatricule() {
  const counter = await Counter.findByIdAndUpdate(
    'absenceMatricule',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `ABS-${counter.seq.toString().padStart(6, '0')}`;
}

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const formData = await request.formData();
    
    const matricule = await getNextMatricule();
    
    const requesterType = (formData.get('requesterType') as string) || 'employee';

    // Handle attachment - only treat as real file if size > 0
    const fileRaw = formData.get('attachment');
    const file = fileRaw instanceof File && fileRaw.size > 0 ? fileRaw : null;
    let attachmentDataUri = undefined;
    
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      attachmentDataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
    }
    
    const absence = new Absence({
      matricule,
      employee: {
        name: formData.get('name'),
        firstName: formData.get('firstName'),
        email: formData.get('email'),
        service: formData.get('service'),
        function: formData.get('function'),
      },
      requesterType,
      absence: {
        type: formData.get('type'),
        reason: formData.get('reason'),
        startDate: new Date(formData.get('startDate') as string),
        endDate: new Date(formData.get('endDate') as string),
        startTime: formData.get('startTime') || '',
        endTime: formData.get('endTime') || '',
      },
      attachment: attachmentDataUri,
      status: requesterType === 'chef_service' ? 'pending_rh' : 'pending_chef',
    });

    await absence.save();

    // Send confirmation email with PDF recap (non-blocking)
    try {
      const absenceData = absence.toObject();
      const pdfBuffer = await generateAbsencePDF(absenceData);
      
      await sendEmail(
        absence.employee.email,
        'Demande d\'absence reçue',
        `<p>Bonjour ${absence.employee.firstName} ${absence.employee.name},</p>
         <p>Votre demande d'absence <strong>${matricule}</strong> a bien été reçue et est en cours de traitement par votre hiérarchie.</p>
         <p>Veuillez trouver ci-joint un récapitulatif de votre demande.</p>
         <p>Cordialement,<br/>Service RH Doualair</p>`,
        [
          {
            filename: `Demande_Absence_${matricule}.pdf`,
            content: pdfBuffer,
          }
        ]
      );
      console.log(`[SUBMISSION] Initial email with PDF sent to ${absence.employee.email}`);
    } catch (emailError: any) {
      console.error('[SUBMISSION] Email confirmation non envoyé:', emailError.message || emailError);
    }

    return NextResponse.json({ success: true, matricule });
  } catch (error: any) {
    console.error('ERREUR SOUMISSION ABSENCE:', error?.message || error);
    return NextResponse.json({ error: 'Erreur lors de la soumission', details: error?.message }, { status: 500 });
  }
}

export async function GET() {
  await dbConnect();
  try {
    const absences = await Absence.find({}).sort({ createdAt: -1 });
    return NextResponse.json(absences);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}