import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Briefcase, Mail, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { authAPI } from '../lib/api';
import { getMe } from '../store/slices/authSlice';

export default function SettingsPage() {
  const dispatch = useDispatch<any>();
  const { user } = useSelector((s: any) => s.auth);
  
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    targetRole: '',
  });

  const [aiForm, setAiForm] = useState({
    aiProvider: 'ollama',
    ollamaHost: 'http://127.0.0.1:11434',
    ollamaModel: 'llama3',
    geminiApiKey: '',
  });
  const [isSavingAI, setIsSavingAI] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        targetRole: user.profile?.targetRole || 'Software Engineer',
      });
      setAiForm({
        aiProvider: user.aiSettings?.provider || 'ollama',
        ollamaHost: user.aiSettings?.ollamaHost || 'http://127.0.0.1:11434',
        ollamaModel: user.aiSettings?.ollamaModel || 'llama3',
        geminiApiKey: user.aiSettings?.geminiApiKey || '',
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await authAPI.updateProfile({
        name: form.name,
        profile: {
          ...user.profile,
          targetRole: form.targetRole
        }
      });
      await dispatch(getMe());
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAI = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAI(true);
    try {
      await authAPI.updateAISettings(aiForm);
      await dispatch(getMe());
      toast.success('AI Settings updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update AI settings');
    } finally {
      setIsSavingAI(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '40px', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Account Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your personal information and preferences.</p>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>Profile Information</h2>
          
          <form onSubmit={handleSave}>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  className="form-input" 
                  style={{ paddingLeft: 40 }} 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Email Address <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 400 }}>(Cannot be changed)</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  className="form-input" 
                  style={{ paddingLeft: 40, background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }} 
                  type="email" 
                  value={user?.email || ''} 
                  disabled 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 32 }}>
              <label className="form-label">Target Role</label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select 
                  className="form-input" 
                  style={{ paddingLeft: 40 }} 
                  value={form.targetRole} 
                  onChange={(e) => setForm({...form, targetRole: e.target.value})}
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Data Scientist">Data Scientist</option>
                  <option value="ML Engineer">ML Engineer</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Product Manager">Product Manager</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ padding: 32, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>Application Settings</h2>
          
          <form onSubmit={handleSaveAI}>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">AI Provider</label>
              <select 
                className="form-input" 
                value={aiForm.aiProvider} 
                onChange={(e) => setAiForm({...aiForm, aiProvider: e.target.value})}
              >
                <option value="ollama">Local AI (Ollama)</option>
                <option value="gemini">Google Gemini</option>
              </select>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {aiForm.aiProvider === 'ollama' 
                  ? 'Use your local Ollama instance for free, private inference.' 
                  : 'Use Google Gemini for high-fidelity, high-speed interview simulation.'}
              </p>
            </div>

            {aiForm.aiProvider === 'ollama' ? (
              <>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Ollama Base URL</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    value={aiForm.ollamaHost} 
                    onChange={(e) => setAiForm({...aiForm, ollamaHost: e.target.value})} 
                    placeholder="http://127.0.0.1:11434"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 32 }}>
                  <label className="form-label">Ollama Model Name</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    value={aiForm.ollamaModel} 
                    onChange={(e) => setAiForm({...aiForm, ollamaModel: e.target.value})} 
                    placeholder="llama3"
                  />
                </div>
              </>
            ) : (
              <div className="form-group" style={{ marginBottom: 32 }}>
                <label className="form-label">Gemini API Key</label>
                <input 
                  className="form-input" 
                  type="password" 
                  value={aiForm.geminiApiKey} 
                  onChange={(e) => setAiForm({...aiForm, geminiApiKey: e.target.value})} 
                  placeholder="Enter your Google AI API key"
                  style={{ fontFamily: 'monospace' }}
                />
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Google AI Studio</a>
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button type="submit" className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }} disabled={isSavingAI}>
                {isSavingAI ? 'Saving...' : <><Save size={16} /> Save AI Settings</>}
              </button>
            </div>
          </form>
        </div>

        <div className="card" style={{ padding: 32, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: 'var(--danger)' }}>Danger Zone</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Delete Account</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Permanently delete your account and all associated data.</div>
            </div>
            <button className="btn" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.3)' }} onClick={() => toast.error('This action is disabled in the demo.')}>
              <AlertCircle size={16} /> Delete Account
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
