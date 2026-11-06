import React, { useState } from 'react';
import { X, Flag, Check, AlertTriangle, Shield, UserCheck } from 'lucide-react';

export default function ReviewModal({ item, onClose, onSubmitReview }) {
  if (!item) return null;

  const [engineerName, setEngineerName] = useState('Praneeta R (Lead Safety Auditor)');
  const [action, setAction] = useState('SIGN_OFF_PER_GUIDANCE');
  const [overrideClass, setOverrideClass] = useState(item.classification);
  const [notes, setNotes] = useState(`Confirmed quantitative evaluation for ${item.parameter}. Recommended design rule adopted: ${item.recommendedDesignValue}. Verified against municipal safety codes.`);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitReview({
      comparisonId: item.id,
      parameter: item.parameter,
      originalClassification: item.classification,
      newClassification: overrideClass,
      engineerName,
      action,
      notes
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '650px',
        width: '100%',
        padding: '28px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', padding: '8px', borderRadius: '10px' }}>
              <UserCheck size={22} color="#7c3aed" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0f172a' }}>
                Human-in-the-Loop Review
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Engineer Verification & Exception Sign-Off
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Flagged Conflict Summary */}
        <div style={{
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' }}>{item.parameter}</span>
            <span className="badge badge-conflict">{item.outcome || item.classification}</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#475569', marginTop: '6px' }}>
            Engine Rule: {item.engineConclusion}
          </p>
          <p style={{ fontSize: '0.84rem', color: '#059669', marginTop: '6px', fontWeight: '700' }}>
            Target Recommendation: {item.recommendedDesignValue}
          </p>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', marginBottom: '6px', fontWeight: '700' }}>
              Reviewing Safety Engineer
            </label>
            <input
              type="text"
              value={engineerName}
              onChange={(e) => setEngineerName(e.target.value)}
              required
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', marginBottom: '6px', fontWeight: '700' }}>
                Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
              >
                <option value="SIGN_OFF_PER_GUIDANCE">Sign-Off (Complies per Guidance)</option>
                <option value="EXCEPTION_GRANTED">Municipal Variance Granted</option>
                <option value="OVERRIDE_CLASSIFICATION">Override Classification</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', marginBottom: '6px', fontWeight: '700' }}>
                Classification Status
              </label>
              <select
                value={overrideClass}
                onChange={(e) => setOverrideClass(e.target.value)}
                style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
              >
                <option value="Conflict">Conflict (Upheld)</option>
                <option value="Gap">Gap (Reclassified)</option>
                <option value="Consistent">Consistent (Harmonized)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#334155', marginBottom: '6px', fontWeight: '700' }}>
              Engineer Audit Notes / Justification
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' }}>
              <Check size={16} />
              Confirm & Save Review Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
