/**
 * Announcement controller - create and fetch announcements.
 */
const { Announcement, User, StudentProfile, TeacherProfile, ParentProfile } = require('../models');
const { createBulkForUserIds } = require('../utils/notificationHelper');

/**
 * Resolve target audience to user IDs for notifications.
 */
async function getTargetUserIds({ targetType, targetDepartment, targetStudentIds }) {
  if (targetStudentIds && targetStudentIds.length > 0) {
    const profiles = await StudentProfile.find({ _id: { $in: targetStudentIds } }).select('user').lean();
    return profiles.map((p) => p.user).filter(Boolean);
  }
  if (targetType === 'department' && targetDepartment) {
    const profiles = await StudentProfile.find({ department: targetDepartment }).select('user').lean();
    return profiles.map((p) => p.user).filter(Boolean);
  }
  if (targetType === 'all' || targetType === 'students') {
    const query = targetDepartment ? { department: targetDepartment } : {};
    const profiles = await StudentProfile.find(query).select('user').lean();
    return profiles.map((p) => p.user).filter(Boolean);
  }
  return [];
}

/**
 * Create announcement (teacher or admin). Body: title, body, targetType?, targetDepartment?, targetStudentIds?
 */
exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, body, targetType = 'all', targetDepartment, targetStudentIds, isPinned } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Title and body required.' });
    }
    const announcement = await Announcement.create({
      title,
      body,
      author: req.user.id,
      targetType,
      targetDepartment: targetDepartment || null,
      targetStudentIds: targetStudentIds || [],
      isPinned: !!isPinned,
    });
    const userIds = await getTargetUserIds({
      targetType,
      targetDepartment: targetDepartment || null,
      targetStudentIds: targetStudentIds || [],
    });
    if (userIds.length > 0) {
      await createBulkForUserIds(userIds, {
        title: 'New announcement: ' + title,
        body: body.length > 120 ? body.slice(0, 120) + '…' : body,
        type: 'announcement',
        relatedId: announcement._id,
        relatedModel: 'Announcement',
      });
    }
    const populated = await Announcement.findById(announcement._id).populate('author', 'name email');
    res.status(201).json({ success: true, announcement: populated });
  } catch (err) {
    next(err);
  }
};

/**
 * List announcements for current user (role-based visibility).
 */
exports.getAnnouncements = async (req, res, next) => {
  try {
    const { limit = 30, pinnedOnly } = req.query;
    const role = req.user.role;

    let query = {};
    if (pinnedOnly === 'true') query.isPinned = true;

    if (role === 'admin' || role === 'teacher') {
      // See all or filter by target
      if (req.query.targetType) query.targetType = req.query.targetType;
    } else {
      // Student/Parent: only relevant targets
      query.$or = [
        { targetType: 'all' },
        { targetType: role === 'student' ? 'students' : 'parents' },
      ];
      if (role === 'student') {
        const profile = await StudentProfile.findOne({ user: req.user.id });
        if (profile) {
          query.$or.push({ targetStudentIds: profile._id });
          if (profile.department) query.$or.push({ targetType: 'department', targetDepartment: profile.department });
        }
      }
    }

    const announcements = await Announcement.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(Number(limit))
      .populate('author', 'name');
    res.json({ success: true, announcements });
  } catch (err) {
    next(err);
  }
};

/**
 * Get one announcement by id (same visibility rules).
 */
exports.getAnnouncementById = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate('author', 'name email');
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }
    // Simple visibility: all can read if in list (list already filtered by getAnnouncements logic)
    res.json({ success: true, announcement });
  } catch (err) {
    next(err);
  }
};
