import React, { useState, useEffect } from 'react';
import { Users, Clock, FileText, ChevronRight, MessageCircle, Search, Layers, Flag, AlertTriangle, Shield } from 'lucide-react';
import { api } from '../services/api';
import ExplainableDecisionBreakdown from './ExplainableDecisionBreakdown';

const EMPLOYEES = [
  { username: 'employee1', displayName: 'Employee 1', role: 'Engineering Employee' },
  { username: 'employee2', displayName: 'Employee 2', role: 'Engineering Employee' },
  { username: 'employee3', displayName: 'Employee 3', role: 'Engineering Employee' },
];

const OUTCOME_COLORS = {
  CONSISTENT:        { color: '#047857', bg: '#ecfdf5' },
  CONFLICT:          { color: '#b91c1c', bg: '#fef2f2' },
  GAP:               { color: '#b45309', bg: '#fffbeb' },
  'FLAG FOR REVIEW': { color: '#6d28d9', bg: '#f5f3ff' },
};

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function firstSentence(text = '') {
  const m = text.match(/^[^.!?]+[.!?]/);
  return m ? m[0].trim() : text.slice(0, 100);
}

export default function AdminDashboard() {
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await api.getChatSessions('admin', 'admin');
      setAllSessions(res.sessions || []);
    } catch (_) {}
    setLoading(false);
  };

  const empSessions = (username) => allSessions.filter(s => s.username === username);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(2, 132, 199, 0.22)',
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          flexShrink: 0
        }}>
          <img src="/admin-logo.png" alt="Admin Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Admin Dashboard</h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Monitor registered employees and their search activity
          </p>
        </div>
      </div>

      {/* ── Employee Cards ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {EMPLOYEES.map(emp => {
          const sessions = empSessions(emp.username);
          const isSelected = selectedEmployee === emp.username;
          return (
            <div
              key={emp.username}
              onClick={() => { setSelectedEmployee(isSelected ? null : emp.username); setSelectedSession(null); }}
              style={{
                background: '#fff', border: `1.5px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                borderRadius: '14px', padding: '18px 20px', cursor: 'pointer',
                boxShadow: isSelected ? '0 4px 16px rgba(2,132,199,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#94a3b8'; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#e2e8f0'; }}
            >
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: isSelected ? 'linear-gradient(135deg, #0284c7, #2563eb)' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.88rem', fontWeight: '900',
                  color: isSelected ? '#fff' : '#64748b',
                  transition: 'all 0.2s ease'
                }}>
                  {emp.displayName.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>{emp.displayName}</p>
                  <p style={{ fontSize: '0.72rem', color: '#64748b' }}>{emp.username}</p>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0284c7' }}>{sessions.length}</p>
                  <p style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600' }}>Queries</p>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', flex: 1, textAlign: 'center' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#334155' }}>
                    {sessions.length > 0 ? fmtDate(sessions[0]?.updatedAt || sessions[0]?.createdAt) : '—'}
                  </p>
                  <p style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '600' }}>Last Active</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: '700', color: isSelected ? '#0284c7' : '#94a3b8' }}>
                  {isSelected ? 'Hide History ▲' : 'View History ▼'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Employee History ─── */}
      {selectedEmployee && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedSession ? '360px 1fr' : '1fr', gap: '18px', alignItems: 'start' }}>

          {/* Session List */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={15} color="#0284c7" />
                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a' }}>
                  {EMPLOYEES.find(e => e.username === selectedEmployee)?.displayName}'s History
                </span>
              </div>
              <span style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '800' }}>
                {empSessions(selectedEmployee).length} sessions
              </span>
            </div>

            {empSessions(selectedEmployee).length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                <Search size={28} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.84rem', fontWeight: '600' }}>No queries yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {empSessions(selectedEmployee).map(session => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                    style={{
                      padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                      background: selectedSession?.id === session.id ? '#f0f9ff' : '#fff',
                      borderLeft: selectedSession?.id === session.id ? '3px solid #0284c7' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => { if (selectedSession?.id !== session.id) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (selectedSession?.id !== session.id) e.currentTarget.style.background = '#fff'; }}
                  >
                    <p style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {session.title || 'Untitled query'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.66rem', color: '#0284c7', background: '#f0f9ff', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                        {(session.standardA || '').replace('.pdf', '').replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>vs</span>
                      <span style={{ fontSize: '0.66rem', color: '#059669', background: '#f0fdf4', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                        {(session.standardB || '').replace('.pdf', '').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={10} color="#94a3b8" />
                      <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>{fmtDate(session.updatedAt || session.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session Detail */}
          {selectedSession && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.88rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{selectedSession.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: '#0284c7', background: '#f0f9ff', padding: '2px 8px', borderRadius: '5px', fontWeight: '700' }}>
                    A: {(selectedSession.standardA || '').replace('.pdf', '').replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#059669', background: '#f0fdf4', padding: '2px 8px', borderRadius: '5px', fontWeight: '700' }}>
                    B: {(selectedSession.standardB || '').replace('.pdf', '').replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{fmtDate(selectedSession.createdAt)}</span>
                </div>
              </div>

              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(selectedSession.messages || []).map((msg, i) => (
                  <div key={i}>
                    {msg.type === 'user' && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff', borderRadius: '14px 14px 4px 14px', padding: '10px 16px', maxWidth: '75%', fontSize: '0.86rem', fontWeight: '600', lineHeight: '1.5' }}>
                          {msg.text}
                        </div>
                      </div>
                    )}
                    {msg.type === 'error' && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '0.82rem', color: '#b91c1c', fontWeight: '600' }}>
                        ⚠ {msg.text}
                      </div>
                    )}
                    {msg.type === 'result' && <AdminHistoryResult data={msg.data} />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.84rem' }}>
          Loading session data...
        </div>
      )}
    </div>
  );
}

function AdminHistoryResult({ data }) {
  if (!data?.found) {
    return (
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #d97706', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem', color: '#78350f', fontWeight: '600' }}>
        <AlertTriangle size={13} color="#d97706" style={{ marginRight: '6px', verticalAlign: 'middle' }} />
        No Match — Flagged for Human Review
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a' }}>
          {(data.standardA || 'Standard A').replace('.pdf', '').replace(/_/g, ' ')} vs {(data.standardB || 'Standard B').replace('.pdf', '').replace(/_/g, ' ')}
        </span>
        {(data.comparisons || []).map(c => {
          const os = OUTCOME_COLORS[c.outcome] || OUTCOME_COLORS['FLAG FOR REVIEW'];
          return (
            <span key={c.id} style={{ background: os.bg, color: os.color, padding: '2px 8px', borderRadius: '5px', fontSize: '0.68rem', fontWeight: '800' }}>
              {c.parameter}: {c.outcome}
            </span>
          );
        })}
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(data.comparisons || []).map(c => (
          <ExplainableDecisionBreakdown
            key={c.id}
            comp={c}
            standardA={data.standardA}
            standardB={data.standardB}
            data={data}
            compact={true}
          />
        ))}
      </div>
    </div>
  );
}
