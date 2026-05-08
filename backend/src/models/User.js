const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  profile: {
    targetRole: { type: String, default: '' },
    experience: { type: String, default: 'fresher' },
    skills: [String],
    resumeUrl: { type: String, default: null },
    linkedinUrl: { type: String, default: null },
    githubUrl: { type: String, default: null },
  },
  stats: {
    totalSessions: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastSessionDate: { type: Date, default: null },
    weeklyGoal: { type: Number, default: 5 },
    weeklyCompleted: { type: Number, default: 0 },
  },
  aiSettings: {
    provider: { type: String, enum: ['ollama', 'gemini', 'none'], default: 'ollama' },
    ollamaHost: { type: String, default: 'http://127.0.0.1:11434' },
    ollamaModel: { type: String, default: 'llama3' },
    geminiModel: { type: String, default: 'gemini-1.5-flash' },
    geminiApiKey: { type: String, default: '' },
  },
  knowledgeGraph: {
    strongTopics: [String],
    weakTopics: [String],
    masteredTopics: [String],
  },
  subscription: {
    plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
    validUntil: { type: Date, default: null },
  },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
