import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { Mic } from 'lucide-react';

export default function InterviewPage() {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const skills = ['react', 'node', 'mongodb', 'javascript', 'python', 'java', 'aws', 'sql', 'html', 'css', 'express', 'mysql', 'firebase', 'google cloud', 'git', 'github', 'c++', 'go'];

  const questions = [
    {
      id: 1,
      text: "Explain the architectural differences between a SQL database like MySQL and a NoSQL database like MongoDB, and describe a scenario where you would choose one over the other in a Node.js environment.",
    },
    {
      id: 2,
      text: "In React, what is the fundamental difference between 'state' and 'props', and how does the Virtual DOM reconciliation process contribute to application performance?",
    }
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ maxWidth: 800 }}>
        
        <h1 style={{ textAlign: 'center', fontSize: 32, marginBottom: 40 }} className="gradient-text">
          Resume Interview
        </h1>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: '#64748b', fontSize: 13 }}>DETECTED SKILLS</div>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {skills.map(skill => (
              <span key={skill} style={{ padding: '4px 12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, color: '#3b82f6', fontSize: 12, fontWeight: 500 }}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: '#64748b', fontSize: 13 }}>INTERVIEW QUESTIONS</div>
            <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {questions.map((q, i) => (
              <div key={q.id} className="card" style={{ padding: 32 }}>
                <div style={{ color: '#3b82f6', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Question {i + 1}</div>
                <p style={{ color: '#0f172a', lineHeight: 1.6, marginBottom: 24 }}>{q.text}</p>
                
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>YOUR RESPONSE</div>
                <div style={{ position: 'relative' }}>
                  <textarea 
                    className="form-input" 
                    placeholder="Describe your experience..." 
                    style={{ minHeight: 120, paddingBottom: 50, background: '#f8fafc' }}
                    value={answers[q.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                  <button className="btn" style={{ position: 'absolute', bottom: 12, left: 12, background: '#64748b', color: 'white', padding: '6px 16px', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mic size={14} /> Speak Answer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
