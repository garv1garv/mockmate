import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { analyticsAPI } from '../lib/api';
import Sidebar from '../components/Sidebar';

export default function DashboardPage() {
  const { user } = useSelector((s: any) => s.auth);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then((res: any) => setAnalytics(res.analytics))
      .catch(() => setAnalytics(getMockAnalytics()));
  }, []);

  const data = analytics || getMockAnalytics();

  const barData = [
    { subject: 'DSA', score: 2 },
    { subject: 'DBMS', score: 5 },
    { subject: 'OOP', score: 24 },
    { subject: 'OS', score: 2 },
    { subject: 'CN', score: 3 },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ maxWidth: 1000 }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 24 }}>
          <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="stat-label" style={{ marginBottom: 16 }}>TOTAL INTERVIEWS</div>
            <div className="stat-value" style={{ fontSize: 48, marginBottom: 16 }}>{data.totalSessions || 32}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Great job! Keep the momentum going.</div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div className="stat-label" style={{ marginBottom: 16 }}>SCORE EVOLUTION</div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.scoreTrend?.length ? data.scoreTrend : mockTrend}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="stat-label" style={{ marginBottom: 24 }}>PERFORMANCE BY SUBJECT</div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="stat-label" style={{ marginBottom: 24 }}>RECENT HISTORY</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ color: '#64748b', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0 0 16px 0', textAlign: 'left' }}>SUBJECT</th>
                <th style={{ padding: '0 0 16px 0', textAlign: 'left' }}>DIFFICULTY</th>
                <th style={{ padding: '0 0 16px 0', textAlign: 'left' }}>DATE</th>
                <th style={{ padding: '0 0 16px 0', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '16px 0', fontWeight: 600 }}>DSA</td>
                <td style={{ padding: '16px 0' }}><span style={{ padding: '4px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }}>Hard</span></td>
                <td style={{ padding: '16px 0', color: '#64748b' }}>Sun Mar 08 2026</td>
                <td style={{ padding: '16px 0', textAlign: 'right' }}><button style={{ padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View Report</button></td>
              </tr>
              <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: '16px 0', fontWeight: 600 }}>DBMS</td>
                <td style={{ padding: '16px 0' }}><span style={{ padding: '4px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 12 }}>Easy</span></td>
                <td style={{ padding: '16px 0', color: '#64748b' }}>Mon Mar 09 2026</td>
                <td style={{ padding: '16px 0', textAlign: 'right' }}><button style={{ padding: '6px 12px', background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>View Report</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

const mockTrend = [
  { score: 0 }, { score: 0 }, { score: 20 }, { score: 60 }, { score: 0 }, { score: 50 }, { score: 0 }, { score: 0 }, { score: 30 }, { score: 0 }
];
function getMockAnalytics() {
  return { totalSessions: 32, scoreTrend: mockTrend };
}
