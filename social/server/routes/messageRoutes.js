const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getConversations,
  getMessages,
  sendMessage,
  markRead,
} = require('../controllers/messageController');

router.get('/', auth, getConversations);
router.get('/:userId', auth, getMessages);
router.post('/:userId', auth, sendMessage);
router.put('/:conversationId/read', auth, markRead);

module.exports = router;
