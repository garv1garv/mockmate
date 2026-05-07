require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const authRouter = require('./routes/authRouter');
const interviewRouter = require('./routes/interview');
const resumeRouter = require('./routes/resume');
const analyticsRouter = require('./routes/analytics');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Connect Database called at the bottom before listen

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);
app.use('/api/resume', resumeRouter);
app.use('/api/analytics', analyticsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'MockMate API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Socket.io - Real-time interview events
const activeSessions = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join-session', ({ sessionId, userId }) => {
    socket.join(sessionId);
    activeSessions.set(socket.id, { sessionId, userId });
    socket.emit('session-joined', { sessionId, message: 'Connected to interview session' });
  });

  socket.on('answer-submitted', ({ sessionId, answer }) => {
    socket.to(sessionId).emit('answer-received', { answer });
  });

  socket.on('typing', ({ sessionId }) => {
    socket.to(sessionId).emit('user-typing');
  });

  socket.on('request-hint', ({ sessionId, questionId }) => {
    socket.emit('hint-received', {
      hint: 'Consider breaking the problem into smaller components and think about edge cases.',
    });
  });

  socket.on('disconnect', () => {
    const sessionData = activeSessions.get(socket.id);
    if (sessionData) {
      io.to(sessionData.sessionId).emit('user-disconnected');
      activeSessions.delete(socket.id);
    }
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Connect Database
connectDB().then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 MockMate Backend running on port ${PORT}`);
    console.log(`📡 Socket.io enabled`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
}).catch((err) => {
  console.error("Failed to connect to DB on startup", err);
  process.exit(1);
});

module.exports = { app, server, io };
