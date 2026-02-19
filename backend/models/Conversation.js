/**
 * 1:1 conversation between two users (for chat).
 */
const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// One conversation per pair; participants stored sorted for consistent lookup
conversationSchema.index({ participants: 1 }, { unique: true });
conversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
