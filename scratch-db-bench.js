const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://127.0.0.1:27017/absence-rh';

async function test() {
  const start = Date.now();
  console.log('Connecting...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected in', Date.now() - start, 'ms');
  
  const startQuery = Date.now();
  const count = await mongoose.connection.collection('absences').countDocuments();
  console.log('Count:', count, 'in', Date.now() - startQuery, 'ms');
  
  const startFetch = Date.now();
  const docs = await mongoose.connection.collection('absences').find({}).toArray();
  console.log('Fetched', docs.length, 'docs in', Date.now() - startFetch, 'ms');
  
  await mongoose.disconnect();
}

test();
