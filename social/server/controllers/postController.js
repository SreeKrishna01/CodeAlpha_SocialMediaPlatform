const Post = require('../models/Post');
const User = require('../models/User');
const { createNotification } = require('../controllers/notificationController');
const { saveDataUrls, removeFiles } = require('../utils/mediaStore');

const populateOpts = [
  { path: 'author', select: 'name username avatar verified location' },
  { path: 'comments.author', select: 'name username avatar' },
];

exports.getFeed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const tab = req.query.tab || 'for-you';
    const userId = req.query.userId || null;

    let filter = {};

    if (tab === 'following' && userId) {
      const me = await User.findById(userId).select('following');
      if (me) {
        filter.author = { $in: [...me.following, userId] };
      }
    } else if (tab === 'trending') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filter.createdAt = { $gte: sevenDaysAgo };
    }

    let sort = { createdAt: -1 };
    if (tab === 'trending') {
      sort = { 'likes': -1, createdAt: -1 };
    }

    const posts = await Post.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(populateOpts);

    if (tab === 'trending') {
      posts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    }

    res.json({ posts, page, hasMore: posts.length === limit });
  } catch (err) {
    next(err);
  }
};

exports.getUserPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 })
      .populate(populateOpts);
    res.json({ posts });
  } catch (err) {
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
  try {
    const { caption, images, location, tags, mediaTypes, ratios, adjusts } = req.body;
    const savedImages = await saveDataUrls(images, 'posts');
    const post = await Post.create({
      author: req.userId,
      caption,
      images: savedImages,
      mediaTypes: mediaTypes || [],
      ratios: ratios || [],
      adjusts: adjusts || [],
      location: location || '',
      tags: tags || [],
    });
    const populated = await post.populate(populateOpts);
    res.status(201).json({ post: populated });
  } catch (err) {
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate(populateOpts);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ post });
  } catch (err) {
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }
    removeFiles(post.images);
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const idx = post.likes.findIndex((id) => id.toString() === req.userId);
    let liked;
    if (idx === -1) {
      post.likes.push(req.userId);
      liked = true;
      await createNotification(post.author, req.userId, 'like', post._id);
    } else {
      post.likes.splice(idx, 1);
      liked = false;
    }
    await post.save();
    res.json({ liked, likesCount: post.likes.length });
  } catch (err) {
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ author: req.userId, text: text.trim() });
    await post.save();

    await createNotification(
      post.author,
      req.userId,
      'comment',
      post._id,
      text.trim()
    );

    const populated = await post.populate(populateOpts);
    res.status(201).json({ comments: populated.comments });
  } catch (err) {
    next(err);
  }
};

exports.sharePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.shares += 1;
    await post.save();

    await createNotification(post.author, req.userId, 'share', post._id);
    res.json({ shares: post.shares });
  } catch (err) {
    next(err);
  }
};

exports.toggleSave = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ message: 'User not found' });

    const idx = me.saved.findIndex((id) => id.toString() === req.params.id);
    let saved;
    if (idx === -1) {
      me.saved.push(post._id);
      saved = true;
    } else {
      me.saved.splice(idx, 1);
      saved = false;
    }
    await me.save();
    res.json({ saved, savedCount: me.saved.length });
  } catch (err) {
    next(err);
  }
};
