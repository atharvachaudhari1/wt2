/**
 * In-app notifications - smart notifications for sessions, announcements, etc.
 */
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['session_reminder', 'announcement', 'attendance', 'note', 'chat', 'general'],
      default: 'general',
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedModel',
      default: null,
    },
    relatedModel: {
      type: String,
      enum: ['Session', 'Announcement', 'Attendance', 'Message', null],
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
