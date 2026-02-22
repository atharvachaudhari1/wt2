const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const SEED_USERS = [
  { name: 'Admin', email: 'admin@ecs.edu', password: 'admin123', role: 'admin' },
  { name: 'Test Teacher', email: 'teacher@crce.edu.in', password: 'teacher123', role: 'teacher' },
  { name: 'Test Student', email: 'student@crce.edu.in', password: 'student123', role: 'student', rollNo: '001', mentorEmail: 'teacher@crce.edu.in' },
];

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGO_URI. Set it in backend/.env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  for (const u of SEED_USERS) {
    const email = u.email.trim().toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Skip (exists):', email);
      continue;
    }
    await User.create({ ...u, email });
    console.log('Created:', email, '(' + u.role + ')');
  }
  console.log('Seed done.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
