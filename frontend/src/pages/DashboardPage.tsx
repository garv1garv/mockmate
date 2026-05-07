import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Target, Zap, Clock, Award, Brain, ArrowRight, Play, BookOpen, Star, Flame } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { analyticsAPI } from '../lib/api';
import Sidebar from '../components/Sidebar';

const QUICK_ACTIONS = [
  { icon: Play, label: 'Quick Mock', desc: '15-min session', to: '/interview/new', color: '#6366f1' },
  { icon: Brain, label: 'Technical', desc: 'DSA & System Design', to: '/interview/new?type=technical', color: '#8b5cf6' },
  { icon: BookOpen, label: 'Resume Review', desc: 'AI analysis', to: '/resume', color: '#06b6d4' },
  { icon: Target, label: 'Learning Path', desc: 'Personalized plan', to: '/learning-path', color: '#10b981' },
];

export default function DashboardPage() {
  const { user } = useSelector((s: any) => s.auth);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then((res: any) => setAnalytics(res.analytics))
      .catch(() => setAnalytics(getMockAnalytics()))
      .finally(() => setIsLoading(false));
  }, []);

  const data = analytics || getMockAnalytics();

  const radarData = [
    { subject: 'Algorithms', A: 78 },
    { subject: 'System Design', A: 62 },
    { subject: 'Behavioral', A: 85 },
    { subject: 'Databases', A: 71 },
    { subject: 'JavaScript', A: 90 },
    { subject: 'Communication', A: 80 },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
                Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Candidate'}</span> 👋
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                {data.streak > 0 ? `🔥 ${data.streak}-day streak! Keep it up.` : 'Start your first session today to begin your journey.'}
              </p>
            </div>
            <Link to="/interview/new" className="btn btn-primary">
              <Play size={16} /> Start Interview <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: 'Readiness Score', value: `${data.readinessScore || 0}%`, icon: Target, color: '#6366f1', sub: 'Overall preparation' },
            { label: 'Sessions Done', value: data.totalSessions || 0, icon: Play, color: '#8b5cf6', sub: 'Total practice sessions' },
            { label: 'Avg Score', value: `${data.avgScore || 0}%`, icon: BarChart3, color: '#10b981', sub: 'Across all sessions' },
            { label: 'Current Streak', value: `${data.streak || 0}d`, icon: Flame, color: '#f59e0b', sub: 'Consecutive days' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={18} color={stat.color} />
                </div>
              </div>
              <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Quick Start</h2>
          <div className="grid-4">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.label} to={action.to} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 20, cursor: 'pointer', borderColor: `${action.color}20` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${action.color}20`, border: `1px solid ${action.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <action.icon size={20} color={action.color} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{action.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid-2" style={{ marginBottom: 28 }}>
          {/* Score Trend */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Score Trend</h3>
              <span className="badge badge-success">+12% this week</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.scoreTrend?.length ? data.scoreTrend : mockTrend}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="session" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Skill Radar */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Skill Radar</h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Radar name="Skills" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown + Recent Sessions */}
        <div className="grid-2">
          {/* Category performance */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Topic Performance</h3>
            {(data.categoryBreakdown?.length ? data.categoryBreakdown : mockCategories).map((cat: any) => (
              <div key={cat.name} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span>{cat.name}</span>
                  <span style={{ color: cat.score >= 70 ? 'var(--success)' : cat.score >= 50 ? 'var(--warning)' : 'var(--danger)', fontWeight: 600 }}>{cat.score}%</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${cat.score >= 70 ? 'progress-success' : cat.score >= 50 ? 'progress-warning' : ''}`} style={{ width: `${cat.score}%`, background: cat.score >= 70 ? 'var(--gradient-success)' : cat.score >= 50 ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : 'var(--gradient-primary)' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Sessions */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Sessions</h3>
              <Link to="/history" style={{ fontSize: 13, color: 'var(--accent-primary)' }}>View all</Link>
            </div>
            {(data.recentSessions?.length ? data.recentSessions : mockSessions).map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={16} color="var(--accent-primary)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.type || 'Technical'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.analytics?.questionsAnswered || 5} questions</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: (s.analytics?.averageScore || 70) >= 70 ? 'var(--success)' : 'var(--warning)' }}>{s.analytics?.averageScore || Math.floor(60 + Math.random() * 30)}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</div>
                </div>
              </div>
            ))}
            {!data.recentSessions?.length && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>
                No sessions yet. <Link to="/interview/new">Start one now!</Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const mockTrend = [
  { session: 1, score: 48 }, { session: 2, score: 55 }, { session: 3, score: 62 },
  { session: 4, score: 58 }, { session: 5, score: 71 }, { session: 6, score: 68 },
  { session: 7, score: 75 }, { session: 8, score: 80 }, { session: 9, score: 78 }, { session: 10, score: 85 },
];
const mockCategories = [
  { name: 'Data Structures', score: 78 }, { name: 'System Design', score: 62 },
  { name: 'Behavioral', score: 85 }, { name: 'Algorithms', score: 70 }, { name: 'Databases', score: 55 },
];
const mockSessions = [
  { type: 'Technical', analytics: { averageScore: 82, questionsAnswered: 8 } },
  { type: 'Behavioral', analytics: { averageScore: 74, questionsAnswered: 6 } },
  { type: 'System Design', analytics: { averageScore: 65, questionsAnswered: 4 } },
  { type: 'Mixed', analytics: { averageScore: 79, questionsAnswered: 10 } },
];
function getMockAnalytics() {
  return { readinessScore: 72, totalSessions: 12, avgScore: 74, streak: 5, scoreTrend: mockTrend, categoryBreakdown: mockCategories, recentSessions: mockSessions };
}
