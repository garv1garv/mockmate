const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// POST /api/learning-path/generate
router.post('/generate', protect, async (req, res) => {
  try {
    const { targetRole, currentSkills, experienceLevel, availableHours } = req.body;

    console.log('Generating Learning Path via:', ML_URL);
    const mlResponse = await axios.post(`${ML_URL}/generate-learning-path`, {
      ...req.body,
      ai_settings: {
        provider: req.user.aiSettings?.provider || 'ollama',
        ollamaHost: req.user.aiSettings?.ollamaHost || 'http://127.0.0.1:11434',
        ollamaModel: req.user.aiSettings?.ollamaModel || 'llama3',
        geminiModel: req.user.aiSettings?.geminiModel || 'gemini-1.5-flash',
        geminiApiKey: req.user.aiSettings?.geminiApiKey || '',
      },
    }, { timeout: 60000 });

    res.json(mlResponse.data);
  } catch (error) {
    console.error('Learning Path Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate learning path',
      error: error.message 
    });
  }
});

module.exports = router;
