import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
 
export const dynamic = 'force-dynamic';
 
import Absence from '@/models/Absence';
import Counter from '@/models/Counter';
import { sendEmail } from '@/lib/email';
import { generateAbsencePDF } from '@/lib/pdf';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    let attachmentUrl = undefined;
    
    if (file) {
      if (file.size > 12 * 1024 * 1024) {
        return NextResponse.json({ error: 'La pièce jointe dépasse la taille maximale autorisée (12 Mo)' }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Upload to Cloudinary via stream
      attachmentUrl = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'absences',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        );
        uploadStream.end(buffer);
      });
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
      attachment: attachmentUrl,
      status: requesterType === 'chef_service' ? 'pending_rh' : 'pending_chef',
    });

    await absence.save();

    // Send confirmation email with PDF recap (non-blocking)
    try {
      const absenceData = absence.toObject();
      const pdfBuffer = await generateAbsencePDF(absenceData);

      const payLine = absence.aPayer ? '<p><strong>A PAYER:</strong> Oui</p>' : '<p><strong>A PAYER:</strong> Non</p>';
      const retainLine = absence.retenir ? '<p><strong>RETENIR:</strong> Oui</p>' : '<p><strong>RETENIR:</strong> Non</p>';
      const payNoteLine = absence.aPayer && absence.aPayerNote ? `<p><strong>Note A PAYER:</strong> ${absence.aPayerNote}</p>` : '';
      const retainNoteLine = absence.retenir && absence.retenirNote ? `<p><strong>Note RETENIR:</strong> ${absence.retenirNote}</p>` : '';

      await sendEmail(
        absence.employee.email,
        'Demande d\'absence reçue',
        `<p>Bonjour ${absence.employee.firstName} ${absence.employee.name},</p>
         <p>Votre demande d'absence <strong>${matricule}</strong> a bien été reçue et est en cours de traitement par votre hiérarchie.</p>
         ${payLine}
         ${payNoteLine}
         ${retainLine}
         ${retainNoteLine}
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

export async function GET(request: NextRequest) {
  await dbConnect();
  try {
    const roleCookie = request.cookies.get('user_role');
    const userRole = roleCookie ? roleCookie.value : null;
    const deptCookie = request.cookies.get('user_department');
    const userDepartment = deptCookie ? deptCookie.value : null;

    let query: any = {};
    if (userRole === 'chef') {
      // Chef: voir seulement les demandes en attente pour son service
      if (!userDepartment) return NextResponse.json([]);
      query = { 'employee.service': userDepartment, status: 'pending_chef' };
    } else if (userRole === 'rh') {
      // RH: ne doit pas voir les demandes encore en attente du chef
      query = { status: { $in: ['pending_rh', 'pending_dg', 'approved', 'rejected'] } };
    } else if (userRole === 'dg') {
      // DG: voir les demandes en attente DG et les décisions finales
      query = { status: { $in: ['pending_dg', 'approved', 'rejected'] } };
    } else {
      // Pas de rôle: ne rien exposer
      return NextResponse.json([]);
    }

    const absences = await Absence.find(query).sort({ createdAt: -1 });
    return NextResponse.json(absences);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}