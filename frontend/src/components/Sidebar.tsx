import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, Home, LayoutDashboard, User, Settings as SettingsIcon } from 'lucide-react';
import { logout } from '../store/slices/authSlice';

export default function Sidebar() {
  const { user } = useSelector((s: any) => s.auth);
  const dispatch = useDispatch();
  const location = useLocation();

  if (!user) return null;

  return (
    <div className="top-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Link to="/dashboard" style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', textDecoration: 'none' }}>
          MockMate
        </Link>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/dashboard" style={{ color: location.pathname === '/dashboard' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600 }}>Dashboard</Link>
          <Link to="/resume" style={{ color: location.pathname === '/resume' ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600 }}>Resume</Link>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontWeight: 600 }}>Hi, {user.name.split(' ')[0]} 👋</div>
        <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', borderRadius: 20 }}>
          🌗 Toggle Mode
        </button>
        <Link to="/settings" className="btn btn-secondary btn-sm" style={{ padding: 8 }}>
          <SettingsIcon size={16} />
        </Link>
        <button onClick={() => dispatch(logout())} className="btn btn-outline btn-sm" style={{ padding: 8, borderColor: 'var(--border)' }}>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
