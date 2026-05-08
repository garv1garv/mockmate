const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');

// GET /api/analytics/dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const allSessions = await InterviewSession.find({ userId, status: 'completed' }).sort({ createdAt: -1 });
    const totalSessions = allSessions.length;
    
    if (totalSessions === 0) {
      return res.json({
        success: true,
        analytics: {
          totalSessions: 0,
          avgScore: 0,
          streak: 0,
          readinessScore: 0,
          scoreTrend: [],
          categoryBreakdown: [],
          recentSessions: [],
          isNewUser: true
        }
      });
    }

    const avgScore = Math.round(allSessions.reduce((sum, s) => sum + (s.analytics?.averageScore || 0), 0) / totalSessions);

    // Score trend (last 10 sessions)
    const scoreTrend = allSessions.slice(0, 10).reverse().map((s, i) => ({
      session: i + 1,
      score: s.analytics?.averageScore || 0,
      date: s.createdAt,
      type: s.type,
    }));

    // Topic performance mapping
    const topicMap = {};
    allSessions.forEach(s => {
      const type = s.type || 'technical';
      if (!topicMap[type]) topicMap[type] = { total: 0, count: 0 };
      topicMap[type].total += s.analytics?.averageScore || 0;
      topicMap[type].count++;
    });

    const categoryBreakdown = Object.entries(topicMap).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      score: Math.round(data.total / data.count),
      sessions: data.count
    }));

    // Improved Streak Calculation
    let streak = 0;
    const sessionDates = [...new Set(allSessions.map(s => {
      const d = new Date(s.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a);

    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);
    
    // If last session was today or yesterday, start counting
    if (sessionDates[0] === checkDate.getTime() || sessionDates[0] === (checkDate.getTime() - 86400000)) {
      for (let i = 0; i < sessionDates.length; i++) {
        const expectedDate = new Date(sessionDates[0]);
        expectedDate.setDate(expectedDate.getDate() - i);
        if (sessionDates[i] === expectedDate.getTime()) streak++;
        else break;
      }
    }

    // Readiness score: weighted avg of score (50%), frequency (30%), and streak (20%)
    const readinessScore = Math.min(100, Math.round(
      (avgScore * 0.5) +
      (Math.min(totalSessions, 10) * 3) + 
      (Math.min(streak, 7) * 2.8)
    ));

    res.json({
      success: true,
      analytics: {
        totalSessions,
        avgScore,
        streak,
        readinessScore,
        scoreTrend,
        categoryBreakdown,
        recentSessions: allSessions.slice(0, 5),
        improvements: avgScore < 70 
          ? ['Review fundamental concepts', 'Practice coding speed', 'Focus on communication'] 
          : ['Tackle hard complexity', 'System architecture optimization', 'Edge case handling']
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/analytics/leaderboard
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const leaders = await User.find({ 'stats.totalSessions': { $gt: 0 } })
      .select('name stats.averageScore stats.totalSessions stats.streak profile.targetRole')
      .sort({ 'stats.averageScore': -1 })
      .limit(10);

    res.json({ success: true, leaderboard: leaders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
