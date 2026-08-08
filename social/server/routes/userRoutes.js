const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getUserProfile,
  updateProfile,
  toggleFollow,
  searchUsers,
  getSuggestions,
  getExploreUsers,
  getConnections,
  getSavedPosts,
  getUserFollowers,
  getUserFollowing,
  deleteAccount,
  updateSettings,
} = require('../controllers/userController');

router.get('/search', searchUsers);
router.get('/suggestions', auth, getSuggestions);
router.get('/explore', getExploreUsers);
router.get('/connections', auth, getConnections);
router.get('/saved', auth, getSavedPosts);
router.delete('/account', auth, deleteAccount);
router.put('/profile', auth, updateProfile);
router.put('/settings', auth, updateSettings);
router.get('/:username/followers', auth, getUserFollowers);
router.get('/:username/following', auth, getUserFollowing);
router.get('/:username', getUserProfile);
router.post('/:id/follow', auth, toggleFollow);

module.exports = router;
