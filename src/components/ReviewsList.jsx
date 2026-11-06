import React from 'react';
import { FileCheck, Clock, User } from 'lucide-react';

export default function ReviewsList({ reviews }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-panel" style={{ padding: '24px 30px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileCheck size={24} color="#7c3aed" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-main)' }}>
            Engineer Sign-off & Audit Log
          </h2>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Immutable audit trail of safety engineer determinations, conflict sign-offs, and compliance overrides with citations.
        </p>
      </div>

      {(!reviews || reviews.length === 0) ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            No engineer sign-offs logged yet. Flagged conflicts or vague clauses can be signed off directly from the Pipeline Workspace.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map((rev) => (
            <div key={rev.id} className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #7c3aed', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                    {rev.parameter}
                  </span>
                  <span className="badge badge-review">
                    {rev.action}
                  </span>
                  <span className="badge badge-conflict">
                    Original: {rev.originalClassification}
                  </span>
                  {rev.newClassification && rev.newClassification !== rev.originalClassification && (
                    <span className="badge badge-consistent">
                      Final: {rev.newClassification}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={14} />
                    {rev.engineerName}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} />
                    {new Date(rev.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                "{rev.notes}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
