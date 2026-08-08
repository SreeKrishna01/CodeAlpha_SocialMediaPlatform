const router = require('express').Router();
const auth = require('../middleware/auth');
const { getStories, createStory, viewStory, deleteStory } = require('../controllers/storyController');

router.get('/', getStories);
router.post('/', auth, createStory);
router.post('/:id/view', auth, viewStory);
router.delete('/:id', auth, deleteStory);

module.exports = router;
