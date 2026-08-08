const Story = require('../models/Story');
const { saveDataUrl, removeFiles } = require('../utils/mediaStore');

exports.getStories = async (req, res, next) => {
  try {
    const stories = await Story.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name username avatar');
    res.json({ stories });
  } catch (err) {
    next(err);
  }
};

exports.createStory = async (req, res, next) => {
  try {
    const { image, mediaType } = req.body;
    if (!image) return res.status(400).json({ message: 'Story media is required' });
    const saved = await saveDataUrl(image, 'stories');
    const story = await Story.create({
      author: req.userId,
      image: saved,
      mediaType: mediaType || 'image',
    });
    const populated = await story.populate('author', 'name username avatar');
    res.status(201).json({ story: populated });
  } catch (err) {
    next(err);
  }
};

exports.viewStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    if (!story.viewedBy.some((id) => id.toString() === req.userId)) {
      story.viewedBy.push(req.userId);
      await story.save();
    }
    res.json({ message: 'Story viewed' });
  } catch (err) {
    next(err);
  }
};

exports.deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story not found' });
    if (story.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    removeFiles(story.image);
    await story.deleteOne();
    res.json({ message: 'Story deleted' });
  } catch (err) {
    next(err);
  }
};
