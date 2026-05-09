const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// POST /api/project/critique
router.post('/critique', protect, async (req, res) => {
  try {
    const { projectDescription, techStack, targetRole } = req.body;
    
    if (!projectDescription) {
      return res.status(400).json({ success: false, message: 'Project description is required' });
    }

    const mlResponse = await axios.post(`${ML_URL}/critique-project`, {
      project_description: projectDescription,
      tech_stack: techStack || [],
      target_role: targetRole || req.user.profile?.targetRole || 'Software Engineer',
      ai_settings: {
        provider: req.user.aiSettings?.provider || 'ollama',
        ollamaHost: req.user.aiSettings?.ollamaHost || 'http://127.0.0.1:11434',
        ollamaModel: req.user.aiSettings?.ollamaModel || 'llama3',
        geminiModel: req.user.aiSettings?.geminiModel || 'gemini-1.5-flash',
        geminiApiKey: req.user.aiSettings?.geminiApiKey || '',
      },
    }, { timeout: 30000 });

    res.json({ success: true, critique: mlResponse.data });
  } catch (error) {
    console.error('Project Critique Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
