import React, { useState } from 'react';
import { 
  Box, Cpu, Zap, AlertTriangle, ShieldCheck, 
  Lightbulb, ChevronRight, Send, Search, Terminal 
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { projectAPI } from '../lib/api';
import toast from 'react-hot-toast';

export default function ProjectCritiquePage() {
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [critique, setCritique] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return toast.error('Please provide a project description');
    
    setIsLoading(true);
    try {
      const res = await projectAPI.critique({
        projectDescription: description,
        techStack: techStack.split(',').map(s => s.trim()).filter(Boolean)
      });
      setCritique(res.critique);
      toast.success('Architectural analysis complete!');
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '40px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={24} color="white" />
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800 }}>Project Architect Critique</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>
            Submit your personal or professional projects for a Staff-level architectural audit and risk assessment.
          </p>
        </div>

        <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.5fr', gap: 32, alignItems: 'start' }}>
          {/* Input Panel */}
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Project Details</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Project Description</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: 200, lineHeight: 1.6, padding: 12 }}
                  placeholder="Describe the architecture, features, and challenges of your project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Tech Stack (comma separated)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="React, Node.js, Redis, Docker..."
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', height: 48 }}
                disabled={isLoading}
              >
                {isLoading ? 'Architecting Analysis...' : <><Zap size={18} /> Generate Critique</>}
              </button>
            </form>

            <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                <Search size={14} style={{ marginTop: 2 }} />
                <p>AI will analyze your architecture for bottlenecks, single points of failure, and scalability gaps.</p>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="card" style={{ padding: 24, minHeight: 500, background: critique ? 'var(--card-bg)' : 'rgba(255,255,255,0.01)', borderStyle: critique ? 'solid' : 'dashed' }}>
            {!critique ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center' }}>
                <Terminal size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                <p>Submit your project to receive a deep-dive <br/> architectural critique and interview preparation.</p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800 }}>Architectural Audit</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 20, background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-tertiary)', fontSize: 14, fontWeight: 700 }}>
                    <Cpu size={14} /> Score: {critique.architecture_score || 0}/100
                  </div>
                </div>

                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
                  {critique.summary}
                </p>

                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Engineering Strengths</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {critique.strengths?.map((s: string, i: number) => (
                      <div key={i} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', color: 'var(--success)', fontSize: 12 }}>
                        <ShieldCheck size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                        {s}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 32 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Critical Vulnerabilities</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {critique.vulnerabilities?.map((v: any, i: number) => (
                      <div key={i} style={{ padding: 16, borderRadius: 12, background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{v.risk}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{v.details}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {critique.staff_alternative && (
                  <div style={{ padding: 20, borderRadius: 16, background: 'var(--gradient-primary)', color: 'white', marginBottom: 32 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      <Lightbulb size={20} />
                      <span style={{ fontWeight: 800 }}>Staff-Level Alternative: {critique.staff_alternative.component}</span>
                    </div>
                    <p style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6, marginBottom: 12 }}>
                      {critique.staff_alternative.suggestion}
                    </p>
                    <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8 }}>
                      BENEFIT: {critique.staff_alternative.benefit}
                    </div>
                  </div>
                )}

                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>Interviewer "Grilling" Questions</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {critique.killer_questions?.map((q: any, i: number) => (
                      <div key={i} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>"{q.question}"</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Interviewer Context: {q.context}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
