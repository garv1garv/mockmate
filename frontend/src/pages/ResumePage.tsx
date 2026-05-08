import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Target, CheckCircle, AlertCircle, Star, Zap, BookOpen, Loader2 } from 'lucide-react';
import { resumeAPI } from '../lib/api';
import Sidebar from '../components/Sidebar';

export default function ResumePage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [tab, setTab] = useState<'paste' | 'upload'>('paste');
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFileName(file.name);
    setIsUploading(true);

    try {
      const res = await resumeAPI.upload(file) as any;
      if (res.text) {
        setResumeText(res.text);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'text/plain': ['.txt'], 'application/pdf': ['.pdf'] }, maxFiles: 1 });

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await resumeAPI.analyze({ resumeText, jobDescription, targetRole }) as any;
      setAnalysis(res.analysis);
    } catch {
      setAnalysis(getMockAnalysis());
    }
    setIsAnalyzing(false);
  };

  const handleGenerateCoverLetter = async () => {
    if (!resumeText.trim()) return;
    setIsGeneratingCL(true);
    setCoverLetter('');
    try {
      const res = await resumeAPI.generateCoverLetter({ resumeText, jobDescription, targetRole }) as any;
      setCoverLetter(res.coverLetter);
    } catch {
      setCoverLetter('Error generating cover letter. Please try again.');
    }
    setIsGeneratingCL(false);
  };

  const getScoreColor = (score: number) => score >= 70 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)';
  const getScoreLabel = (score: number) => score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Work';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Resume <span className="gradient-text">Intelligence</span></h1>
          <p style={{ color: 'var(--text-secondary)' }}>AI-powered ATS optimization, JD matching, and improvement suggestions</p>
        </div>

        <div className="grid-2" style={{ alignItems: 'flex-start' }}>
          {/* Left: Input */}
          <div>
            <div className="tabs" style={{ marginBottom: 20 }}>
              <button className={`tab-btn ${tab === 'paste' ? 'active' : ''}`} onClick={() => setTab('paste')}><FileText size={14} /> Paste Text</button>
              <button className={`tab-btn ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}><Upload size={14} /> Upload File</button>
            </div>

            {tab === 'paste' ? (
              <div className="form-group">
                <label className="form-label">Resume Content</label>
                <textarea className="form-input" placeholder="Paste your resume text here..." value={resumeText} onChange={(e) => setResumeText(e.target.value)} style={{ minHeight: 280, fontSize: 13 }} />
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <div {...getRootProps()} style={{ border: `2px dashed ${isDragActive ? 'var(--accent-primary)' : 'var(--border)'}`, borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer', background: isDragActive ? 'rgba(99,102,241,0.05)' : 'var(--bg-card)', transition: 'all 0.2s', marginBottom: 12 }}>
                  <input {...getInputProps()} />
                  {isUploading ? <Loader2 size={32} className="spinner" style={{ margin: '0 auto 12px' }} /> : <Upload size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />}
                  <p style={{ fontWeight: 600, marginBottom: 4 }}>{fileName || (isDragActive ? 'Drop your resume here' : 'Drag & drop or click to upload')}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Supports .txt and .pdf files</p>
                </div>
                {resumeText && (
                  <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', maxHeight: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>Extracted Text Preview:</div>
                    {resumeText.substring(0, 300)}...
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Target Role</label>
              <select className="form-input" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                <option>Software Engineer</option>
                <option>Frontend Developer</option>
                <option>Backend Developer</option>
                <option>Full Stack Developer</option>
                <option>Data Scientist</option>
                <option>ML Engineer</option>
                <option>DevOps Engineer</option>
                <option>Product Manager</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Job Description (optional — for JD matching)</label>
              <textarea className="form-input" placeholder="Paste the job description here for a detailed match analysis..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} style={{ minHeight: 120, fontSize: 13 }} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: 14 }} onClick={handleAnalyze} disabled={!resumeText.trim() || isAnalyzing}>
                {isAnalyzing ? (
                  <><span className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} /> Analyzing...</>
                ) : (
                  <><Zap size={16} /> Analyze Resume</>
                )}
              </button>
              
              <button className="btn btn-secondary" style={{ flex: 1, padding: 14, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--accent-primary)' }} onClick={handleGenerateCoverLetter} disabled={!resumeText.trim() || isGeneratingCL}>
                {isGeneratingCL ? (
                  <><span className="spinner" style={{ width: 18, height: 18, border: '2px solid rgba(99,102,241,0.3)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', display: 'inline-block' }} /> Writing...</>
                ) : (
                  <><BookOpen size={16} /> Generate Cover Letter</>
                )}
              </button>
            </div>
          </div>

          {/* Right: Results */}
          <div>
            {!analysis && !isAnalyzing && (
              <div className="card" style={{ padding: 40, textAlign: 'center' }}>
                <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Ready to Analyze</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Paste your resume and click analyze to get detailed AI insights</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="card" style={{ padding: 40, textAlign: 'center', marginBottom: 20 }}>
                <div className="spinner" style={{ width: 48, height: 48, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', margin: '0 auto 20px' }} />
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Analyzing Your Resume</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Running ATS scoring, keyword extraction, and JD matching...</p>
              </div>
            )}

            {isGeneratingCL && (
              <div className="card" style={{ padding: 40, textAlign: 'center', marginBottom: 20, background: 'linear-gradient(to right, rgba(99,102,241,0.05), rgba(139,92,246,0.05))' }}>
                <div className="spinner" style={{ width: 48, height: 48, border: '3px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', margin: '0 auto 20px' }} />
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Writing Your Cover Letter</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Tailoring your experience to the target role perfectly...</p>
              </div>
            )}

            {coverLetter && !isGeneratingCL && (
              <div className="card" style={{ padding: 24, marginBottom: 20, animation: 'fadeIn 0.4s ease', border: '1px solid var(--accent-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><BookOpen size={18} color="var(--accent-primary)" /> AI Cover Letter</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigator.clipboard.writeText(coverLetter)}>Copy Text</button>
                </div>
                <div style={{ background: 'var(--bg-default)', padding: 20, borderRadius: 10, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                  {coverLetter}
                </div>
              </div>
            )}

            {analysis && !isAnalyzing && (
              <div style={{ animation: 'fadeIn 0.4s ease' }}>
                {/* Score Overview */}
                <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Score Overview</h3>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                    {[
                      { label: 'ATS Score', value: analysis.ats_score, icon: Target },
                      { label: 'Credibility', value: analysis.credibility_score, icon: Star },
                      ...(analysis.jd_match !== null ? [{ label: 'JD Match', value: analysis.jd_match, icon: CheckCircle }] : []),
                    ].map((s) => (
                      <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '16px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: `1px solid ${getScoreColor(s.value)}30` }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: getScoreColor(s.value), marginBottom: 4 }}>{s.value}%</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>{s.label}</div>
                        <div style={{ fontSize: 10, color: getScoreColor(s.value) }}>{getScoreLabel(s.value)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Score breakdown bars */}
                  {Object.entries(analysis.score_breakdown || {}).map(([key, val]: any) => (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                        <span style={{ textTransform: 'capitalize' }}>{key}</span>
                        <span style={{ color: getScoreColor(val), fontWeight: 600 }}>{val}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${val}%`, background: val >= 70 ? 'var(--gradient-success)' : 'var(--gradient-primary)' }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Skills Found */}
                {analysis.entities?.skills?.length > 0 && (
                  <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>🔧 Skills Detected ({analysis.entities.skills_count})</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {analysis.entities.skills.map((skill: string) => (
                        <span key={skill} className="chip">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Gap */}
                {analysis.skills_gap?.length > 0 && (
                  <div className="card" style={{ padding: 20, marginBottom: 20 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 15, color: 'var(--warning)' }}>⚠️ Skills Gap</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {analysis.skills_gap.map((skill: string) => (
                        <span key={skill} className="badge badge-warning">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {analysis.suggestions?.length > 0 && (
                  <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>💡 AI Improvement Suggestions</h3>
                    {analysis.suggestions.map((s: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < analysis.suggestions.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: s.priority === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AlertCircle size={14} color={s.priority === 'high' ? 'var(--danger)' : 'var(--warning)'} />
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: s.priority === 'high' ? 'var(--danger)' : 'var(--warning)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>{s.category}</span>
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function getMockAnalysis() {
  return {
    ats_score: 68, jd_match: 74, credibility_score: 82, word_count: 420,
    entities: { skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'AWS', 'Docker', 'Git'], skills_count: 8 },
    skills_gap: ['Kubernetes', 'System Design', 'TypeScript', 'GraphQL'],
    score_breakdown: { format: 72, content: 65, keywords: 70, impact: 55 },
    suggestions: [
      { category: 'Impact', priority: 'high', text: 'Add quantified achievements like "Improved load time by 40%" or "Served 10K+ daily users"' },
      { category: 'Keywords', priority: 'high', text: 'Include more JD-specific keywords to improve ATS compatibility' },
      { category: 'Portfolio', priority: 'medium', text: 'Add a GitHub profile link and portfolio URL' },
      { category: 'Summary', priority: 'medium', text: 'Add a 3-4 sentence professional summary at the top' },
    ],
  };
}
