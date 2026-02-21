const express = require('express');
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

module.exports = router;
