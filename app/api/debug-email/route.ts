import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  // 1. Vérifier les variables d'environnement
  const config = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_FROM: process.env.SMTP_FROM,
    SMTP_PASS_EXISTS: !!process.env.SMTP_PASS,
    SMTP_PASS_LENGTH: process.env.SMTP_PASS?.length,
    SMTP_PASS_VALUE: process.env.SMTP_PASS, // temporaire pour debug
  };

  console.log('[DIAG] Env vars:', config);

  // 2. Tenter connexion SMTP
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
    console.log('[DIAG] SMTP verify OK');

    // 3. Envoyer un email de test
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER,
      subject: 'DIAGNOSTIC - Test depuis Next.js',
      html: '<h2>✅ Email envoyé depuis Next.js</h2><p>Les variables env sont correctement chargées.</p>',
    });

    console.log('[DIAG] Email sent:', info.messageId);

    return NextResponse.json({
      success: true,
      config,
      messageId: info.messageId,
    });

  } catch (error: any) {
    console.error('[DIAG] Error:', error.message);
    return NextResponse.json({
      success: false,
      config,
      error: error.message,
      code: error.code,
    }, { status: 500 });
  }
}
