import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const config = {
    SMTP_HOST_CONFIGURED: !!process.env.SMTP_HOST,
    SMTP_PORT_CONFIGURED: !!process.env.SMTP_PORT,
    SMTP_USER_CONFIGURED: !!process.env.SMTP_USER,
    SMTP_FROM_CONFIGURED: !!process.env.SMTP_FROM,
    SMTP_PASS_CONFIGURED: !!process.env.SMTP_PASS,
  };

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER,
      subject: 'DIAGNOSTIC - Test depuis Next.js',
      html: '<h2>✅ Email envoyé depuis Next.js</h2><p>Les variables env sont correctement chargées.</p>',
    });

    return NextResponse.json({
      success: true,
      config,
      messageId: info.messageId,
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      config,
      error: error instanceof Error ? error.message : 'Erreur SMTP',
      code: error.code,
    }, { status: 500 });
  }
}
