const { MongoClient } = require('mongodb');
const fs = require('fs');

async function testConnection() {
  let uri = '';
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    const match = env.match(/MONGODB_URI=(.*)/);
    if (match) uri = match[1].trim();
  } catch (e) {
    console.error('Error reading .env.local:', e.message);
    return;
  }

  if (!uri) {
    console.error('MONGODB_URI is not defined in .env.local');
    return;
  }

  console.log('Attempting to connect to MongoDB Atlas...');
  // Use mongoose instead of mongodb directly since it's already in package.json
  const mongoose = require('mongoose');
  
  try {
    await mongoose.connect(uri);
    console.log('Successfully connected to MongoDB Atlas (via Mongoose)!');
    console.log('Connected to database:', mongoose.connection.name);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Failed to connect to MongoDB Atlas:', err.message);
  }
}

testConnection();
