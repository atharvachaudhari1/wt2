const express = require('express');
const router = express.Router();

// ----- Student stubs -----
router.get('/student/dashboard', (req, res) => {
  res.status(200).json({ stats: {}, upcoming: [] });
});

router.get('/student/live-sessions', (req, res) => {
  res.status(200).json({ data: [] });
});

router.get('/student/sessions/upcoming', (req, res) => {
  res.status(200).json({ data: [] });
});

router.get('/student/sessions/:id/meet-link', (req, res) => {
  res.status(200).json({ meetLink: null });
});

router.get('/student/attendance', (req, res) => {
  res.status(200).json({ data: [] });
});

router.get('/student/announcements', (req, res) => {
  res.status(200).json({ data: [] });
});

// ----- Notifications -----
router.get('/notifications', (req, res) => {
  res.status(200).json({ data: [] });
});

router.patch('/notifications/:id/read', (req, res) => {
  res.status(200).json({ success: true });
});

router.patch('/notifications/read-all', (req, res) => {
  res.status(200).json({ success: true });
});

// ----- Teacher stubs -----
router.get('/teacher/sessions', (req, res) => {
  res.status(200).json({ data: [] });
});

router.post('/teacher/sessions', (req, res) => {
  res.status(201).json({ success: true, session: { _id: 'stub', ...req.body } });
});

router.put('/teacher/session/:id/meet-link', (req, res) => {
  res.status(200).json({ success: true });
});

router.put('/teacher/sessions/:id', (req, res) => {
  res.status(200).json({ success: true });
});

// ----- Chat stubs -----
router.get('/chat/contacts', (req, res) => {
  res.status(200).json({ data: [] });
});

router.get('/chat/conversations', (req, res) => {
  res.status(200).json({ data: [] });
});

router.post('/chat/conversations', (req, res) => {
  res.status(201).json({ id: 'stub', messages: [] });
});

router.get('/chat/conversations/:id', (req, res) => {
  res.status(200).json({ messages: [] });
});

router.post('/chat/conversations/:id/messages', (req, res) => {
  res.status(201).json({ id: 'stub', content: req.body?.content || '' });
});

router.patch('/chat/messages/:id/read', (req, res) => {
  res.status(200).json({ success: true });
});

module.exports = router;
