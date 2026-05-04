const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Lire et parser correctement le fichier .env.local (gestion \r\n Windows)
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split(/\r?\n/).forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const idx = line.indexOf('=');
  if (idx > 0) {
    env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
  }
});

console.log('=== CONFIGURATION EMAIL ===');
console.log('SMTP_HOST:', env.SMTP_HOST);
console.log('SMTP_PORT:', env.SMTP_PORT);
console.log('SMTP_USER:', env.SMTP_USER);
console.log('SMTP_FROM:', env.SMTP_FROM);
console.log('SMTP_PASS:', env.SMTP_PASS);
console.log('===========================\n');

async function testEmail() {
  try {
    console.log('1. Création du transporter...');
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: parseInt(env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });

    console.log('2. Vérification de la connexion SMTP...');
    await transporter.verify();
    console.log('✅ Connexion SMTP OK !');

    console.log('3. Envoi email de test...');
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: env.SMTP_USER,
      subject: 'TEST - Email de diagnostic',
      html: '<h1>Test réussi !</h1><p>Le système email fonctionne correctement.</p>',
    });

    console.log('✅ Email envoyé avec succès !');
    console.log('Message ID:', info.messageId);

  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    console.error('Code erreur:', error.code);
  }
}

testEmail();
