const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');
const multer = require('multer');
const FormData = require('form-data');

const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const ML_URL = (process.env.ML_SERVICE_URL || 'http://localhost:8000').replace(/\/$/, '');

const getMLUrl = (path) => `${ML_URL}/${path.replace(/^\//, '')}`;

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
      timeout: 45000,
    });

    // Save parsed text to user profile for future use (e.g., Resume-based Interview)
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'profile.resumeText': mlResponse.data.text }
    });

    res.json({ success: true, text: mlResponse.data.text });
  } catch (error) {
    console.error('Resume Upload Proxy Error:', {
      message: error.message,
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data
    });
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: error.response?.data || 'No further details from ML service'
    });
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
      }, { timeout: 60000 });  // increased for AI-powered analysis
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
  const hasQuantified = /\d+\s*%|\d+x\b|\$[\d,]+|\d+\s+(?:users?|customers?)/i.test(resumeText);
  const hasActionVerbs = /developed|built|designed|implemented|led|managed|optimized|reduced|increased|architected/i.test(resumeText);
  const hasTechStack = /javascript|python|react|node|aws|docker|kubernetes|sql|mongodb|typescript/i.test(resumeText.toLowerCase());
  const hasGithub = /github\.com/i.test(resumeText);
  const hasLinkedin = /linkedin\.com|linkedin\.in/i.test(resumeText);
  const hasDates = /\b(20\d{2}|19\d{2})\b/.test(resumeText);
  const goodLength = wordCount >= 200 && wordCount <= 1000;

  // Deterministic scoring - no Math.random()
  const atsScore = Math.min(100,
    (hasQuantified ? 20 : 0) +
    (hasActionVerbs ? 20 : 0) +
    (hasTechStack ? 20 : 0) +
    (hasGithub ? 10 : 0) +
    (hasLinkedin ? 10 : 0) +
    (goodLength ? 10 : wordCount > 100 ? 5 : 0) +
    (hasDates ? 10 : 0)
  );

  const credibilityScore = Math.min(100,
    (hasQuantified ? 30 : 0) +
    (hasDates ? 25 : 0) +
    (hasGithub ? 20 : 0) +
    (hasLinkedin ? 15 : 0) +
    (goodLength ? 10 : 0)
  );

  // JD match: keyword overlap (no random)
  let jdMatchScore = null;
  if (jobDescription && jobDescription.trim()) {
    const jdWords = new Set(jobDescription.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
    const resumeWords = new Set(resumeText.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
    const overlap = [...jdWords].filter(w => resumeWords.has(w)).length;
    jdMatchScore = Math.min(100, Math.round((overlap / Math.max(jdWords.size, 1)) * 100));
  }

  return {
    ats_score: atsScore,
    jd_match: jdMatchScore,
    credibility_score: credibilityScore,
    word_count: wordCount,
    ai_powered: false,
    entities: {
      skills: ['JavaScript', 'Python', 'React', 'Node.js', 'Docker'].filter(s =>
        resumeText.toLowerCase().includes(s.toLowerCase())
      ),
      skills_count: ['JavaScript', 'Python', 'React', 'Node.js', 'Docker'].filter(s =>
        resumeText.toLowerCase().includes(s.toLowerCase())
      ).length,
    },
    skills_gap: jobDescription ? ['System Design', 'Cloud Architecture', 'Kubernetes'] : [],
    suggestions: [
      !hasQuantified && { category: 'Impact', priority: 'high', text: 'No quantified achievements found. Add metrics: "Reduced latency by 35%", "Served 50K daily users".' },
      !hasActionVerbs && { category: 'Impact', priority: 'high', text: 'Weak action verbs. Lead bullets with: Architected, Deployed, Optimized, Reduced.' },
      !hasGithub && { category: 'Portfolio', priority: 'medium', text: 'No GitHub link detected. Add github.com/yourname.' },
      !hasLinkedin && { category: 'Profile', priority: 'medium', text: 'No LinkedIn URL found. Add linkedin.com/in/yourname.' },
      { category: 'Summary', priority: 'medium', text: 'Add a 3-4 sentence professional summary at the top of your resume.' },
    ].filter(Boolean),
    strengths: [
      hasActionVerbs ? 'Good use of action-oriented language in bullet points' : 'Structured resume layout',
      hasTechStack ? 'Clear technical skills section covering key technologies' : 'Professional format maintained',
      goodLength ? `Well-calibrated resume length (${wordCount} words)` : 'Content provided for analysis',
    ],
    score_breakdown: {
      format: Math.min(100, atsScore + 5),
      content: Math.min(100, 40 + (hasTechStack ? 20 : 0) + (hasActionVerbs ? 20 : 0) + (hasQuantified ? 20 : 0)),
      keywords: Math.min(100, (hasTechStack ? 40 : 10) + (jdMatchScore ? Math.floor(jdMatchScore / 2) : 20)),
      impact: Math.min(100, hasQuantified ? 70 : 30),
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
