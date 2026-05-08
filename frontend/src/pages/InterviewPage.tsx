import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brain, Clock, ChevronRight, Mic, MicOff, Code, MessageSquare, SkipForward, CheckCircle, AlertCircle, Lightbulb, Volume2, RotateCcw } from 'lucide-react';
import { interviewAPI } from '../lib/api';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';

type Phase = 'setup' | 'interview' | 'results';

const PERSONAS = [
  { id: 'friendly', label: '😊 Friendly', desc: 'Supportive and encouraging interviewer' },
  { id: 'neutral', label: '😐 Neutral', desc: 'Professional, by-the-book interviewer' },
  { id: 'challenging', label: '🔥 Challenging', desc: 'Probing and pushes you to think deeper' },
  { id: 'skeptical', label: '🤨 Skeptical', desc: 'Questions everything, needs convincing' },
];

export default function InterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((s: any) => s.auth);
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<any>({ 
    type: searchParams.get('type') || 'technical', 
    difficulty: 'medium', 
    mode: 'ai',
    category: 'general', 
    persona: 'neutral', 
    company: '',
    useResume: false
  });
  const [sessionId, setSessionId] = useState('');
  const [question, setQuestion] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isLoadingQ, setIsLoadingQ] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [sessionResults, setSessionResults] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);



  // Timer
  useEffect(() => {
    if (phase !== 'interview' || evaluation) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmitAnswer(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, question, evaluation]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startSession = async () => {
    try {
      setPreviousQuestions([]);
      setQuestionIndex(0);
      const res = await interviewAPI.start({
        ...config,
        resumeContext: config.useResume ? user?.profile?.resumeText : null
      }) as any;
      const newSid = res.sessionId;
      setSessionId(newSid);
      setPhase('interview');
      await loadNextQuestion(newSid, 0);
    } catch {
      const localSid = 'local-' + Date.now();
      setSessionId(localSid);
      setPhase('interview');
      await loadNextQuestion(localSid, 0);
    }
  };

  const loadNextQuestion = async (sid?: string, index?: number) => {
    setIsLoadingQ(true);
    setAnswer('');
    setEvaluation(null);
    setShowHint(false);
    const targetSid = sid || sessionId;
    const targetIndex = index !== undefined ? index : questionIndex;
    try {
      const res = await interviewAPI.getQuestion({ 
        sessionId: targetSid, 
        type: config.type, 
        difficulty: config.difficulty, 
        category: config.category,
        previousQuestions: previousQuestions
      }) as any;
      setQuestion(res.question);
      setPreviousQuestions(prev => [...prev, res.question?.text || '']);
      setTimeLeft(res.question?.timeLimit || 180);
    } catch {
      const fallback = getFallbackQuestion(config.type, config.difficulty, targetIndex);
      setQuestion(fallback);
      setPreviousQuestions(prev => [...prev, fallback.text]);
      setTimeLeft(180);
    }
    setIsLoadingQ(false);
  };

  const handleSubmitAnswer = useCallback(async () => {
    if (!answer.trim() || isEvaluating) return;
    clearInterval(timerRef.current);
    setIsEvaluating(true);
    try {
      const res = await interviewAPI.evaluate({
        sessionId,
        questionText: question?.text,
        userAnswer: answer,
        expectedAnswer: question?.expected_answer || question?.expectedAnswer || '',
        questionType: config.type,
      }) as any;
      setEvaluation(res.evaluation);
      setSessionResults((prev) => [...prev, { question, answer, evaluation: res.evaluation }]);
    } catch {
      const fallback = fallbackEvaluate(answer);
      setEvaluation(fallback);
      setSessionResults((prev) => [...prev, { question, answer, evaluation: fallback }]);
    }
    setIsEvaluating(false);
  }, [answer, question, sessionId, config.type, isEvaluating]);

  const handleNext = async () => {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= totalQuestions) {
      await finishSession();
    } else {
      setQuestionIndex(nextIndex);
      await loadNextQuestion(sessionId, nextIndex);
    }
  };

  const finishSession = async () => {
    try { await interviewAPI.complete({ sessionId }); } catch {}
    setPhase('results');
  };

  const toggleSpeech = () => {
    if (!('webkitSpeechRecognition' in window)) { alert('Speech recognition not supported in this browser. Use Chrome.'); return; }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (e: any) => {
        const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
        setAnswer(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    }
  };

  const avgScore = sessionResults.length ? Math.round(sessionResults.reduce((s, r) => s + (r.evaluation?.scores?.overall || 0), 0) / sessionResults.length) : 0;

  if (phase === 'setup') {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 600, width: '100%', animation: 'fadeIn 0.4s ease' }}>
            <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>Configure Your <span className="gradient-text">Interview</span></h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Customize your mock interview session</p>

            <div className="card" style={{ padding: 32 }}>
              {/* Type */}
              <div className="form-group">
                <label className="form-label">Interview Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {['technical', 'behavioral', 'system-design', 'coding', 'mixed', 'mock'].map((t) => (
                    <button key={t} onClick={() => setConfig({ ...config, type: t })} className="btn" style={{ padding: '10px', fontSize: 12, background: config.type === t ? 'var(--gradient-primary)' : 'var(--bg-card)', color: config.type === t ? 'white' : 'var(--text-secondary)', border: `1px solid ${config.type === t ? 'transparent' : 'var(--border)'}`, textTransform: 'capitalize' }}>
                      {t.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Difficulty</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['easy', 'medium', 'hard'].map((d) => (
                    <button key={d} onClick={() => setConfig({ ...config, difficulty: d })} className="btn" style={{ flex: 1, padding: '12px', fontSize: 13, background: config.difficulty === d ? 'var(--gradient-primary)' : 'var(--bg-card)', color: config.difficulty === d ? 'white' : 'var(--text-secondary)', border: `1px solid ${config.difficulty === d ? 'transparent' : 'var(--border)'}`, textTransform: 'capitalize' }}>
                      {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selection */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Brain size={14} /> Interview Mode
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div 
                    onClick={() => setConfig({ ...config, mode: 'ai' })} 
                    style={{ flex: 1, padding: '16px', borderRadius: 12, border: `2px solid ${config.mode === 'ai' ? 'var(--accent-primary)' : 'var(--border)'}`, background: config.mode === 'ai' ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                  >
                    {config.mode === 'ai' && <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--accent-primary)', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</div>}
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: config.mode === 'ai' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>AI Mode</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Generative LLM questions & detailed AI analytics.</div>
                  </div>
                  <div 
                    onClick={() => setConfig({ ...config, mode: 'classic' })} 
                    style={{ flex: 1, padding: '16px', borderRadius: 12, border: `2px solid ${config.mode === 'classic' ? 'var(--accent-primary)' : 'var(--border)'}`, background: config.mode === 'classic' ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                  >
                    {config.mode === 'classic' && <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--accent-primary)', color: 'white', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</div>}
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: config.mode === 'classic' ? 'var(--accent-primary)' : 'var(--text-primary)' }}>Classic Mode</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Curated questions from the platform database.</div>
                  </div>
                </div>
              </div>

              {/* Persona */}
              <div className="form-group">
                <label className="form-label">Interviewer Persona</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {PERSONAS.map((p) => (
                    <button key={p.id} onClick={() => setConfig({ ...config, persona: p.id })} style={{ padding: '12px 14px', textAlign: 'left', border: `1px solid ${config.persona === p.id ? 'var(--accent-primary)' : 'var(--border)'}`, borderRadius: 10, background: config.persona === p.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 3 }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Company */}
              <div className="form-group">
                <label className="form-label">Target Company (optional)</label>
                <select className="form-input" value={config.company} onChange={(e) => setConfig({ ...config, company: e.target.value })}>
                  <option value="">General Practice</option>
                  <option value="google">Google</option>
                  <option value="amazon">Amazon</option>
                  <option value="microsoft">Microsoft</option>
                  <option value="meta">Meta</option>
                  <option value="startup">Startup</option>
                </select>
              </div>

              {/* Resume Context */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <div 
                  onClick={() => {
                    if (user?.profile?.resumeText) {
                      setConfig({ ...config, useResume: !config.useResume });
                    } else {
                      toast.error('Please upload your resume in the Resume section first!');
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderRadius: 10, border: `1px solid ${config.useResume ? 'var(--accent-primary)' : 'var(--border)'}`, background: config.useResume ? 'rgba(99,102,241,0.05)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${config.useResume ? 'var(--accent-primary)' : 'var(--text-muted)'}`, background: config.useResume ? 'var(--accent-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {config.useResume && <CheckCircle size={12} color="white" />}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: config.useResume ? 'var(--accent-primary)' : 'var(--text-primary)' }}>Base interview on my resume</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>AI will ask questions about your specific experience and projects.</div>
                  </div>
                </div>
              </div>

              {/* Question Count */}
              <div className="form-group">
                <label className="form-label">Number of Questions</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[5, 10, 15, 20].map((num) => (
                    <button key={num} onClick={() => setTotalQuestions(num)} className="btn" style={{ flex: 1, padding: '10px', fontSize: 13, background: totalQuestions === num ? 'var(--gradient-primary)' : 'var(--bg-card)', color: totalQuestions === num ? 'white' : 'var(--text-secondary)', border: `1px solid ${totalQuestions === num ? 'transparent' : 'var(--border)'}` }}>
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 15 }} onClick={startSession}>
                <Brain size={18} /> Start Interview Session <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>{avgScore >= 80 ? '🎉' : avgScore >= 60 ? '👏' : '💪'}</div>
              <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Session Complete!</h1>
              <p style={{ color: 'var(--text-secondary)' }}>You answered {sessionResults.length} questions</p>
            </div>

            <div className="grid-3" style={{ marginBottom: 32 }}>
              {[
                { label: 'Overall Score', value: `${avgScore}%`, color: avgScore >= 70 ? '#10b981' : avgScore >= 50 ? '#f59e0b' : '#ef4444' },
                { label: 'Questions', value: sessionResults.length, color: '#6366f1' },
                { label: 'Readiness', value: `${Math.min(100, Math.round(avgScore * 1.1))}%`, color: '#8b5cf6' },
              ].map((s) => (
                <div key={s.label} className="card" style={{ padding: 24, textAlign: 'center' }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Question Breakdown</h3>
              {sessionResults.map((r, i) => (
                <div key={i} style={{ padding: '16px 0', borderBottom: i < sessionResults.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500, flex: 1, marginRight: 16 }}>Q{i + 1}: {r.question?.text?.substring(0, 80)}...</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: (r.evaluation?.scores?.overall || 0) >= 70 ? 'var(--success)' : 'var(--warning)', flexShrink: 0 }}>{r.evaluation?.scores?.overall || 0}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${r.evaluation?.scores?.overall || 0}%`, background: 'var(--gradient-primary)' }} />
                  </div>
                  {r.evaluation?.feedback && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>{r.evaluation.feedback}</p>}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => { setPhase('setup'); setSessionResults([]); setQuestionIndex(0); setPreviousQuestions([]); }}>
                <RotateCcw size={16} /> Try Again
              </button>
              <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
                <CheckCircle size={16} /> Back to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {/* Progress bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Question {questionIndex + 1} of {totalQuestions}</span>
              <div className="progress-bar" style={{ width: 200, marginTop: 6 }}>
                <div className="progress-fill progress-primary" style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className={`timer ${timeLeft < 30 ? 'danger' : timeLeft < 60 ? 'warning' : ''}`} style={{ fontSize: 20, fontFamily: 'JetBrains Mono' }}>
                <Clock size={16} style={{ display: 'inline', marginRight: 6 }} />{formatTime(timeLeft)}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => finishSession()}>
                <SkipForward size={14} /> End Session
              </button>
            </div>
          </div>

          {/* Question */}
          <div className="question-card" style={{ marginBottom: 24 }}>
            {isLoadingQ ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="spinner" style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-secondary)' }}>{config.mode === 'ai' ? 'AI is generating your question...' : 'Loading from question bank...'}</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className={`badge badge-${config.difficulty === 'hard' ? 'danger' : config.difficulty === 'medium' ? 'warning' : 'success'}`}>
                      {config.difficulty}
                    </span>
                    <span className="badge badge-primary">{question?.category || config.type}</span>
                    <span className="badge" style={{ background: config.mode === 'ai' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.15)', color: config.mode === 'ai' ? '#8b5cf6' : '#10b981', border: `1px solid ${config.mode === 'ai' ? 'rgba(139,92,246,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
                      {config.mode === 'ai' ? '🤖 AI' : '📚 Classic'}
                    </span>
                    {config.useResume && <span className="badge" style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>📄 Resume</span>}
                  </div>
                  <button onClick={() => setShowHint(!showHint)} className="btn btn-secondary btn-sm">
                    <Lightbulb size={13} /> {showHint ? 'Hide Hint' : 'Hint'}
                  </button>
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.6, marginBottom: 16 }}>
                  {question?.text || 'Loading question...'}
                </h2>
                {showHint && question?.keywords?.length > 0 && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--warning)' }}>
                    💡 Key concepts: {question.keywords.slice(0, 4).join(', ')}
                  </div>
                )}
                {question?.code_template && (
                  <div style={{ marginTop: 16 }}>
                    <pre className="code-block" style={{ fontSize: 13 }}>{question.code_template}</pre>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Answer area */}
          {!evaluation ? (
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: 14, fontWeight: 600 }}>{config.type === 'coding' ? 'Your Code' : 'Your Answer'}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={toggleSpeech} className={`btn btn-sm ${isListening ? 'btn-danger' : 'btn-secondary'}`}>
                    {isListening ? <><MicOff size={13} /> Stop</> : <><Mic size={13} /> Speak</>}
                  </button>
                </div>
              </div>
              <textarea
                className="form-input"
                placeholder={config.type === 'coding' ? 'Write your code solution here...' : 'Type your detailed answer here. Be specific, use examples, and cover all key points...'}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                style={{ minHeight: 200, fontFamily: config.type === 'coding' ? 'JetBrains Mono' : 'Inter', fontSize: config.type === 'coding' ? 13 : 14, resize: 'vertical' }}
              />
              {isListening && <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 8 }}>🎤 Listening... speak your answer</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmitAnswer} disabled={!answer.trim() || isEvaluating}>
                  {isEvaluating ? (
                    <><span className="spinner" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block' }} /> Evaluating...</>
                  ) : (
                    <><CheckCircle size={16} /> Submit Answer</>
                  )}
                </button>
                <button className="btn btn-secondary" onClick={handleNext}>
                  <SkipForward size={16} /> Skip
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 24, animation: 'fadeIn 0.4s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700 }}>AI Evaluation</h3>
                <div style={{ fontSize: 28, fontWeight: 800, color: (evaluation.scores?.overall || 0) >= 70 ? 'var(--success)' : (evaluation.scores?.overall || 0) >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                  {evaluation.scores?.overall || 0}%
                </div>
              </div>

              <div className="grid-4" style={{ marginBottom: 20 }}>
                {[
                  { label: 'Semantic', key: 'semantic', color: '#6366f1' },
                  { label: 'Factual', key: 'factual', color: '#8b5cf6' },
                  { label: 'Complete', key: 'completeness', color: '#06b6d4' },
                  { label: 'Clarity', key: 'clarity', color: '#10b981' },
                ].map((m) => (
                  <div key={m.key} style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{evaluation.scores?.[m.key] || 0}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)' }}>{evaluation.feedback}</p>
              </div>

              {evaluation.suggestions?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>💡 Suggestions:</p>
                  {evaluation.suggestions.map((s: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      <AlertCircle size={14} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                      {s}
                    </div>
                  ))}
                </div>
              )}

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleNext}>
                {questionIndex + 1 >= totalQuestions ? <><CheckCircle size={16} /> Complete Session</> : <><ChevronRight size={16} /> Next Question</>}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function getFallbackQuestion(type: string, difficulty: string, index: number) {
  const questions = [
    { text: 'Explain the difference between process and thread in operating systems.', category: 'OS', keywords: ['concurrency', 'memory', 'scheduling', 'context switch'], expected_answer: 'A process is an independent program with its own memory space. A thread is a lightweight unit of execution within a process sharing the same memory.' },
    { text: 'What is the time and space complexity of merge sort?', category: 'Algorithms', keywords: ['O(n log n)', 'O(n)', 'stable', 'divide and conquer'], expected_answer: 'Merge sort has O(n log n) time complexity for all cases and O(n) space complexity due to the auxiliary array used for merging.' },
    { text: 'Tell me about a time you resolved a conflict within your team.', category: 'Behavioral', keywords: ['communication', 'empathy', 'resolution', 'compromise'], expected_answer: 'Use STAR format: describe the situation, conflicting parties, your mediation approach, and the positive resolution achieved.' },
    { text: 'How would you design a notification system for millions of users?', category: 'System Design', keywords: ['message queue', 'pub-sub', 'Kafka', 'push', 'scalability'], expected_answer: 'Use a message queue (Kafka/RabbitMQ) for pub-sub architecture, WebSockets for real-time push, with horizontal scaling and retry mechanisms.' },
    { text: 'What are SOLID principles in object-oriented design?', category: 'OOP', keywords: ['Single Responsibility', 'Open-Closed', 'Liskov', 'Interface', 'Dependency'], expected_answer: 'SOLID: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion — principles for maintainable OOP code.' },
    { text: 'Explain the CAP theorem and its implications for distributed systems.', category: 'System Design', keywords: ['consistency', 'availability', 'partition tolerance', 'trade-offs'], expected_answer: 'CAP theorem states that a distributed system can only guarantee two of three: Consistency, Availability, and Partition Tolerance. Most systems choose AP or CP.' },
    { text: 'What is the difference between TCP and UDP? When would you use each?', category: 'Networking', keywords: ['reliable', 'connectionless', 'streaming', 'latency'], expected_answer: 'TCP is reliable and connection-oriented (HTTP, file transfer). UDP is fast and connectionless (video streaming, gaming, DNS).' },
    { text: 'Explain the event loop in JavaScript and how asynchronous code executes.', category: 'JavaScript', keywords: ['call stack', 'callback queue', 'microtask', 'non-blocking'], expected_answer: 'JS is single-threaded. The event loop processes the call stack, then microtasks (Promises), then macrotasks (setTimeout). This enables non-blocking I/O.' },
    { text: 'What is database normalization? Explain up to 3NF with examples.', category: 'Databases', keywords: ['1NF', '2NF', '3NF', 'redundancy', 'functional dependency'], expected_answer: '1NF: atomic values. 2NF: no partial dependencies. 3NF: no transitive dependencies. Normalization reduces redundancy but may increase JOIN complexity.' },
    { text: 'How would you detect and resolve a deadlock in a concurrent system?', category: 'OS', keywords: ['mutual exclusion', 'hold and wait', 'circular wait', 'resource ordering'], expected_answer: 'Deadlocks require 4 conditions. Prevention strategies: resource ordering, timeouts, lock hierarchy. Detection: wait-for graphs. Resolution: process termination or rollback.' },
    { text: 'Describe the differences between REST and GraphQL APIs.', category: 'Web', keywords: ['over-fetching', 'schema', 'resolver', 'endpoint'], expected_answer: 'REST uses multiple endpoints with fixed responses. GraphQL uses a single endpoint with client-specified queries, reducing over/under-fetching.' },
    { text: 'Explain how a hash map handles collisions and achieves O(1) average lookup.', category: 'Data Structures', keywords: ['chaining', 'open addressing', 'load factor', 'rehashing'], expected_answer: 'Hash maps use a hash function to map keys to buckets. Collisions are resolved via chaining (linked lists) or open addressing (probing). Load factor triggers rehashing.' },
    { text: 'Walk me through designing an LRU Cache from scratch.', category: 'Data Structures', keywords: ['doubly linked list', 'hashmap', 'O(1)', 'eviction'], expected_answer: 'Combine a HashMap (key → node) with a Doubly Linked List (order). get/put are O(1). On capacity overflow, evict the tail node (least recently used).' },
    { text: 'Describe a time you had to learn a new technology quickly under pressure.', category: 'Behavioral', keywords: ['adaptability', 'learning', 'time management', 'growth mindset'], expected_answer: 'STAR: Situation with tight deadline, Task requiring new tech, Action steps taken to learn quickly, Result achieved successfully.' },
    { text: 'What are indexes in databases and how do they improve query performance?', category: 'Databases', keywords: ['B-tree', 'clustered', 'non-clustered', 'query optimizer'], expected_answer: 'Indexes are B-tree/hash structures that allow O(log n) lookups instead of O(n) scans. Trade-off: faster reads but slower writes and extra storage.' },
    { text: 'Explain the concept of Virtual Memory and how paging works.', category: 'OS', keywords: ['page table', 'page fault', 'swap', 'TLB'], expected_answer: 'Virtual memory maps logical addresses to physical via page tables. When a page isn\'t in RAM, a page fault triggers loading from disk. TLB caches translations.' },
    { text: 'How would you design a URL shortener like bit.ly?', category: 'System Design', keywords: ['base62', 'hashing', 'database', 'redirection', 'analytics'], expected_answer: 'Generate short codes via base62 encoding of auto-increment IDs or hash. Store in DB (short → long URL). 301/302 redirect. Add caching (Redis) for hot URLs.' },
    { text: 'What is the difference between var, let, and const in JavaScript?', category: 'JavaScript', keywords: ['hoisting', 'block scope', 'function scope', 'temporal dead zone'], expected_answer: 'var is function-scoped and hoisted. let is block-scoped, not hoisted to use before declaration. const is block-scoped and cannot be reassigned.' },
    { text: 'Explain the Observer and Strategy design patterns with use cases.', category: 'OOP', keywords: ['publish-subscribe', 'decoupling', 'runtime behavior', 'interfaces'], expected_answer: 'Observer: one-to-many notification (event systems). Strategy: swap algorithms at runtime via interfaces (sorting strategies, payment methods).' },
    { text: 'How does HTTPS work? Explain the TLS handshake process.', category: 'Networking', keywords: ['TLS', 'certificate', 'asymmetric', 'symmetric', 'handshake'], expected_answer: 'Client sends hello → server sends certificate → client verifies CA → they exchange keys via asymmetric encryption → switch to symmetric for fast data transfer.' },
  ];
  return questions[index % questions.length];
}

function fallbackEvaluate(answer: string) {
  const len = answer.split(' ').length;
  const base = Math.min(85, 30 + len * 1.5);
  return {
    scores: { semantic: Math.round(base), factual: Math.round(base - 5), completeness: Math.round(base - 10), clarity: Math.round(base + 5), overall: Math.round(base) },
    feedback: len > 50 ? 'Good detailed answer! Consider adding more specific examples and technical depth.' : 'Answer is a bit brief. Expand with examples and cover more aspects of the topic.',
    suggestions: ['Add concrete examples to support your points', 'Consider mentioning trade-offs and alternatives', 'Structure your answer with a clear introduction and conclusion'],
  };
}
