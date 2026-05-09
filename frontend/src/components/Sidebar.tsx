import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LayoutDashboard, Play, FileText, BookOpen, BarChart3, Settings, LogOut, Brain, Trophy, Flame, Box } from 'lucide-react';
import { logout } from '../store/slices/authSlice';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: Play, label: 'Interview', to: '/interview/new' },
  { icon: FileText, label: 'Resume', to: '/resume' },
  { icon: BookOpen, label: 'Learning Path', to: '/learning-path' },
  { icon: Box, label: 'Project Critique', to: '/project-critique' },
];

export default function Sidebar() {
  const location = useLocation();
  const dispatch = useDispatch<any>();
  const { user } = useSelector((s: any) => s.auth);

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingLeft: 4 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Brain size={18} color="white" />
        </div>
        <div>
          <span style={{ fontSize: 16, fontWeight: 800, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MockMate</span>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -2 }}>AI Interview Coach</div>
        </div>
      </div>

      <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 14px', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {user?.name?.[0] || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.profile?.targetRole || 'Software Engineer'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: 14 }}>{user?.stats?.totalSessions || 0}</div>
            Sessions
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 14 }}>{user?.stats?.averageScore || 0}%</div>
            Avg Score
          </div>
          <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 700, color: 'var(--warning)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <Flame size={12} />{user?.stats?.streak || 0}
            </div>
            Streak
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20, paddingLeft: 4 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Navigation</div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <Link key={item.to} to={item.to} className={`nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
        <Link to="/settings" className="nav-item" style={{ textDecoration: 'none', marginBottom: 4 }}>
          <Settings size={18} /> Settings
        </Link>
        <button className="nav-item" onClick={() => dispatch(logout())} style={{ color: 'var(--danger)', width: '100%' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
