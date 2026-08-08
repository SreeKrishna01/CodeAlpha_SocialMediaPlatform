const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    image: { type: String, default: '' },
    attachments: [
      {
        kind: { type: String, enum: ['image', 'video', 'audio', 'pdf', 'file'], default: 'file' },
        url: { type: String, default: '' },
        name: { type: String, default: '' },
        size: { type: Number, default: 0 },
      },
    ],
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
    share: { type: mongoose.Schema.Types.Mixed, default: null },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', MessageSchema);
