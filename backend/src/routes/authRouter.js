const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { register, login, demoLogin, getMe, updateProfile } = require('./auth');

router.post('/register', register);
router.post('/login', login);
router.post('/demo', demoLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
