require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Post = require('./models/Post');
const Story = require('./models/Story');
const Circle = require('./models/Circle');

const AVATAR = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

async function seed() {
  await connectDB();
  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Post.deleteMany({}),
    Story.deleteMany({}),
    Circle.deleteMany({}),
  ]);

  console.log('Creating users...');
  const usersData = [
    { name: 'Sree Kumar', username: 'sree', email: 'sree@example.com', password: 'password123', avatar: AVATAR('sree'), bio: 'Living my best life.', location: 'Chennai, India' },
    { name: 'Arjun Menon', username: 'arjunmenon', email: 'arjun@example.com', password: 'password123', avatar: AVATAR('arjun'), verified: true, location: 'Pune, India', bio: 'Chasing sunsets and dreams.' },
    { name: 'Ananya Rao', username: 'ananya', email: 'ananya@example.com', password: 'password123', avatar: AVATAR('ananya'), location: 'Mumbai, India', bio: 'Coffee and code.' },
    { name: 'Vikram Singh', username: 'vikram', email: 'vikram@example.com', password: 'password123', avatar: AVATAR('vikram'), location: 'Delhi, India', bio: 'Adventure seeker.' },
    { name: 'Diya Sharma', username: 'diya', email: 'diya@example.com', password: 'password123', avatar: AVATAR('diya'), verified: true, location: 'Bengaluru, India', bio: 'Art enthusiast.' },
    { name: 'Krish Patel', username: 'krish', email: 'krish@example.com', password: 'password123', avatar: AVATAR('krish'), location: 'Ahmedabad, India', bio: 'Music lover.' },
    { name: 'Priya Nair', username: 'priya', email: 'priya@example.com', password: 'password123', avatar: AVATAR('priya'), location: 'Kochi, India', bio: 'Travel addict.' },
    { name: 'Rohan Das', username: 'rohan', email: 'rohan@example.com', password: 'password123', avatar: AVATAR('rohan'), location: 'Kolkata, India', bio: 'Foodie at heart.' },
  ];
  const users = await User.create(usersData);
  const [sree, arjun, ananya, vikram, diya, krish, priya, rohan] = users;

  console.log('Creating follow graph...');
  sree.following = [arjun._id, ananya._id, diya._id];
  await sree.save();
  arjun.followers.push(sree._id);
  ananya.followers.push(sree._id);
  diya.followers.push(sree._id);
  await Promise.all([arjun.save(), ananya.save(), diya.save()]);

  console.log('Creating posts (clean - no pre-seeded likes/comments)...');
  await Post.create([
    {
      author: arjun._id,
      caption: 'Chasing sunsets and dreams. 🌅',
      images: ['https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80'],
      location: 'Pune, India',
      tags: ['sunset', 'travel'],
    },
    {
      author: ananya._id,
      caption: 'City lights and late nights 🌃',
      images: ['https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80'],
      location: 'Mumbai, India',
      tags: ['city', 'nightlife'],
    },
    {
      author: vikram._id,
      caption: 'Trail day. Nothing beats fresh air and a good playlist.',
      images: ['https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=80'],
      location: 'Manali, India',
      tags: ['hiking', 'nature'],
    },
    {
      author: diya._id,
      caption: 'Good vibes only. Spread positivity today 💜',
      images: ['https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=80'],
      location: 'Bengaluru, India',
      tags: ['positivity'],
    },
    {
      author: krish._id,
      caption: 'Morning coffee ritual ☕',
      images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80'],
      location: 'Ahmedabad, India',
      tags: ['coffee', 'morning'],
    },
    {
      author: priya._id,
      caption: 'Wanderlust and city dust ✨',
      images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80'],
      location: 'Goa, India',
      tags: ['travel', 'beach'],
    },
    {
      author: rohan._id,
      caption: 'Life is better with good food 🍕',
      images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80'],
      location: 'Kolkata, India',
      tags: ['food'],
    },
    {
      author: sree._id,
      caption: 'Exploring new horizons 🏔️',
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80'],
      location: 'Himachal, India',
      tags: ['mountains', 'adventure'],
    },
  ]);

  console.log('Creating stories...');
  await Story.create([
    { author: ananya._id, image: AVATAR('ananya-story1') },
    { author: vikram._id, image: AVATAR('vikram-story1') },
    { author: diya._id, image: AVATAR('diya-story1') },
    { author: krish._id, image: AVATAR('krish-story1') },
    { author: priya._id, image: AVATAR('priya-story1') },
    { author: rohan._id, image: AVATAR('rohan-story1') },
  ]);

  console.log('Creating circles...');
  await Circle.create([
    {
      name: 'Sunset Chasers',
      description: 'For people who love golden hour.',
      coverImage: 'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=800&q=80',
      members: [arjun._id, ananya._id, priya._id],
    },
    {
      name: 'Weekend Hikers',
      description: 'Plan and share hikes with the community.',
      coverImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80',
      members: [vikram._id, krish._id, rohan._id],
    },
  ]);

  console.log('Seed complete! Demo login: sree@example.com / password123');
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
