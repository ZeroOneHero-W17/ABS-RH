const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      env[key.trim()] = values.join('=').trim();
    }
  }
});

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

async function testSMTP() {
  try {
    console.log('Testing SMTP connection...');
    console.log(`Host: ${env.SMTP_HOST}`);
    console.log(`Port: ${env.SMTP_PORT}`);
    console.log(`User: ${env.SMTP_USER}`);
    console.log(`Pass: [${env.SMTP_PASS ? 'SET' : 'EMPTY'}]`);
    console.log(`Pass length: ${env.SMTP_PASS ? env.SMTP_PASS.length : 0}`);
    
    // Test connection
    await transporter.verify();
    console.log('✓ SMTP connection successful!');
    
    // Send test email
    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: env.SMTP_USER,
      subject: 'Test Email - Système Absence RH',
      html: '<p>Bonjour, ceci est un email de test!</p>',
    });
    console.log('✓ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('✗ SMTP Error:', error.message);
    console.error('Full error:', error);
  }
}

testSMTP();
