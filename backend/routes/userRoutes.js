const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');

/**
 * GET /api/students
 * Returns list of students (name, email, role, rollNo, mentorEmail only)
 */
router.get('/students', async (req, res) => {
  try {
    const users = await User.find({ role: 'student' })
      .select('name email role rollNo mentorEmail')
      .lean();
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/teachers
 * Returns list of teachers (name, email, role only)
 */
router.get('/teachers', async (req, res) => {
  try {
    const users = await User.find({ role: 'teacher' })
      .select('name email role')
      .lean();
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/student/mentor?email=student@crce.edu.in
 * Returns allotted mentor for the student (for "My mentor" panel).
 */
router.get('/student/mentor', async (req, res) => {
  try {
    const studentEmail = (req.query.email || '').trim().toLowerCase();
    if (!studentEmail) {
      return res.status(200).json({ mentor: null });
    }
    const student = await User.findOne({ email: studentEmail, role: 'student' })
      .select('mentorEmail')
      .lean();
    if (!student || !student.mentorEmail) {
      return res.status(200).json({ mentor: null });
    }
    const mentor = await User.findOne({ email: student.mentorEmail, role: 'teacher' })
      .select('name email')
      .lean();
    if (!mentor) {
      return res.status(200).json({ mentor: null });
    }
    return res.status(200).json({
      mentor: {
        user: { name: mentor.name, email: mentor.email },
        department: null,
      },
    });
  } catch (err) {
    return res.status(500).json({ mentor: null, message: err.message });
  }
});

/**
 * GET /api/admin/students - same as /students (with optional query params)
 */
router.get('/admin/students', async (req, res) => {
  try {
    const { limit } = req.query || {};
    let q = User.find({ role: 'student' }).select('name email role rollNo mentorEmail');
    if (limit) q = q.limit(parseInt(limit, 10) || 50);
    const users = await q.lean();
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/teachers - same as /teachers
 */
router.get('/admin/teachers', async (req, res) => {
  try {
    const users = await User.find({ role: 'teacher' })
      .select('name email role')
      .lean();
    return res.status(200).json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/assign-mentor - Body: { studentId, mentorId } (ids or emails)
 * Uses email as identifier: studentId/mentorId can be _id or email.
 */
router.post('/admin/assign-mentor', async (req, res) => {
  try {
    const { studentId, mentorId } = req.body || {};
    if (!studentId || !mentorId) {
      return res.status(400).json({ success: false, message: 'studentId and mentorId required' });
    }
    const mentor = await User.findOne(
      mongoose.isValidObjectId(mentorId) ? { _id: mentorId } : { email: String(mentorId).trim().toLowerCase(), role: 'teacher' }
    ).select('email');
    if (!mentor) {
      return res.status(400).json({ success: false, message: 'Mentor not found' });
    }
    const student = await User.findOne(
      mongoose.isValidObjectId(studentId) ? { _id: studentId } : { email: String(studentId).trim().toLowerCase(), role: 'student' }
    );
    if (!student) {
      return res.status(400).json({ success: false, message: 'Student not found' });
    }
    student.mentorEmail = mentor.email;
    await student.save();
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
