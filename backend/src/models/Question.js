const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['technical', 'behavioral', 'system-design', 'coding', 'mcq'],
    required: true,
  },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: '' },
  expectedAnswer: { type: String, default: '' },
  keywords: [String],
  followUpQuestions: [String],
  companies: [String],
  timeLimit: { type: Number, default: 120 }, // seconds
  codeTemplate: { type: String, default: null },
  testCases: [{
    input: String,
    expectedOutput: String,
    explanation: String,
  }],
  explanation: { type: String, default: '' },
  resources: [{
    title: String,
    url: String,
    type: { type: String, enum: ['article', 'video', 'course', 'book'] },
  }],
  usageCount: { type: Number, default: 0 },
  averageScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Question', questionSchema);
