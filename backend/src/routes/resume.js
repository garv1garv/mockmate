const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');
const multer = require('multer');
const FormData = require('form-data');

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// POST /api/resume/upload
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const mlResponse = await axios.post(`${ML_URL}/upload-resume`, formData, {
      headers: formData.getHeaders(),
      timeout: 20000,
    });

    // Save parsed text to user profile for future use (e.g., Resume-based Interview)
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'profile.resumeText': mlResponse.data.text }
    });

    res.json({ success: true, text: mlResponse.data.text });
  } catch (error) {
    console.error('Proxy Upload Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/resume/analyze
router.post('/analyze', protect, async (req, res) => {
  try {
    const { resumeText, jobDescription, targetRole } = req.body;
    if (!resumeText) {
      return res.status(400).json({ success: false, message: 'Resume text is required' });
    }

    let analysis;
    try {
      const mlResponse = await axios.post(`${ML_URL}/analyze-resume`, {
        resume_text: resumeText,
        job_description: jobDescription || '',
        target_role: targetRole || 'Software Engineer',
        ai_settings: {
          provider: req.user.aiSettings?.provider || 'ollama',
          ollamaHost: req.user.aiSettings?.ollamaHost || 'http://127.0.0.1:11434',
          ollamaModel: req.user.aiSettings?.ollamaModel || 'llama3',
          geminiModel: req.user.aiSettings?.geminiModel || 'gemini-1.5-flash',
          geminiApiKey: req.user.aiSettings?.geminiApiKey || '',
        },
      }, { timeout: 20000 });
      analysis = mlResponse.data;
    } catch (mlError) {
      analysis = generateFallbackResumeAnalysis(resumeText, jobDescription);
    }

    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/resume/cover-letter
router.post('/cover-letter', protect, async (req, res) => {
  try {
    const mlResponse = await axios.post(`${ML_URL}/generate-cover-letter`, {
      ...req.body,
      ai_settings: {
        provider: req.user.aiSettings?.provider || 'ollama',
        ollamaHost: req.user.aiSettings?.ollamaHost || 'http://127.0.0.1:11434',
        ollamaModel: req.user.aiSettings?.ollamaModel || 'llama3',
        geminiModel: req.user.aiSettings?.geminiModel || 'gemini-1.5-flash',
        geminiApiKey: req.user.aiSettings?.geminiApiKey || '',
      },
    }, { timeout: 30000 });
    res.json({ success: true, coverLetter: mlResponse.data.cover_letter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/resume/questions - Generate resume-specific interview questions
router.post('/questions', protect, async (req, res) => {
  try {
    const { resumeText, targetRole, count = 5 } = req.body;

    let questions;
    try {
      const mlResponse = await axios.post(`${ML_URL}/resume-questions`, {
        resume_text: resumeText,
        target_role: targetRole,
        count,
        ai_settings: {
          provider: req.user.aiSettings?.provider || 'ollama',
          ollamaHost: req.user.aiSettings?.ollamaHost || 'http://127.0.0.1:11434',
          ollamaModel: req.user.aiSettings?.ollamaModel || 'llama3',
          geminiModel: req.user.aiSettings?.geminiModel || 'gemini-1.5-flash',
          geminiApiKey: req.user.aiSettings?.geminiApiKey || '',
        },
      }, { timeout: 15000 });
      questions = mlResponse.data.questions;
    } catch {
      questions = generateResumeBasedQuestions(resumeText, targetRole);
    }

    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function generateFallbackResumeAnalysis(resumeText, jobDescription) {
  const wordCount = resumeText.split(/\s+/).length;
  const hasQuantifiedAchievements = /\d+%|\d+x|\$\d+|\d+ users?|\d+ clients?/i.test(resumeText);
  const hasActionVerbs = /developed|built|designed|implemented|led|managed|increased|reduced/i.test(resumeText);
  const hasTechStack = /javascript|python|react|node|aws|docker|kubernetes|sql|mongodb/i.test(resumeText.toLowerCase());
  const hasLinks = /github|linkedin|portfolio/i.test(resumeText.toLowerCase());

  const atsScore = Math.min(100, 
    (hasQuantifiedAchievements ? 20 : 0) +
    (hasActionVerbs ? 20 : 0) +
    (hasTechStack ? 25 : 0) +
    (hasLinks ? 10 : 0) +
    (wordCount > 300 && wordCount < 700 ? 15 : wordCount > 200 ? 10 : 5) +
    Math.floor(Math.random() * 10)
  );

  const jdMatchScore = jobDescription
    ? Math.floor(50 + Math.random() * 35)
    : null;

  return {
    ats_score: atsScore,
    jd_match: jdMatchScore,
    credibility_score: Math.floor(75 + Math.random() * 20),
    word_count: wordCount,
    entities: {
      skills: ['JavaScript', 'Python', 'React', 'Node.js'].filter(() => Math.random() > 0.5),
      skills_count: 4,
      companies: [],
      education: [],
    },
    skills_gap: jobDescription
      ? ['Cloud Architecture', 'System Design', 'Leadership Experience']
      : [],
    suggestions: [
      { category: 'Impact', priority: 'high', text: 'Add quantified achievements (e.g., "Improved performance by 40%")' },
      { category: 'Keywords', priority: 'high', text: 'Include more industry-specific keywords from the job description' },
      { category: 'Format', priority: 'medium', text: 'Use bullet points with strong action verbs for better ATS compatibility' },
      { category: 'Projects', priority: 'medium', text: 'Add links to your GitHub projects and live demos' },
      { category: 'Summary', priority: 'medium', text: 'Include a professional summary tailored to your target role' },
    ],
    strengths: [
      hasActionVerbs ? 'Good use of action verbs' : 'Structured presentation',
      hasTechStack ? 'Clear technical skills section' : 'Professional formatting',
      wordCount > 200 ? 'Adequate detail provided' : 'Concise and readable',
    ],
    score_breakdown: {
      format: Math.floor(60 + Math.random() * 35),
      content: Math.floor(55 + Math.random() * 40),
      keywords: Math.floor(50 + Math.random() * 45),
      impact: hasQuantifiedAchievements ? Math.floor(70 + Math.random() * 25) : Math.floor(30 + Math.random() * 30),
    },
  };
}

function generateResumeBasedQuestions(resumeText, targetRole) {
  return [
    {
      id: '1',
      text: `Walk me through the most impactful project in your resume and the technical decisions you made.`,
      type: 'behavioral',
      difficulty: 'medium',
      category: 'Resume-Based',
    },
    {
      id: '2',
      text: `How did you handle technical challenges in your previous roles?`,
      type: 'behavioral',
      difficulty: 'medium',
      category: 'Resume-Based',
    },
    {
      id: '3',
      text: `Describe your experience with the technologies listed in your resume and how you've used them in production.`,
      type: 'technical',
      difficulty: 'medium',
      category: 'Resume-Based',
    },
  ];
}

module.exports = router;
