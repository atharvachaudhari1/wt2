/**
 * Seed users from SE ECS Mentoring circular data.
 * - Mentors (teachers): from data/mentors.json, password = teacher123
 * - Students: from data/students.json, email = rollno@crce.edu.in, password = rollNo, linked to mentor via mentorEmail
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const DATA_DIR = path.join(__dirname, '..', 'data');

function loadJson(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.error('Missing file:', filePath);
    return null;
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Invalid JSON in', filename, e.message);
    return null;
  }
}

async function seed() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGO_URI. Set it in backend/.env');
    process.exit(1);
  }
  await mongoose.connect(uri);

  const adminEmail = 'admin@ecs.edu';
  if (!(await User.findOne({ email: adminEmail }))) {
    await User.create({ name: 'Admin', email: adminEmail, password: 'admin123', role: 'admin' });
    console.log('Created admin:', adminEmail);
  }

  const mentors = loadJson('mentors.json');
  const students = loadJson('students.json');
  if (!mentors || !Array.isArray(mentors)) {
    console.error('Ensure backend/data/mentors.json exists and is a JSON array.');
    await mongoose.disconnect();
    process.exit(1);
  }
  if (!students || !Array.isArray(students)) {
    console.error('Ensure backend/data/students.json exists and is a JSON array.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const TEACHER_PASSWORD = 'teacher123';

  for (const m of mentors) {
    const email = (m.email || '').trim().toLowerCase();
    const name = (m.name || '').trim();
    if (!email) continue;
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role === 'teacher') {
        console.log('Skip mentor (exists):', email);
      } else {
        await User.updateOne({ email }, { $set: { role: 'teacher', name: name || existing.name } });
        console.log('Updated to teacher:', email);
      }
      continue;
    }
    await User.create({
      name: name || email,
      email,
      password: TEACHER_PASSWORD,
      role: 'teacher',
    });
    console.log('Created mentor:', email);
  }

  for (const s of students) {
    const rollNo = String(s.rollNo || '').trim();
    const name = (s.name || '').trim();
    const mentorEmail = (s.mentorEmail || '').trim().toLowerCase();
    if (!rollNo) continue;
    const email = rollNo + '@crce.edu.in';
    const existing = await User.findOne({ email });
    if (existing) {
      await User.updateOne(
        { email },
        { $set: { name: name || existing.name, rollNo, mentorEmail: mentorEmail || existing.mentorEmail } }
      );
      console.log('Updated student:', email);
      continue;
    }
    await User.create({
      name: name || 'Student ' + rollNo,
      email,
      password: rollNo,
      role: 'student',
      rollNo,
      mentorEmail: mentorEmail || null,
    });
    console.log('Created student:', email, '→ mentor', mentorEmail || '(none)');
  }

  console.log('Circular seed done. Students login with rollno@crce.edu.in, password = roll number.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
