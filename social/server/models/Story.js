const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    image: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    viewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', StorySchema);
