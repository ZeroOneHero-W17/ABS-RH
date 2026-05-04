/**
 * Test complet : simule exactement ce que fait l'application
 * quand un admin approuve/rejette une demande d'absence.
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Parser .env.local
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const idx = line.indexOf('=');
  if (idx > 0) env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
});

// Injecter dans process.env (comme Next.js le fait)
Object.assign(process.env, env);

console.log('=== TEST ENVOI EMAIL FINAL ===');
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ défini' : '❌ manquant');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('');

async function sendEmail(to, subject, html, attachments) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

async function main() {
  try {
    console.log('Envoi email de test à:', process.env.SMTP_USER);
    
    const info = await sendEmail(
      process.env.SMTP_USER, // destinataire = soi-même pour tester
      'TEST - Demande d\'absence approuvée',
      `
        <p>Bonjour Test,</p>
        <p>La décision finale concernant votre demande d'absence <strong>ABS-001</strong> a été rendue.</p>
        <p>Statut: <strong>APPROUVÉE</strong></p>
        <p>Cordialement,<br/>Service RH Doualair</p>
      `
    );

    console.log('✅ Email envoyé avec succès !');
    console.log('Message ID:', info.messageId);
    console.log('');
    console.log('👉 Vérifiez votre boîte Gmail:', process.env.SMTP_USER);

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error('Code:', error.code);
    console.error('');
    console.error('Détail complet:');
    console.error(error);
  }
}

main();
