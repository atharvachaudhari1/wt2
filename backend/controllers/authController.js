/**
 * Authentication controller - login per role, JWT generation.
 */
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * POST /api/auth/login
 * Body: { email, password, role? } - role optional; if provided, validated against user.role
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password, role: requestedRole } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated.' });
    }

    if (requestedRole && user.role !== requestedRole) {
      return res.status(403).json({ success: false, message: 'Login not allowed for this role.' });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = generateToken(user._id);
    const userObj = await User.findById(user._id).select('-password');
    return res.status(200).json({
      success: true,
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: userObj,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me - current user (requires auth)
 */
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('profileId', '-__v')
      .select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/auth/me - update current user
 * Body: { name?, gender?, currentPassword?, newPassword? }
 * For password change: both currentPassword and newPassword required; newPassword min 5 chars.
 */
exports.updateMe = async (req, res, next) => {
  try {
    const { name, gender, currentPassword, newPassword } = req.body;
    const update = {};

    if (name !== undefined) {
      const trimmed = typeof name === 'string' ? name.trim() : '';
      if (trimmed.length > 0) update.name = trimmed;
    }
    if (gender !== undefined) {
      if (gender === null || gender === 'male' || gender === 'female') {
        update.gender = gender;
      }
    }

    if (currentPassword != null || newPassword != null) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current password and new password required to change password.' });
      }
      if (String(newPassword).length < 5) {
        return res.status(400).json({ success: false, message: 'New password must be at least 5 characters.' });
      }
      const userWithPass = await User.findById(req.user.id).select('+password');
      if (!userWithPass) return res.status(404).json({ success: false, message: 'User not found.' });
      const match = await userWithPass.comparePassword(currentPassword);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }
      userWithPass.password = newPassword;
      await userWithPass.save();
      const user = await User.findById(req.user.id).select('-password');
      return res.json({ success: true, user });
    }

    if (Object.keys(update).length > 0) {
      const updated = await User.findByIdAndUpdate(
        req.user.id,
        { $set: update },
        { new: true }
      ).select('-password');
      if (!updated) return res.status(404).json({ success: false, message: 'User not found.' });
      return res.json({ success: true, user: updated });
    }

    return res.status(400).json({ success: false, message: 'No valid fields to update.' });
  } catch (err) {
    next(err);
  }
};

