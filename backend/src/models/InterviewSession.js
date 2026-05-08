const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'mixed', 'coding', 'system-design', 'mock'],
    required: true,
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  mode: { type: String, enum: ['classic', 'ai'], default: 'ai' },
  targetRole: { type: String, default: 'Software Engineer' },
  company: { type: String, default: null },
  jobDescription: { type: String, default: null },
  resumeContext: { type: String, default: null },
  interviewerPersona: {
    type: String,
    enum: ['friendly', 'challenging', 'neutral', 'skeptical'],
    default: 'neutral',
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'abandoned'],
    default: 'active',
  },
  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    questionText: String,
    questionType: String,
    userAnswer: String,
    userCode: String,
    scores: {
      semantic: { type: Number, default: 0 },
      factual: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
    feedback: String,
    timeTaken: Number,
    followUpAsked: { type: Boolean, default: false },
    followUpAnswer: String,
  }],
  analytics: {
    totalScore: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }, // minutes
    questionsAnswered: { type: Number, default: 0 },
    strongAreas: [String],
    weakAreas: [String],
    communicationScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    overallReadiness: { type: Number, default: 0 },
  },
  behavioralMetrics: {
    emotionalStability: { type: Number, default: null },
    eyeContactScore: { type: Number, default: null },
    speechPace: { type: Number, default: null },
    fillerWordCount: { type: Number, default: null },
    confidenceScore: { type: Number, default: null },
  },
  feedback: {
    summary: String,
    strengths: [String],
    improvements: [String],
    nextSteps: [String],
    readinessScore: { type: Number, default: 0 },
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
