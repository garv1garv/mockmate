import React from 'react';
import Sidebar from '../components/Sidebar';

export default function ResumePage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ maxWidth: 900 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40, borderBottom: '1px solid #e2e8f0', paddingBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Candidate Analysis Report</h1>
            <p style={{ color: '#64748b', fontSize: 14 }}>System-generated assessment for technical roles</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>STATUS</div>
            <div style={{ color: '#10b981', fontWeight: 600, fontSize: 14 }}>✓ Analysis Complete</div>
          </div>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #f1f5f9', borderTopColor: '#3b82f6', borderRightColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
            85
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>ATS Compatibility Score</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>Based on industry-standard parsing algorithms and keyword density markers.</p>
          </div>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 16 }}>KEY COMPETENCIES & ASSETS</div>
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#0f172a', fontSize: 14 }}>
            <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} /> Good programming skills mentioned</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} /> Projects included in resume</li>
          </ul>
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card" style={{ padding: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 16 }}>CRITICAL GAPS</div>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#ef4444', fontSize: 14 }}>
              <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444' }} /> No achievements highlighted</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444' }} /> Certifications missing</li>
            </ul>
          </div>

          <div className="card" style={{ padding: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', marginBottom: 16 }}>STRATEGIC IMPROVEMENTS</div>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#3b82f6', fontSize: 14 }}>
              <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} /> Add quantified achievements (e.g. improved performance by 20%)</li>
              <li style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} /> Add GitHub or portfolio link</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} /> Include certifications and technical stack</li>
            </ul>
          </div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>ATS OPTIMIZATION PROTOCOL</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#ffffff', background: '#3b82f6', padding: '4px 12px', borderRadius: 12 }}>GEMINI AI INTELLIGENCE</div>
          </div>
          
          <ul style={{ listStyleType: 'none', padding: 0, margin: 0, color: '#3b82f6', fontSize: 14 }}>
            {[
              "Make formatting ATS-friendly",
              "Include measurable achievements",
              "Use keywords from job description",
              "Keep sections clear and concise",
              "Add relevant technical skills",
              "Highlight education and certifications"
            ].map((item, i) => (
              <li key={i} style={{ padding: '16px 0', borderBottom: i < 5 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} /> {item}
              </li>
            ))}
          </ul>
        </div>

      </main>
    </div>
  );
}
