import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Brain, Mail, Lock, User, Briefcase, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { loginUser, registerUser, loginDemoUser } from '../store/slices/authSlice';

interface AuthPageProps { mode: 'login' | 'register'; }

export default function AuthPage({ mode }: AuthPageProps) {
  const dispatch = useDispatch<any>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((s: any) => s.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', targetRole: 'Software Engineer' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = mode === 'login' ? loginUser({ email: form.email, password: form.password }) : registerUser(form);
    const result = await dispatch(action as any);
    if (result.type.endsWith('/fulfilled')) navigate('/dashboard');
  };

  const handleDemoLogin = async () => {
    const result = await dispatch(loginDemoUser());
    if (result.type.endsWith('/fulfilled')) navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', filter: 'blur(80px)', top: -100, right: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(139,92,246,0.06)', filter: 'blur(80px)', bottom: -100, left: -100, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1, animation: 'fadeIn 0.4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={24} color="white" />
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MockMate</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {mode === 'login' ? 'Sign in to continue your interview prep journey' : 'Join 50,000+ engineers preparing smarter'}
          </p>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, backdropFilter: 'blur(20px)' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input className="form-input" style={{ paddingLeft: 40 }} type="text" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: 40 }} type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: 40, paddingRight: 44 }} type={showPassword ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Target Role</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <select className="form-input" style={{ paddingLeft: 40 }} value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
                    <option>Software Engineer</option>
                    <option>Frontend Developer</option>
                    <option>Backend Developer</option>
                    <option>Full Stack Developer</option>
                    <option>Data Scientist</option>
                    <option>ML Engineer</option>
                    <option>DevOps Engineer</option>
                    <option>Product Manager</option>
                    <option>System Architect</option>
                  </select>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, padding: '14px' }} disabled={isLoading}>
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <><Sparkles size={16} /> {mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
              )}
            </button>

            {mode === 'login' && (
              <button 
                type="button" 
                onClick={handleDemoLogin} 
                className="btn btn-secondary" 
                style={{ width: '100%', marginTop: 12, padding: '14px', background: 'transparent', border: '1px solid var(--border)' }} 
                disabled={isLoading}
              >
                Try Demo Account
              </button>
            )}
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            {mode === 'login' ? (
              <span>Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign up free</Link></span>
            ) : (
              <span>Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign in</Link></span>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
