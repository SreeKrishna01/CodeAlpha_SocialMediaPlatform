require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Post = require('../models/Post');
const Story = require('../models/Story');
const User = require('../models/User');
const { saveDataUrl, isDataUrl } = require('../utils/mediaStore');

async function run() {
  await connectDB();

  let count = 0;

  const posts = await Post.find();
  for (const post of posts) {
    let changed = false;
    for (let i = 0; i < post.images.length; i++) {
      if (isDataUrl(post.images[i])) {
        post.images[i] = await saveDataUrl(post.images[i], 'posts');
        changed = true;
      }
    }
    if (changed) {
      await post.save();
      count += 1;
    }
  }

  const stories = await Story.find();
  for (const story of stories) {
    if (isDataUrl(story.image)) {
      story.image = await saveDataUrl(story.image, 'stories');
      await story.save();
      count += 1;
    }
  }

  const users = await User.find();
  for (const user of users) {
    if (isDataUrl(user.avatar)) {
      user.avatar = await saveDataUrl(user.avatar, 'avatars');
      await user.save();
      count += 1;
    }
  }

  console.log(`Migrated ${count} records to file storage`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
