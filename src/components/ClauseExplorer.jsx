import React, { useState } from 'react';
import { Search, BookOpen, Tag, Check, Filter } from 'lucide-react';

export default function ClauseExplorer({ clauses }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStandard, setFilterStandard] = useState('ALL');

  const filtered = (clauses || []).filter(c => {
    const matchesSearch = c.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.clauseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStandard = filterStandard === 'ALL' || c.standard === filterStandard;
    return matchesSearch && matchesStandard;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search engineering standard clauses, parameters, or clause numbers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
          <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-dim)" />
          {['ALL', 'OSHA', 'IBC'].map(std => (
            <button
              key={std}
              onClick={() => setFilterStandard(std)}
              style={{
                background: filterStandard === std ? '#eff6ff' : '#f8fafc',
                color: filterStandard === std ? '#1d4ed8' : 'var(--text-muted)',
                border: filterStandard === std ? '1px solid #93c5fd' : '1px solid var(--border-subtle)',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {std}
            </button>
          ))}
        </div>
      </div>

      {/* Clauses Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {filtered.map(c => (
          <div key={c.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{
                  background: c.standard === 'OSHA' ? '#eff6ff' : '#faf5ff',
                  color: c.standard === 'OSHA' ? '#1d4ed8' : '#7e22ce',
                  border: `1px solid ${c.standard === 'OSHA' ? '#bfdbfe' : '#e9d5ff'}`,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: '700'
                }}>
                  {c.standard} • {c.clauseNo}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {c.scope}
                </span>
              </div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                {c.title}
              </h4>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                "{c.text}"
              </p>
            </div>
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Tag size={13} color="var(--text-dim)" />
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                spaCy NER Ingested & Verified
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
