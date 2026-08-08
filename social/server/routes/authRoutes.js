const router = require('express').Router();
const auth = require('../middleware/auth');
const { register, login, me, logout, changePassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.post('/logout', auth, logout);
router.post('/change-password', auth, changePassword);

module.exports = router;
