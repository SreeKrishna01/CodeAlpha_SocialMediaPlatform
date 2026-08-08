const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const PostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    caption: { type: String, default: '', maxlength: 2200 },
    images: [{ type: String }],
    mediaTypes: [{ type: String, enum: ['image', 'video'] }],
    ratios: [{ type: String, enum: ['1:1', '4:5', '9:16'] }],
    adjusts: [{ type: mongoose.Schema.Types.Mixed }],
    location: { type: String, default: '' },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [CommentSchema],
    shares: { type: Number, default: 0 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

PostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);
