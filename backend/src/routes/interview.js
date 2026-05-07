const express = require('express');
const router = express.Router();
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { protect } = require('../middleware/auth');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// POST /api/interview/start
router.post('/start', protect, async (req, res) => {
  try {
    const { type, difficulty, targetRole, company, persona, jobDescription } = req.body;
    const sessionId = uuidv4();

    const session = await InterviewSession.create({
      userId: req.user._id,
      sessionId,
      type: type || 'technical',
      difficulty: difficulty || 'medium',
      targetRole: targetRole || req.user.profile?.targetRole || 'Software Engineer',
      company: company || null,
      jobDescription: jobDescription || null,
      interviewerPersona: persona || 'neutral',
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      session,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/interview/question
router.get('/question', protect, async (req, res) => {
  try {
    const { sessionId, type, difficulty, category } = req.query;
    
    // Call ML service for adaptive question generation
    let questionData;
    try {
      const session = await InterviewSession.findOne({ sessionId });
      const mlResponse = await axios.post(`${ML_URL}/generate-question`, {
        type: type || 'technical',
        difficulty: difficulty || 'medium',
        category: category || 'general',
        company: session?.company || null,
        job_description: session?.jobDescription || null,
        user_profile: {
          skills: req.user.profile?.skills || [],
          experience: req.user.profile?.experience || 'fresher',
          weak_topics: req.user.knowledgeGraph?.weakTopics || [],
        },
      }, { timeout: 10000 });
      questionData = mlResponse.data;
    } catch (mlError) {
      // Fallback to curated question bank
      questionData = getFallbackQuestion(type, difficulty, category);
    }

    res.json({ success: true, question: questionData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interview/evaluate
router.post('/evaluate', protect, async (req, res) => {
  try {
    const { sessionId, questionText, userAnswer, expectedAnswer, questionType } = req.body;

    let evaluation;
    try {
      const mlResponse = await axios.post(`${ML_URL}/evaluate-answer`, {
        question: questionText,
        user_answer: userAnswer,
        expected_answer: expectedAnswer,
        answer_type: questionType || 'text',
      }, { timeout: 15000 });
      evaluation = mlResponse.data;
    } catch (mlError) {
      // Fallback evaluation
      evaluation = generateFallbackEvaluation(userAnswer, expectedAnswer);
    }

    // Update session if sessionId provided
    if (sessionId) {
      await InterviewSession.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            questions: {
              questionText,
              userAnswer,
              scores: evaluation.scores,
              feedback: evaluation.feedback,
            },
          },
          $inc: { 'analytics.questionsAnswered': 1 },
        }
      );
    }

    res.json({ success: true, evaluation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/interview/complete
router.post('/complete', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await InterviewSession.findOne({ sessionId, userId: req.user._id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    // Calculate final analytics
    const scores = session.questions.map(q => q.scores?.overall || 0);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const duration = Math.round((Date.now() - session.startTime) / 60000);

    session.status = 'completed';
    session.endTime = new Date();
    session.analytics.averageScore = Math.round(avgScore);
    session.analytics.totalScore = Math.round(avgScore);
    session.analytics.duration = duration;
    session.analytics.overallReadiness = Math.min(100, Math.round(avgScore * 1.1));

    // Generate AI feedback summary
    session.feedback = {
      summary: `Great session! You completed ${scores.length} questions with an average score of ${Math.round(avgScore)}%.`,
      strengths: avgScore > 70 ? ['Strong technical knowledge', 'Clear communication'] : ['Good effort and persistence'],
      improvements: avgScore < 70 ? ['Practice more coding problems', 'Review system design concepts'] : ['Work on edge cases', 'Improve time complexity analysis'],
      nextSteps: ['Review weak areas', 'Schedule another mock interview', 'Practice on LeetCode'],
      readinessScore: Math.min(100, Math.round(avgScore * 1.1)),
    };

    await session.save();

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalSessions': 1, 'stats.totalQuestions': scores.length },
      $set: { 'stats.lastSessionDate': new Date() },
    });

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/interview/history
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const sessions = await InterviewSession.find({
      userId: req.user._id,
      status: 'completed',
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await InterviewSession.countDocuments({
      userId: req.user._id,
      status: 'completed',
    });

    res.json({
      success: true,
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/interview/:sessionId
router.get('/:sessionId', protect, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({
      sessionId: req.params.sessionId,
      userId: req.user._id,
    });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Fallback question generator
function getFallbackQuestion(type, difficulty, category) {
  const questions = {
    technical: {
      easy: [
        { text: 'What is the difference between let, const, and var in JavaScript?', expectedAnswer: 'let and const are block-scoped while var is function-scoped. const cannot be reassigned.', keywords: ['scope', 'block', 'function', 'hoisting'] },
        { text: 'Explain what a REST API is.', expectedAnswer: 'REST is an architectural style for APIs using HTTP methods (GET, POST, PUT, DELETE) with stateless communication.', keywords: ['HTTP', 'stateless', 'endpoints', 'JSON'] },
      ],
      medium: [
        { text: 'Explain the concept of closures in JavaScript with an example.', expectedAnswer: 'A closure is a function that has access to variables from its outer scope even after the outer function has returned.', keywords: ['scope', 'lexical environment', 'inner function'] },
        { text: 'What is the difference between SQL and NoSQL databases?', expectedAnswer: 'SQL databases are relational with structured schemas. NoSQL databases are flexible and can store unstructured data.', keywords: ['relational', 'schema', 'scalability', 'ACID'] },
      ],
      hard: [
        { text: 'Design a distributed rate limiting system that works across multiple servers.', expectedAnswer: 'Use Redis with sliding window algorithm or token bucket algorithm with atomic operations.', keywords: ['Redis', 'distributed', 'atomic', 'consistency'] },
        { text: 'Explain the CAP theorem and how it applies to distributed systems.', expectedAnswer: 'CAP states that distributed systems can only guarantee 2 of 3: Consistency, Availability, Partition Tolerance.', keywords: ['consistency', 'availability', 'partition tolerance'] },
      ],
    },
    behavioral: {
      easy: [
        { text: 'Tell me about yourself and your background in software development.', expectedAnswer: 'Structured answer covering education, experience, key projects, and career goals.', keywords: ['experience', 'skills', 'projects', 'goals'] },
        { text: 'Why do you want to work at this company?', expectedAnswer: 'Research-based answer showing alignment with company mission, culture, and opportunities.', keywords: ['research', 'culture', 'growth', 'mission'] },
      ],
      medium: [
        { text: 'Tell me about a challenging project you worked on and how you overcame the obstacles.', expectedAnswer: 'STAR format: Situation, Task, Action, Result with specific technical challenges and solutions.', keywords: ['STAR', 'challenge', 'solution', 'impact', 'teamwork'] },
        { text: 'Describe a time when you had to work with a difficult team member.', expectedAnswer: 'Demonstrates empathy, communication skills, conflict resolution, and professionalism.', keywords: ['communication', 'empathy', 'resolution', 'teamwork'] },
      ],
      hard: [
        { text: 'How have you influenced technical decision-making in a previous role without direct authority?', expectedAnswer: 'Shows leadership, influence, data-driven arguments, and stakeholder management skills.', keywords: ['influence', 'leadership', 'data-driven', 'stakeholders'] },
      ],
    },
  };

  const typeQuestions = questions[type] || questions.technical;
  const difficultyQuestions = typeQuestions[difficulty] || typeQuestions.medium;
  const q = difficultyQuestions[Math.floor(Math.random() * difficultyQuestions.length)];

  return {
    id: uuidv4(),
    text: q.text,
    type,
    difficulty,
    category: category || 'General',
    expectedAnswer: q.expectedAnswer,
    keywords: q.keywords,
    timeLimit: difficulty === 'hard' ? 300 : difficulty === 'medium' ? 180 : 120,
  };
}

function generateFallbackEvaluation(userAnswer, expectedAnswer) {
  const userWords = new Set(userAnswer.toLowerCase().split(/\s+/));
  const expectedWords = expectedAnswer.toLowerCase().split(/\s+/);
  const matchCount = expectedWords.filter(w => userWords.has(w)).length;
  const semantic = Math.min(100, Math.round((matchCount / Math.max(expectedWords.length, 1)) * 100 * 1.5));
  const factual = Math.max(20, semantic - 10 + Math.floor(Math.random() * 20));
  const completeness = Math.max(20, semantic - 5 + Math.floor(Math.random() * 15));
  const clarity = userAnswer.length > 50 ? Math.floor(60 + Math.random() * 30) : Math.floor(30 + Math.random() * 30);
  const overall = Math.round(semantic * 0.4 + factual * 0.3 + completeness * 0.2 + clarity * 0.1);

  return {
    scores: { semantic, factual, completeness, clarity, overall },
    feedback: overall > 70
      ? 'Good answer! You covered the key concepts well. Consider adding more specific examples.'
      : 'Your answer shows basic understanding. Try to include more technical depth and concrete examples.',
    suggestions: ['Add specific examples', 'Cover edge cases', 'Mention trade-offs'],
    keywordsMatched: Math.round(matchCount),
    missedKeywords: expectedAnswer.split(/\s+/).slice(0, 3),
  };
}

module.exports = router;
