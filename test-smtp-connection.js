#!/usr/bin/env node
/**
 * Test SMTP Connection - Vérifier la connexion au serveur SMTP
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('=== TEST CONNEXION SMTP ===\n');

  const config = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  console.log('Configuration:');
  console.log(`  SMTP_HOST: ${config.host}`);
  console.log(`  SMTP_PORT: ${config.port}`);
  console.log(`  SMTP_USER: ${config.auth.user}`);
  console.log(`  SMTP_PASS: ${config.auth.pass ? '[MASQUÉ - ' + config.auth.pass.length + ' caractères]' : '[VIDE!]'}`);
  console.log(`  SMTP_FROM: ${process.env.SMTP_FROM}`);
  console.log();

  try {
    console.log('Création du transporter...');
    const transporter = nodemailer.createTransport(config);

    console.log('Vérification de la connexion...');
    await transporter.verify();
    console.log('✓ Connexion SMTP réussie!\n');

    // Optionnel: envoyer un email de test
    console.log('Envoi d\'un email de test...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_USER, // Envoyer à soi-même
      subject: '[TEST] Connexion SMTP fonctionnelle',
      html: '<p>Cet email confirme que la connexion SMTP fonctionne correctement.</p>',
    });

    console.log('✓ Email envoyé avec succès!');
    console.log(`  Message ID: ${info.messageId}\n`);

  } catch (error) {
    console.error('✗ ERREUR:\n');
    console.error(`  ${error.message}`);
    if (error.response) {
      console.error(`  Réponse du serveur: ${error.response}`);
    }
    process.exit(1);
  }
}

testSMTP();
