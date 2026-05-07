import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Zap, Target, BarChart3, Star, ArrowRight, CheckCircle, Play, Sparkles, Shield, Users } from 'lucide-react';

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Evaluation', desc: 'Multi-dimensional scoring with semantic, factual, completeness & clarity analysis using state-of-the-art NLP models.', color: '#6366f1' },
  { icon: Zap, title: 'Adaptive Questions', desc: 'Our ML engine predicts optimal difficulty and selects questions targeting your weak areas using knowledge graph mapping.', color: '#8b5cf6' },
  { icon: Target, title: 'Resume Intelligence', desc: 'ATS optimization, job description matching, skills gap analysis and AI-powered improvement suggestions.', color: '#06b6d4' },
  { icon: BarChart3, title: 'Performance Analytics', desc: 'Detailed trend charts, topic heatmaps, readiness scoring, and predictive success probability for target companies.', color: '#10b981' },
  { icon: Users, title: 'Peer Mock Interviews', desc: 'Real-time peer matching via WebRTC for live practice sessions with mutual feedback and collaborative learning.', color: '#f59e0b' },
  { icon: Shield, title: 'Company-Specific Prep', desc: 'Tailored practice based on company culture, past questions database, and interview style intelligence.', color: '#ef4444' },
];

const STATS = [
  { value: '50K+', label: 'Mock Interviews' },
  { value: '94%', label: 'User Satisfaction' },
  { value: '3.2x', label: 'Offer Rate Boost' },
  { value: '200+', label: 'Companies Covered' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'SDE at Google', text: 'MockMate helped me crack my Google interview in just 6 weeks. The adaptive AI questions and detailed feedback were game-changers.', rating: 5, avatar: 'PS' },
  { name: 'Rohan Mehta', role: 'Software Engineer at Meta', text: 'The resume analyzer caught issues I never noticed. My ATS score jumped from 42 to 89, and I started getting callbacks immediately.', rating: 5, avatar: 'RM' },
  { name: 'Aisha Khan', role: 'ML Engineer at Amazon', text: 'The behavioral question coaching with STAR format guidance completely transformed how I communicate in interviews.', rating: 5, avatar: 'AK' },
];

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let animFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.alpha})`;
        ctx.fill();
      });
      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });
      animFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animFrame);
  }, []);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Canvas background */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,5,16,0.8)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={20} color="white" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MockMate</span>
          <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.2)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: 20, fontWeight: 600, border: '1px solid rgba(99,102,241,0.3)' }}>v2.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm"><Sparkles size={14} /> Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '8px 16px', marginBottom: 32, fontSize: 13, color: 'var(--accent-primary)', fontWeight: 500 }}>
            <Sparkles size={14} /> Powered by DeBERTa-v3 + GPT-4 + Sentence Transformers
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 24 }}>
            <span>Ace Every Interview</span><br />
            <span className="gradient-text">with AI-Powered</span><br />
            <span>Mock Practice</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.8 }}>
            The most advanced interview preparation platform — adaptive AI questions, multi-dimensional answer scoring, resume intelligence, and behavioral coaching in one place.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              <Play size={18} /> Start Free Practice <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              View Demo
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
            {['No credit card required', '5 free sessions daily', 'Cancel anytime'].map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                <CheckCircle size={14} color="var(--success)" /> {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '60px 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, fontWeight: 900, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 32px', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 40, fontWeight: 800, marginBottom: 12 }}>
            Everything You Need to <span className="gradient-text">Land Your Dream Job</span>
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 60, fontSize: 16 }}>
            Advanced ML models, real-time feedback, and personalized learning paths
          </p>
          <div className="grid-3">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="card" style={{ padding: 28, animationDelay: `${i * 0.1}s` }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${f.color}20`, border: `1px solid ${f.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <f.icon size={22} color={f.color} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 32px', background: 'rgba(255,255,255,0.02)', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 60 }}>
            How <span className="gradient-text">MockMate</span> Works
          </h2>
          {[
            { step: '01', title: 'Set Up Your Profile', desc: 'Tell us your target role, experience level, and upload your resume for personalized practice.' },
            { step: '02', title: 'AI Generates Your Questions', desc: 'Our adaptive ML engine creates questions tailored to your skill level, targeting weak areas first.' },
            { step: '03', title: 'Practice & Get Instant Feedback', desc: 'Answer questions and receive multi-dimensional AI scoring with detailed improvement suggestions.' },
            { step: '04', title: 'Track & Improve', desc: 'Monitor your progress with analytics, follow your personalized learning path, and watch your readiness score grow.' },
          ].map((item, i) => (
            <div key={item.step} style={{ display: 'flex', gap: 24, marginBottom: 40, alignItems: 'flex-start' }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0 }}>{item.step}</div>
              <div style={{ paddingTop: 8 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 32px', position: 'relative', zIndex: 1 }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: 36, fontWeight: 800, marginBottom: 60 }}>
            From the <span className="gradient-text">Community</span>
          </h2>
          <div className="grid-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card" style={{ padding: 28 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={14} fill="var(--warning)" color="var(--warning)" />)}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white' }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 32px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 40px', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 32, backdropFilter: 'blur(20px)' }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>Ready to Land <span className="gradient-text">Your Dream Job?</span></h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 16 }}>Join 50,000+ engineers who used MockMate to get hired at top companies.</p>
          <Link to="/register" className="btn btn-primary btn-lg" style={{ marginBottom: 16 }}>
            <Sparkles size={18} /> Start Free Today
          </Link>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>No credit card • Free 5 sessions/day • Cancel anytime</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <Brain size={16} color="var(--accent-primary)" />
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>MockMate v2.0</span>
        </div>
        <p>Built with ❤️ by Gaurav, Jatin, Garv & Deepanshu · © 2026 MockMate. All rights reserved.</p>
      </footer>
    </div>
  );
}
