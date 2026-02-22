const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const stubRoutes = require('./stubRoutes');

router.use('/', authRoutes);
router.use('/', userRoutes);
router.use('/', stubRoutes);

module.exports = router;
