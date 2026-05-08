import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Zap, FileText } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 60px', alignItems: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>MockMate</div>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link to="/" style={{ color: '#64748b', fontWeight: 500 }}>Home</Link>
          <Link to="/register" style={{ color: '#64748b', fontWeight: 500 }}>Sign-up</Link>
          <Link to="/login" style={{ color: '#64748b', fontWeight: 500 }}>Sign-in</Link>
        </div>
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ background: '#e0f2fe', color: '#3b82f6', padding: '8px 24px', borderRadius: 30, fontSize: 14, fontWeight: 600, marginBottom: 40 }}>
          Welcome to MockMate 👋
        </div>
        
        <h1 style={{ fontSize: 'clamp(48px, 8vw, 80px)', fontWeight: 900, textAlign: 'center', marginBottom: 24, letterSpacing: '-0.02em' }} className="gradient-text">
          Master Your Next Interview
        </h1>
        
        <p style={{ fontSize: 18, color: '#64748b', textAlign: 'center', maxWidth: 800, lineHeight: 1.6, marginBottom: 60 }}>
          Practice real technical interviews with AI. Prepare for DSA, OOP, DBMS, OS, and Computer Networks to improve your confidence for software engineering roles.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400, marginBottom: 80 }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '16px', borderRadius: 12, fontSize: 16 }}>
            Start Mock Interview
          </Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '16px', borderRadius: 12, fontSize: 16 }}>
            Schedule Interview
          </Link>
        </div>

        <div className="grid-3" style={{ width: '100%', maxWidth: 1000, gap: 32 }}>
          <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={32} color="#8b5cf6" />
            </div>
          </div>
          <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={32} color="#f59e0b" />
            </div>
          </div>
          <div className="card" style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={32} color="#ef4444" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
