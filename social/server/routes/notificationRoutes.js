const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  getNotifications,
  markAllRead,
} = require('../controllers/notificationController');

router.get('/', auth, getNotifications);
router.put('/read', auth, markAllRead);

module.exports = router;
