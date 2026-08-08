const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .populate('sender', 'name username avatar')
      .populate('post', 'caption images')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.userId,
      read: false,
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

exports.createNotification = async (recipientId, senderId, type, postId, text) => {
  try {
    if (recipientId.toString() === senderId.toString()) return null;
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      post: postId || undefined,
      text: text || '',
    });
    return notification;
  } catch {
    return null;
  }
};
