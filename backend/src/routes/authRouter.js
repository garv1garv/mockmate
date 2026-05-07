const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { register, login, demoLogin, getMe, updateProfile, updateAiSettings } = require('./auth');

router.post('/register', register);
router.post('/login', login);
router.post('/demo', demoLogin);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/ai-settings', protect, updateAiSettings);

module.exports = router;
