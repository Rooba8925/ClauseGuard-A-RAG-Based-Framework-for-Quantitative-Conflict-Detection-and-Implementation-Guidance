import React, { useState, useEffect } from 'react';
import { MessageCircle, Clock, FileText, Trash2, ChevronRight, AlertTriangle, CheckCircle2, Flag, Layers } from 'lucide-react';
import { api } from '../services/api';
import ExplainableDecisionBreakdown from './ExplainableDecisionBreakdown';

const OUTCOME_COLORS = {
  CONSISTENT:        { color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  CONFLICT:          { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  GAP:               { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  'FLAG FOR REVIEW': { color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe' },
};

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    '  ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function firstSentence(text = '') {
  const m = text.match(/^[^.!?]+[.!?]/);
  return m ? m[0].trim() : text.slice(0, 100) + (text.length > 100 ? '…' : '');
}

export default function ChatHistoryView({ currentUser }) {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (currentUser?.username) {
      api.getChatSessions(currentUser.username, currentUser.role)
        .then(res => setSessions(res.sessions || []))
        .catch(() => setSessions([]));
    }
  }, [currentUser]);

  const deleteSession = (id, e) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (selected?.id === id) setSelected(null);
  };

  const clearAll = () => {
    setSessions([]);
    setSelected(null);
  };

  if (sessions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '380px', gap: '12px', color: '#94a3b8' }}>
        <MessageCircle size={44} style={{ opacity: 0.3 }} />
        <p style={{ fontSize: '1rem', fontWeight: '700', color: '#64748b' }}>No chat history yet</p>
        <p style={{ fontSize: '0.84rem' }}>Queries made in the PDF Workspace will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>

      {/* ── Session List ─── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={16} color="#0284c7" />
            <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>Chat History</span>
            <span style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', padding: '1px 7px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800' }}>
              {sessions.length}
            </span>
          </div>
          <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: '#ef4444', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={12} /> Clear All
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setSelected(selected?.id === session.id ? null : session)}
              style={{
                padding: '14px 18px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                background: selected?.id === session.id ? '#f0f9ff' : '#fff',
                borderLeft: selected?.id === session.id ? '3px solid #0284c7' : '3px solid transparent',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { if (selected?.id !== session.id) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => { if (selected?.id !== session.id) e.currentTarget.style.background = '#fff'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.84rem', fontWeight: '800', color: '#0f172a', marginBottom: '5px', lineHeight: '1.3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#0284c7', background: '#f0f9ff', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                      {(session.standardA || '').replace('.pdf', '').replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>vs</span>
                    <span style={{ fontSize: '0.68rem', color: '#059669', background: '#f0fdf4', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                      {(session.standardB || '').replace('.pdf', '').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={10} color="#94a3b8" />
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{fmtDate(session.updatedAt)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <ChevronRight size={14} color={selected?.id === session.id ? '#0284c7' : '#cbd5e1'} />
                  <button onClick={e => deleteSession(session.id, e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', display: 'flex' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Session Detail ─── */}
      {selected && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{selected.title}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: '#0284c7', background: '#f0f9ff', padding: '2px 8px', borderRadius: '5px', fontWeight: '700' }}>
                A: {(selected.standardA || '').replace('.pdf', '').replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#059669', background: '#f0fdf4', padding: '2px 8px', borderRadius: '5px', fontWeight: '700' }}>
                B: {(selected.standardB || '').replace('.pdf', '').replace(/_/g, ' ')}
              </span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{fmtDate(selected.createdAt)}</span>
            </div>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(selected.messages || []).map((msg, i) => (
              <div key={i}>
                {msg.type === 'user' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff', borderRadius: '14px 14px 4px 14px', padding: '10px 16px', maxWidth: '70%', fontSize: '0.88rem', fontWeight: '600', lineHeight: '1.5' }}>
                      {msg.text}
                    </div>
                  </div>
                )}
                {msg.type === 'error' && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '0.82rem', color: '#b91c1c', fontWeight: '600' }}>
                    ⚠ {msg.text}
                  </div>
                )}
                {msg.type === 'result' && <HistoryResult data={msg.data} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Compact read-only result for history view
function HistoryResult({ data }) {
  if (!data?.found) {
    return (
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #d97706', borderRadius: '10px', padding: '12px 14px', fontSize: '0.8rem', color: '#78350f', fontWeight: '600' }}>
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
            <span key={c.id} style={{ background: os.bg, color: os.color, border: `1px solid ${os.border}`, padding: '2px 8px', borderRadius: '5px', fontSize: '0.68rem', fontWeight: '800' }}>
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
