import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { BookOpen, Map, Clock, Target, TrendingUp, CheckCircle, Calendar, Zap } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { learningPathAPI } from '../lib/api';

export default function LearningPathPage() {
  const { user } = useSelector((s: any) => s.auth);
  const [path, setPath] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    targetRole: user?.profile?.targetRole || 'Software Engineer',
    currentSkills: (user?.profile?.skills || []).join(', '),
    experienceLevel: user?.profile?.experience || 'fresher',
    availableHours: 10,
    focusAreas: '',
    projectPreference: 'fullstack',
    learningStyle: 'practical',
  });

  const generate = async () => {
    setIsLoading(true);
    try {
      const data = await learningPathAPI.generate({
        targetRole: config.targetRole,
        currentSkills: config.currentSkills.split(',').map((s) => s.trim()).filter(Boolean),
        experienceLevel: config.experienceLevel,
        availableHours: config.availableHours,
        focus_areas: config.focusAreas.split(',').map((s) => s.trim()).filter(Boolean),
        project_preference: config.projectPreference,
        learning_style: config.learningStyle,
      });
      setPath(data);
    } catch (err) {
      console.error('Failed to generate path:', err);
      setPath(getMockPath(config.targetRole));
    }
    setIsLoading(false);
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Learning <span className="gradient-text">Path Engine</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>AI-generated personalized study plan based on your skills and target role</p>
        </div>

        {!path ? (
          <div style={{ maxWidth: 600 }}>
            <div className="card" style={{ padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Generate Your Path</h2>
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <select className="form-input" value={config.targetRole} onChange={(e) => setConfig({ ...config, targetRole: e.target.value })}>
                  <option>Software Engineer</option>
                  <option>Data Scientist</option>
                  <option>ML Engineer</option>
                  <option>Product Manager</option>
                  <option>DevOps Engineer</option>
                  <option>Frontend Developer</option>
                  <option>Backend Developer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Current Skills (comma-separated)</label>
                <input className="form-input" placeholder="JavaScript, React, Python..." value={config.currentSkills} onChange={(e) => setConfig({ ...config, currentSkills: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select className="form-input" value={config.experienceLevel} onChange={(e) => setConfig({ ...config, experienceLevel: e.target.value })}>
                  <option value="fresher">Fresher (0-1 yr)</option>
                  <option value="junior">Junior (1-3 yrs)</option>
                  <option value="mid">Mid-Level (3-5 yrs)</option>
                  <option value="senior">Senior (5+ yrs)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Focus Areas (comma-separated)</label>
                <input className="form-input" placeholder="Distributed systems, Performance, Security..." value={config.focusAreas} onChange={(e) => setConfig({ ...config, focusAreas: e.target.value })} />
              </div>

              <div className="grid-2" style={{ gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Project Preference</label>
                  <select className="form-input" value={config.projectPreference} onChange={(e) => setConfig({ ...config, projectPreference: e.target.value })}>
                    <option value="fullstack">Fullstack App</option>
                    <option value="backend">Backend Service</option>
                    <option value="frontend">Frontend Project</option>
                    <option value="cli">CLI Tool</option>
                    <option value="system">System Tool</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Learning Style</label>
                  <select className="form-input" value={config.learningStyle} onChange={(e) => setConfig({ ...config, learningStyle: e.target.value })}>
                    <option value="practical">Hands-on / Practical</option>
                    <option value="theoretical">Deep Theory / Academic</option>
                    <option value="balanced">Balanced Approach</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Available Hours per Week: <strong>{config.availableHours}h</strong></label>
                <input type="range" min="2" max="40" value={config.availableHours} onChange={(e) => setConfig({ ...config, availableHours: +e.target.value })} style={{ width: '100%', accentColor: 'var(--accent-primary)' }} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', padding: 14, marginTop: 12 }} onClick={generate} disabled={isLoading}>
                {isLoading ? <><span className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} /> Brainstorming Your Path...</> : <><Map size={16} /> Generate My Learning Path</>}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            {/* Header metrics */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
              {[
                { label: 'Estimated Weeks', value: path.estimated_weeks, icon: Clock, color: '#6366f1' },
                { label: 'Total Hours', value: path.total_study_hours, icon: Calendar, color: '#8b5cf6' },
                { label: 'Topics to Cover', value: path.skill_gap?.length || 0, icon: Target, color: '#06b6d4' },
                { label: 'Current Readiness', value: `${Math.round(path.readiness_estimate || 0)}%`, icon: TrendingUp, color: '#10b981' },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <s.icon size={18} color={s.color} />
                  </div>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
              {/* Phases */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Study Phases</h3>
                {path.phases?.map((phase: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 16, marginBottom: i < path.phases.length - 1 ? 20 : 0, paddingBottom: i < path.phases.length - 1 ? 20 : 0, borderBottom: i < path.phases.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0 }}>{phase.phase}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{phase.name} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>({phase.duration_weeks}w)</span></div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{phase.goal}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {phase.topics?.slice(0, 4).map((t: string) => <span key={t} className="chip" style={{ fontSize: 11 }}>{t}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Milestones */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Milestones</h3>
                {path.milestones?.map((m: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle size={14} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--accent-primary)', fontWeight: 600, marginBottom: 2 }}>Week {m.week}</div>
                      <div style={{ fontSize: 14 }}>{m.goal}</div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>🎯 Priority Topics</h4>
                  {path.priority_topics?.slice(0, 6).map((t: string, i: number) => (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 20 }}>{i + 1}.</span>
                      <span style={{ fontSize: 13 }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="card" style={{ padding: 24, marginBottom: 24, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={24} color="white" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Mentor's Strategic Roadmap</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>{path.ai_roadmap_note}</p>
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
              {/* Weekly Breakdown */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Weekly Milestones</h3>
                <div className="timeline">
                  {path.weekly_breakdown?.map((week: any, i: number) => (
                    <div key={i} style={{ position: 'relative', paddingLeft: 24, paddingBottom: 24, borderLeft: '2px solid var(--border)' }}>
                      <div style={{ position: 'absolute', left: -7, top: 0, width: 12, height: 12, borderRadius: '50%', background: 'var(--accent-primary)' }} />
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Week {week.week}: {week.focus}</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{week.goal}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {week.key_concepts?.map((c: string) => <span key={c} className="chip" style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)' }}>{c}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Blueprints */}
              <div className="card" style={{ padding: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Capstone Projects</h3>
                {path.ai_project_ideas?.map((project: any, i: number) => (
                  <div key={i} className="stat-card" style={{ marginBottom: 16, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: 'var(--accent-primary)' }}>{project.name}</div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{project.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {project.stack?.map((s: string) => <span key={s} style={{ fontSize: 10, color: 'var(--text-muted)' }}>#{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interviewer Perspective */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>The Interviewer's Perspective</h3>
              <div className="grid-2" style={{ gap: 20 }}>
                {path.interviewer_perspective?.map((item: any, i: number) => (
                  <div key={i} style={{ padding: 16, borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--text-primary)' }}>Q: {item.question}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      <strong>What they look for:</strong> {item.what_they_look_for}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>📅 Weekly Study Schedule</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
                {path.daily_schedule?.map((day: any) => (
                  <div key={day.day} style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{day.day.slice(0, 3)}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 4 }}>{day.hours}h</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{day.focus?.split(' ')[0]}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setPath(null)}>
                <Zap size={16} /> Regenerate
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function getMockPath(role: string) {
  return {
    target_role: role, current_level: 'junior', estimated_weeks: 12, total_study_hours: 120,
    readiness_estimate: 35,
    skill_gap: ['Data Structures', 'System Design', 'TypeScript', 'Docker', 'Redis', 'GraphQL'],
    priority_topics: ['Data Structures', 'Algorithms', 'System Design', 'TypeScript', 'Docker', 'Redis'],
    phases: [
      { phase: 1, name: 'Foundation', duration_weeks: 3, goal: 'Build strong fundamentals', topics: ['Data Structures', 'Algorithms', 'Big-O Notation'] },
      { phase: 2, name: 'Intermediate', duration_weeks: 5, goal: 'Apply to real problems', topics: ['System Design', 'Databases', 'APIs', 'TypeScript'] },
      { phase: 3, name: 'Interview Ready', duration_weeks: 4, goal: 'Master advanced topics', topics: ['Mock Interviews', 'Behavioral', 'Company Research'] },
    ],
    milestones: [
      { week: 3, goal: 'Complete foundation modules' },
      { week: 6, goal: 'Solve 50 LeetCode problems' },
      { week: 9, goal: 'Complete 5 mock interviews' },
      { week: 12, goal: 'Interview ready!' },
    ],
    daily_schedule: [
      { day: 'Monday', hours: 2, focus: 'DSA Practice' },
      { day: 'Tuesday', hours: 2, focus: 'System Design' },
      { day: 'Wednesday', hours: 2, focus: 'Coding Problems' },
      { day: 'Thursday', hours: 2, focus: 'Behavioral Prep' },
      { day: 'Friday', hours: 2, focus: 'Review & Notes' },
      { day: 'Saturday', hours: 3, focus: 'Mock Interview' },
      { day: 'Sunday', hours: 2, focus: 'Project Work' },
    ],
  };
}
