import nodemailer from 'nodemailer';

function getTransporter() {
  console.log('[EMAIL] Creating transporter...');
  console.log('[EMAIL] SMTP_HOST:', process.env.SMTP_HOST);
  console.log('[EMAIL] SMTP_USER:', process.env.SMTP_USER);
  console.log('[EMAIL] SMTP_PASS exists:', !!process.env.SMTP_PASS);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log('[EMAIL] Transporter created');
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string, attachments?: any[]) {
  const transporter = getTransporter();
  console.log(`[EMAIL] Preparing email for ${to} - Subject: ${subject}`);
  if (attachments && attachments.length > 0) {
    console.log(`[EMAIL] Attachments detected: ${attachments.length}`);
    attachments.forEach((att, idx) => {
      console.log(`[EMAIL] Attachment ${idx + 1}: ${att.filename} (${att.content?.length || 0} bytes)`);
    });
  } else {
    console.log(`[EMAIL] No attachments specified.`);
  }

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Sent successfully: ${info.messageId}`);
    return info;
  } catch (error: any) {
    console.error(`[EMAIL] FAILED to send email to ${to}:`, error.message || error);
    throw error;
  }
}