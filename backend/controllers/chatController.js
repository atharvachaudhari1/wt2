/**
 * Chat: 1:1 conversations. Student↔Teacher, Teacher↔Admin/Student/Parent, Admin↔Teacher.
 */
const mongoose = require('mongoose');
const { User, Conversation, Message, StudentProfile, TeacherProfile, ParentProfile } = require('../models');

function normalizeParticipants(uid1, uid2) {
  const a = uid1.toString();
  const b = uid2.toString();
  return a < b ? [uid1, uid2] : [uid2, uid1];
}

/** Get list of users the current user can chat with (by role rules). */
exports.getContacts = async (req, res, next) => {
  try {
    const me = req.user;
    const contacts = [];

    if (me.role === 'student') {
      const profile = await StudentProfile.findOne({ user: me._id }).populate('mentor', 'user');
      if (profile && profile.mentor && profile.mentor.user) {
        const mentorUser = await User.findById(profile.mentor.user).select('name email role');
        if (mentorUser) contacts.push({ _id: mentorUser._id, name: mentorUser.name, email: mentorUser.email, role: mentorUser.role });
      }
    } else if (me.role === 'teacher') {
      const profile = await TeacherProfile.findOne({ user: me._id });
      if (profile) {
        const raw = (profile.assignedStudents || []).filter(Boolean);
        const assignedIds = raw.map((s) => (s._id != null ? s._id : s).toString());
        // 1. Assigned students (can message each student)
        const studentProfiles = await StudentProfile.find({ _id: { $in: assignedIds } }).populate('user', 'name email role');
        studentProfiles.forEach((sp) => {
          if (sp.user) contacts.push({ _id: sp.user._id, name: sp.user.name, email: sp.user.email, role: 'student' });
        });
        // 2. Parents of those students (can message each parent)
        const parentIds = await StudentProfile.distinct('parent', { _id: { $in: assignedIds } });
        const validParentIds = parentIds.filter((id) => id != null);
        if (validParentIds.length) {
          const parentProfiles = await ParentProfile.find({ _id: { $in: validParentIds } }).populate('user', 'name email role');
          parentProfiles.forEach((pp) => {
            if (pp.user) contacts.push({ _id: pp.user._id, name: pp.user.name, email: pp.user.email, role: 'parent' });
          });
        }
        // 3. Admin (can message any admin)
        const adminUsers = await User.find({ role: 'admin' }).select('name email role');
        adminUsers.forEach((u) => contacts.push({ _id: u._id, name: u.name, email: u.email, role: u.role }));
      }
    } else if (me.role === 'admin') {
      const teachers = await User.find({ role: 'teacher' }).select('name email role');
      teachers.forEach((u) => contacts.push({ _id: u._id, name: u.name, email: u.email, role: u.role }));
    } else if (me.role === 'parent') {
      const profile = await ParentProfile.findOne({ user: me._id }).populate('linkedStudents');
      if (profile && profile.linkedStudents && profile.linkedStudents.length) {
        const mentorIds = [...new Set(profile.linkedStudents.map((s) => s.mentor).filter(Boolean))];
        const teacherProfiles = await TeacherProfile.find({ _id: { $in: mentorIds } }).populate('user', 'name email role');
        teacherProfiles.forEach((tp) => {
          if (tp.user) contacts.push({ _id: tp.user._id, name: tp.user.name, email: tp.user.email, role: 'teacher' });
        });
      }
    }

    res.json({ success: true, contacts });
  } catch (err) {
    next(err);
  }
};

/** List my conversations with last message preview. */
exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'name role')
      .lean();
    const list = [];
    for (const c of conversations) {
      const other = c.participants.find((p) => p._id.toString() !== req.user._id.toString());
      const lastMsg = await Message.findOne({ conversation: c._id }).sort({ createdAt: -1 }).lean();
      list.push({
        _id: c._id,
        other: other ? { _id: other._id, name: other.name, role: other.role } : null,
        lastMessage: lastMsg ? { content: lastMsg.content.substring(0, 60), createdAt: lastMsg.createdAt } : null,
        lastMessageAt: c.lastMessageAt,
      });
    }
    res.json({ success: true, conversations: list });
  } catch (err) {
    next(err);
  }
};

/** Create or get conversation with another user (if allowed). */
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const otherUserId = req.body.otherUserId || req.body.otherUser;
    if (!otherUserId) {
      return res.status(400).json({ success: false, message: 'otherUserId required.' });
    }
    const otherId = mongoose.Types.ObjectId.isValid(otherUserId) ? otherUserId : null;
    if (!otherId) return res.status(400).json({ success: false, message: 'Invalid otherUserId.' });

    const meId = req.user._id;
    if (otherId.toString() === meId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot chat with yourself.' });
    }

    const participants = normalizeParticipants(meId, otherId);
    let conv = await Conversation.findOne({ participants: { $all: participants } })
      .populate('participants', 'name role');
    if (!conv) {
      const allowed = await canChatWith(req.user, otherId);
      if (!allowed) {
        return res.status(403).json({ success: false, message: 'You are not allowed to chat with this user.' });
      }
      conv = await Conversation.create({ participants });
      conv = await Conversation.findById(conv._id).populate('participants', 'name role');
    }
    const other = conv.participants.find((p) => p._id.toString() !== meId.toString());
    res.json({ success: true, conversation: { _id: conv._id, other: other ? { _id: other._id, name: other.name, role: other.role } : null, participants: conv.participants } });
  } catch (err) {
    next(err);
  }
};

async function canChatWith(me, otherUserId) {
  const other = await User.findById(otherUserId).select('role');
  if (!other) return false;
  if (me.role === 'student') {
    const profile = await StudentProfile.findOne({ user: me._id }).populate('mentor', 'user');
    return profile && profile.mentor && profile.mentor.user && profile.mentor.user.toString() === otherUserId.toString();
  }
  if (me.role === 'teacher') {
    if (other.role === 'admin') return true;
    if (other.role === 'student') {
      const tp = await TeacherProfile.findOne({ user: me._id });
      const sp = await StudentProfile.findOne({ user: otherUserId });
          return tp && sp && tp.assignedStudents && tp.assignedStudents.some((id) => id.toString() === sp._id.toString());
        }
    if (other.role === 'parent') {
      const tp = await TeacherProfile.findOne({ user: me._id });
      const parentProfile = await ParentProfile.findOne({ user: otherUserId });
      if (!parentProfile || !parentProfile.linkedStudents || !parentProfile.linkedStudents.length) return false;
      const linkedIds = parentProfile.linkedStudents.map((id) => id.toString());
      const myStudentIds = (tp && tp.assignedStudents) ? tp.assignedStudents.map((id) => id.toString()) : [];
      return linkedIds.some((id) => myStudentIds.includes(id));
    }
    return false;
  }
  if (me.role === 'admin') return other.role === 'teacher';
  if (me.role === 'parent') {
    const pp = await ParentProfile.findOne({ user: me._id }).populate('linkedStudents');
    if (!pp || !pp.linkedStudents) return false;
    const mentorIds = [...new Set(pp.linkedStudents.map((s) => s.mentor).filter(Boolean))];
    const teacherProfile = await TeacherProfile.findOne({ user: otherUserId });
    return teacherProfile && mentorIds.some((id) => id && id.toString() === teacherProfile._id.toString());
  }
  return false;
}

/** Get conversation with messages (paginated). */
exports.getConversationWithMessages = async (req, res, next) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id })
      .populate('participants', 'name role');
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const before = req.query.before ? new Date(req.query.before) : null;
    let q = { conversation: conv._id };
    if (before) q.createdAt = { $lt: before };
    const messages = await Message.find(q).sort({ createdAt: -1 }).limit(limit).populate('sender', 'name role').lean();
    messages.reverse();
    const other = conv.participants.find((p) => p._id.toString() !== req.user._id.toString());
    res.json({
      success: true,
      conversation: { _id: conv._id, other: other ? { _id: other._id, name: other.name, role: other.role } : null },
      messages,
    });
  } catch (err) {
    next(err);
  }
};

/** Send a message. */
exports.sendMessage = async (req, res, next) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    const content = (req.body.content || '').trim();
    if (!content) return res.status(400).json({ success: false, message: 'Content required.' });
    const msg = await Message.create({
      conversation: conv._id,
      sender: req.user._id,
      content,
    });
    await Conversation.updateOne({ _id: conv._id }, { lastMessageAt: new Date() });
    const populated = await Message.findById(msg._id).populate('sender', 'name role');
    res.status(201).json({ success: true, message: populated });
  } catch (err) {
    next(err);
  }
};

/** Mark a message as read. */
exports.markMessageRead = async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.id).populate('conversation');
    if (!msg || !msg.conversation) return res.status(404).json({ success: false, message: 'Message not found.' });
    const inConv = msg.conversation.participants.some((p) => p.toString() === req.user._id.toString());
    if (!inConv) return res.status(403).json({ success: false, message: 'Not in this conversation.' });
    if (!msg.readBy) msg.readBy = [];
    if (!msg.readBy.some((id) => id.toString() === req.user._id.toString())) {
      msg.readBy.push(req.user._id);
      await msg.save();
    }
    res.json({ success: true, message: msg });
  } catch (err) {
    next(err);
  }
};
