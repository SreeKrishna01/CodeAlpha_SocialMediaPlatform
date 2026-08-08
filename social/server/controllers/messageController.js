const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Clear chats / messages older than 24 hours
const cleanExpiredMessages = async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await Message.deleteMany({ createdAt: { $lt: cutoff } });
  const convs = await Conversation.find({});
  for (const conv of convs) {
    const count = await Message.countDocuments({ conversation: conv._id });
    if (count === 0) {
      await Conversation.deleteOne({ _id: conv._id });
    }
  }
};

exports.getConversations = async (req, res, next) => {
  try {
    await cleanExpiredMessages();

    const conversations = await Conversation.find({ participants: req.userId })
      .populate('participants', 'name username avatar isOnline')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    // Mark the other user's messages as delivered (single -> double tick)
    for (const conv of conversations) {
      await Message.updateMany(
        {
          conversation: conv._id,
          sender: { $ne: req.userId },
          deliveredAt: null,
        },
        { $set: { deliveredAt: new Date() } }
      );
    }

    const result = conversations.map((conv) => {
      const other = conv.participants.find(
        (p) => p._id.toString() !== req.userId
      );
      return {
        id: conv._id,
        otherUser: other,
        lastMessage: conv.lastMessage,
        updatedAt: conv.updatedAt,
        unread: conv.lastMessage &&
          conv.lastMessage.sender.toString() !== req.userId &&
          !conv.lastMessage.readBy.some((id) => id.toString() === req.userId)
            ? 1
            : 0,
      };
    });

    res.json({ conversations: result });
  } catch (err) {
    next(err);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const { userId: otherId } = req.params;

    await cleanExpiredMessages();

    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, otherId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.userId, otherId],
      });
    }

    const messages = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name username avatar')
      .sort({ createdAt: 1 });

    // Viewing a thread = mark the other user's messages as read (double -> blue tick)
    await Message.updateMany(
      { conversation: conversation._id, sender: { $ne: req.userId } },
      { $set: { deliveredAt: new Date() }, $addToSet: { readBy: req.userId } }
    );

    const updated = await Message.find({ conversation: conversation._id })
      .populate('sender', 'name username avatar')
      .sort({ createdAt: 1 });

    res.json({ messages: updated, conversationId: conversation._id });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { userId: otherId } = req.params;
    const { text, image, attachments, postId, share } = req.body;

    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, otherId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.userId, otherId],
      });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.userId,
      text: text || '',
      image: image || '',
      attachments: Array.isArray(attachments) ? attachments : [],
      postId: postId || null,
      share: share || null,
      readBy: [req.userId],
    });

    conversation.lastMessage = message._id;
    await conversation.save();

    const populated = await message.populate('sender', 'name username avatar');
    res.status(201).json({ message: populated });
  } catch (err) {
    next(err);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.userId } },
      { $addToSet: { readBy: req.userId } }
    );
    res.json({ message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
};
