const User = require('../models/User');
const Post = require('../models/Post');
const Story = require('../models/Story');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const { createNotification } = require('../controllers/notificationController');
const { saveDataUrl, removeFiles, isDataUrl } = require('../utils/mediaStore');

exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatar verified');

    res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        verified: user.verified,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        followers: user.followers,
        following: user.following,
        isOnline: user.activityStatus ? user.isOnline : false,
      },
      posts,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, location, avatar } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (avatar !== undefined) {
      if (isDataUrl(avatar)) {
        removeFiles(user.avatar);
        user.avatar = await saveDataUrl(avatar, 'avatars');
      } else {
        user.avatar = avatar;
      }
    }

    await user.save();
    res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        verified: user.verified,
        followers: user.followers,
        following: user.following,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const { notificationsEnabled, activityStatus } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (typeof notificationsEnabled === 'boolean') {
      user.notificationsEnabled = notificationsEnabled;
    }
    if (typeof activityStatus === 'boolean') {
      user.activityStatus = activityStatus;
    }
    await user.save();

    res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        verified: user.verified,
        followers: user.followers,
        following: user.following,
        notificationsEnabled: user.notificationsEnabled,
        activityStatus: user.activityStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleFollow = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.userId);
    if (!target || !me) return res.status(404).json({ message: 'User not found' });
    if (target._id.equals(me._id)) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const idx = me.following.findIndex((id) => id.equals(target._id));
    let following;
    if (idx === -1) {
      me.following.push(target._id);
      target.followers.push(me._id);
      following = true;
      await createNotification(target._id, req.userId, 'follow');
    } else {
      me.following.splice(idx, 1);
      target.followers = target.followers.filter((id) => !id.equals(me._id));
      following = false;
    }
    await me.save();
    await target.save();
    res.json({ following, followersCount: target.followers.length });
  } catch (err) {
    next(err);
  }
};

exports.searchUsers = async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (!q.trim()) return res.json({ users: [] });
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { username: { $regex: q, $options: 'i' } },
      ],
    })
      .select('name username avatar verified')
      .limit(20);
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const me = await User.findById(req.userId).select('following');
    if (!me) return res.status(404).json({ message: 'User not found' });

    const suggestions = await User.find({
      _id: { $nin: [...me.following, req.userId] },
    })
      .select('name username avatar verified bio')
      .limit(10);

    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
};

exports.getExploreUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('name username avatar verified bio')
      .limit(20);
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

exports.getConnections = async (req, res, next) => {
  try {
    const me = await User.findById(req.userId).select('followers following');
    if (!me) return res.status(404).json({ message: 'User not found' });

    const connectionIds = [...new Set([...me.followers, ...me.following])];

    const connections = await User.find({ _id: { $in: connectionIds } })
      .select('name username avatar verified isOnline activityStatus bio');

    const result = connections.map((u) => {
      const doc = u.toObject();
      doc.isOnline = doc.activityStatus && doc.isOnline;
      return doc;
    });

    res.json({ connections: result });
  } catch (err) {
    next(err);
  }
};

exports.getSavedPosts = async (req, res, next) => {
  try {
    const me = await User.findById(req.userId).select('saved');
    if (!me) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ _id: { $in: me.saved } })
      .sort({ updatedAt: -1 })
      .populate('author', 'name username avatar verified location')
      .populate('comments.author', 'name username avatar');

    res.json({ posts, savedIds: me.saved });
  } catch (err) {
    next(err);
  }
};

const userListSelect = 'name username avatar verified bio';

exports.getUserFollowers = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('followers');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const users = await User.find({ _id: { $in: user.followers } })
      .select(userListSelect)
      .sort({ name: 1 });

    res.json({ users });
  } catch (err) {
    next(err);
  }
};

exports.getUserFollowing = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('following');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const users = await User.find({ _id: { $in: user.following } })
      .select(userListSelect)
      .sort({ name: 1 });

    res.json({ users });
  } catch (err) {
    next(err);
  }
};

exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!password || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    const posts = await Post.find({ author: user._id });
    const mediaUrls = [];
    posts.forEach((p) => {
      if (Array.isArray(p.images)) mediaUrls.push(...p.images);
    });
    if (user.avatar) mediaUrls.push(user.avatar);
    try {
      await removeFiles(mediaUrls);
    } catch (e) {
      // ignore missing files
    }

    await Post.deleteMany({ author: user._id });
    await Story.deleteMany({ author: user._id });
    await Message.deleteMany({ $or: [{ sender: user._id }, { share: { author: user.username } }] });
    await Conversation.deleteMany({ participants: user._id });
    await Notification.deleteMany({
      $or: [{ recipient: user._id }, { sender: user._id }],
    });

    await User.updateMany(
      { followers: user._id },
      { $pull: { followers: user._id } }
    );
    await User.updateMany(
      { following: user._id },
      { $pull: { following: user._id } }
    );

    await user.deleteOne();
    res.json({ message: 'Account deleted' });
  } catch (err) {
    next(err);
  }
};
