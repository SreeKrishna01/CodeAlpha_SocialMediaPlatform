const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getFeed,
  createPost,
  getPost,
  deletePost,
  toggleLike,
  addComment,
  sharePost,
  getUserPosts,
  toggleSave,
} = require('../controllers/postController');

router.get('/', getFeed);
router.post('/', auth, createPost);
router.get('/user/:userId', getUserPosts);
router.get('/:id', getPost);
router.delete('/:id', auth, deletePost);
router.post('/:id/like', auth, toggleLike);
router.post('/:id/comments', auth, addComment);
router.post('/:id/share', auth, sharePost);
router.post('/:id/save', auth, toggleSave);

module.exports = router;
