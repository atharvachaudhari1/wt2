/**
 * Session controller - CRUD for mentoring sessions; Meet link; live status.
 */
const { Session, StudentProfile, TeacherProfile } = require('../models');
const { createBulkForUserIds } = require('../utils/notificationHelper');

/**
 * Get user IDs for student profile IDs.
 */
async function getUserIdsFromStudentProfiles(profileIds) {
  if (!profileIds || profileIds.length === 0) return [];
  const profiles = await StudentProfile.find({ _id: { $in: profileIds } }).select('user').lean();
  return profiles.map((p) => p.user).filter(Boolean);
}

/**
 * Create session (teacher only). Assigns students; can set meetLink later.
 */
exports.createSession = async (req, res, next) => {
  try {
    const teacherProfile = await TeacherProfile.findOne({ user: req.user.id });
    if (!teacherProfile) {
      return res.status(403).json({ success: false, message: 'Teacher profile not found.' });
    }
    const { title, description, students, scheduledAt, duration, meetLink } = req.body;
    if (!title || !scheduledAt) {
      return res.status(400).json({ success: false, message: 'Title and scheduledAt required.' });
    }
    const session = await Session.create({
      title,
      description: description || null,
      teacher: teacherProfile._id,
      students: students || [],
      scheduledAt: new Date(scheduledAt),
      duration: duration || 30,
      meetLink: meetLink || null,
      createdBy: req.user.id,
    });
    const userIds = await getUserIdsFromStudentProfiles(session.students);
    if (userIds.length > 0) {
      const at = new Date(scheduledAt).toLocaleString();
      await createBulkForUserIds(userIds, {
        title: 'New session: ' + title,
        body: 'Scheduled at ' + at,
        type: 'session_reminder',
        relatedId: session._id,
        relatedModel: 'Session',
      });
    }
    const populated = await Session.findById(session._id)
      .populate('teacher', 'user department designation')
      .populate('students', 'user rollNo department');
    res.status(201).json({ success: true, session: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * Update session (teacher): edit fields, upload Meet link, set live status.
 */
exports.updateSession = async (req, res, next) => {
  try {
    const teacherProfile = await TeacherProfile.findOne({ user: req.user.id });
    if (!teacherProfile) {
      return res.status(403).json({ success: false, message: 'Teacher profile not found.' });
    }
    const session = await Session.findOne({ _id: req.params.id, teacher: teacherProfile._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }
    const allowed = ['title', 'description', 'students', 'scheduledAt', 'duration', 'meetLink', 'isLive', 'liveSessionStatus', 'status', 'mentoringNotes'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) session[key] = req.body[key];
    });
    await session.save();
    const populated = await Session.findById(session._id)
      .populate('teacher', 'user department designation')
      .populate('students', 'user rollNo department');
    res.json({ success: true, session: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/teacher/session/:id/meet-link - Teacher uploads Meet link and sets session live.
 */
exports.updateMeetLink = async (req, res, next) => {
  try {
    const teacherProfile = await TeacherProfile.findOne({ user: req.user.id });
    if (!teacherProfile) {
      return res.status(403).json({ success: false, message: 'Teacher profile not found.' });
    }
    const sessionId = req.params.id && String(req.params.id).trim();
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required.' });
    }
    let session;
    try {
      session = await Session.findOne({ _id: sessionId, teacher: teacherProfile._id });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid session ID format.' });
    }
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found or you do not own this session.' });
    }
    const body = req.body || {};
    const meetLink = typeof body.meetLink === 'string' ? body.meetLink.trim() : '';
    if (!meetLink) {
      return res.status(400).json({ success: false, message: 'meetLink is required in the request body.' });
    }
    session.meetLink = meetLink.trim();
    session.isLive = true;
    await session.save();
    const userIds = await getUserIdsFromStudentProfiles(session.students);
    if (userIds.length > 0) {
      await createBulkForUserIds(userIds, {
        title: 'Meet link added: ' + session.title,
        body: meetLink,
        type: 'session_reminder',
        relatedId: session._id,
        relatedModel: 'Session',
      });
    }
    const populated = await Session.findById(session._id)
      .populate('teacher', 'user department designation')
      .populate('students', 'user rollNo department');
    res.json({ success: true, session: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete session (teacher only).
 */
exports.deleteSession = async (req, res, next) => {
  try {
    const teacherProfile = await TeacherProfile.findOne({ user: req.user.id });
    if (!teacherProfile) {
      return res.status(403).json({ success: false, message: 'Teacher profile not found.' });
    }
    const session = await Session.findOneAndDelete({ _id: req.params.id, teacher: teacherProfile._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }
    res.json({ success: true, message: 'Session deleted.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single session by id. Student: only if in session.students; Teacher: own; Admin: any.
 */
exports.getSessionById = async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('teacher', 'user department designation')
      .populate('students', 'user rollNo department');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }
    if (req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: req.user.id });
      if (!profile || !session.students.some((s) => s._id.toString() === profile._id.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    } else if (req.user.role === 'teacher') {
      const tProfile = await TeacherProfile.findOne({ user: req.user.id });
      if (!tProfile || session.teacher._id.toString() !== tProfile._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }
    res.json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

/**
 * List sessions - for student: upcoming sessions where they are in students; for teacher: own; admin: all.
 */
exports.listSessions = async (req, res, next) => {
  try {
    const { upcoming, status, limit = 50 } = req.query;
    let query = {};

    if (req.user.role === 'student') {
      const profile = await StudentProfile.findOne({ user: req.user.id });
      if (!profile) return res.json({ success: true, sessions: [] });
      query.students = profile._id;
    } else if (req.user.role === 'teacher') {
      const profile = await TeacherProfile.findOne({ user: req.user.id });
      if (!profile) return res.json({ success: true, sessions: [] });
      query.teacher = profile._id;
    }
    if (status) query.status = status;
    if (upcoming === 'true') {
      query.scheduledAt = { $gte: new Date() };
      query.status = 'scheduled';
    }

    const sessions = await Session.find(query)
      .sort({ scheduledAt: 1 })
      .limit(Number(limit))
      .populate('teacher', 'user department designation')
      .populate('students', 'user rollNo department');
    res.json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
};
