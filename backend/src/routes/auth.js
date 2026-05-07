const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, targetRole } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const user = await User.create({
      name,
      email,
      password,
      profile: { targetRole: targetRole || 'Software Engineer' },
    });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/demo
const demoLogin = async (req, res) => {
  try {
    const demoEmail = 'demo@mockmate.com';
    let user = await User.findOne({ email: demoEmail });
    if (!user) {
      user = await User.create({
        name: 'Demo User',
        email: demoEmail,
        password: 'demopassword123',
        profile: { targetRole: 'Software Engineer', skills: ['JavaScript', 'React', 'Node.js'], experience: 'Intermediate' },
      });
    }
    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Demo login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/ai-settings
const updateAiSettings = async (req, res) => {
  try {
    const { aiProvider, ollamaHost, ollamaModel } = req.body;
    
    // Path to ml_service/.env
    const envPath = path.join(__dirname, '../../../ml_service/.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Helper to replace or append env vars
    const updateEnv = (key, value) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    };

    if (aiProvider) updateEnv('AI_PROVIDER', aiProvider);
    if (ollamaHost) updateEnv('OLLAMA_HOST', ollamaHost);
    if (ollamaModel) updateEnv('OLLAMA_MODEL', ollamaModel);

    fs.writeFileSync(envPath, envContent.trim() + '\n');

    res.json({ success: true, message: 'AI settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, demoLogin, getMe, updateProfile, updateAiSettings };
