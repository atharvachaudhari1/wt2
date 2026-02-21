const express = require('express');
const router = express.Router();
const User = require('../models/User');

/**
 * POST /api/login
 * Body: { email, password }
 * Returns: { success, role, name, mentorEmail } or 401
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.password !== String(password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    return res.status(200).json({
      success: true,
      role: user.role,
      name: user.name,
      mentorEmail: user.mentorEmail || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/register (optional)
 * Body: { name, email, password, role, rollNo?, mentorEmail? }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, rollNo, mentorEmail } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: String(password),
      role,
      rollNo: rollNo != null ? String(rollNo).trim() : null,
      mentorEmail: mentorEmail != null ? String(mentorEmail).trim() : null,
    });
    return res.status(201).json({
      success: true,
      role: user.role,
      name: user.name,
      mentorEmail: user.mentorEmail || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
