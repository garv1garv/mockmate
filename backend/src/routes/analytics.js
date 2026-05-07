const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');

// GET /api/analytics/dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const sessions = await InterviewSession.find({
      userId,
      status: 'completed',
    }).sort({ createdAt: -1 }).limit(30);

    const totalSessions = sessions.length;
    const avgScore = totalSessions
      ? Math.round(sessions.reduce((sum, s) => sum + (s.analytics?.averageScore || 0), 0) / totalSessions)
      : 0;

    // Weekly performance
    const lastWeekSessions = sessions.filter(s => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(s.createdAt) > weekAgo;
    });

    // Score trend (last 10 sessions)
    const scoreTrend = sessions.slice(0, 10).reverse().map((s, i) => ({
      session: i + 1,
      score: s.analytics?.averageScore || 0,
      date: s.createdAt,
      type: s.type,
    }));

    // Topic performance
    const topicPerformance = {};
    sessions.forEach(session => {
      const category = session.type;
      if (!topicPerformance[category]) {
        topicPerformance[category] = { total: 0, count: 0 };
      }
      topicPerformance[category].total += session.analytics?.averageScore || 0;
      topicPerformance[category].count++;
    });

    const categoryBreakdown = Object.entries(topicPerformance).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      score: Math.round(data.total / data.count),
      sessions: data.count,
    }));

    // Streak calculation
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const hasSession = sessions.some(s => {
        const sDate = new Date(s.createdAt);
        sDate.setHours(0, 0, 0, 0);
        return sDate.getTime() === date.getTime();
      });
      if (hasSession) streak++;
      else if (i > 0) break;
    }

    // Readiness score
    const readinessScore = Math.min(100, Math.round(
      (avgScore * 0.5) +
      (Math.min(totalSessions, 20) / 20 * 30) +
      (Math.min(streak, 7) / 7 * 20)
    ));

    res.json({
      success: true,
      analytics: {
        totalSessions,
        avgScore,
        streak,
        readinessScore,
        lastWeekSessions: lastWeekSessions.length,
        scoreTrend,
        categoryBreakdown,
        recentSessions: sessions.slice(0, 5),
        improvements: avgScore < 70
          ? ['Practice more system design', 'Focus on algorithmic problems', 'Work on communication skills']
          : ['Tackle more hard problems', 'Focus on optimization', 'Practice company-specific questions'],
        strengths: avgScore > 60
          ? ['Consistent practice', 'Technical communication', 'Problem-solving approach']
          : ['Dedication to improvement', 'Learning mindset'],
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
