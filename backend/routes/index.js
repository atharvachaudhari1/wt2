/**
 * Mount all API routes.
 */
const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/student', require('./studentRoutes'));
router.use('/teacher', require('./teacherRoutes'));
router.use('/parent', require('./parentRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/feedback', require('./feedbackRoutes'));
router.use('/timeline', require('./timelineRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/chat', require('./chatRoutes'));

module.exports = router;
