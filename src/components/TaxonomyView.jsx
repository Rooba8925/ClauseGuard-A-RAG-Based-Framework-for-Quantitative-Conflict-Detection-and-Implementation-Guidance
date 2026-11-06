import React from 'react';
import { Layers, ArrowLeft, CheckCircle, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export default function TaxonomyView({ onBack }) {
  const taxonomyData = [
    {
      outcome: 'CONSISTENT',
      badgeColor: '#047857',
      badgeBg: '#ecfdf5',
      badgeBorder: '#a7f3d0',
      actionColor: '#047857',
      when: 'Both have applicable requirements and they can coexist',
      action: 'Derive common constraint',
      example: 'Standard A: X ≤ 10 mm | Standard B: X ≤ 8 mm → Both satisfied simultaneously by X ≤ 8 mm.'
    },
    {
      outcome: 'CONFLICT',
      badgeColor: '#b91c1c',
      badgeBg: '#fef2f2',
      badgeBorder: '#fecaca',
      actionColor: '#b91c1c',
      when: 'Both have applicable requirements but cannot coexist',
      action: 'Flag conflict for engineer review',
      example: 'Standard A: X ≤ 10 mm | Standard B: X ≥ 15 mm → No common permissible value exists. Engineer review required.'
    },
    {
      outcome: 'GAP',
      badgeColor: '#b45309',
      badgeBg: '#fffbeb',
      badgeBorder: '#fde68a',
      actionColor: '#b45309',
      when: 'Requirement exists in one standard but corresponding applicable requirement is not found in the other',
      action: 'Identify missing requirement for verification',
      example: 'Standard A: X ≤ 10 mm (Indoor) | Standard B: No requirement found under Indoor condition → Identify missing requirement.'
    },
    {
      outcome: 'FLAG FOR REVIEW',
      badgeColor: '#6d28d9',
      badgeBg: '#f5f3ff',
      badgeBorder: '#ddd6fe',
      actionColor: '#6d28d9',
      when: 'Information/conditions are ambiguous, so the engine cannot reliably classify it',
      action: 'Human verification',
      example: 'Used only when system cannot confidently determine category: e.g. qualitative "appropriate clearance" or [condition unclear].'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Navigation Bar with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '10px',
            fontSize: '0.84rem',
            fontWeight: '700',
            color: '#0369a1',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={16} />
          Back to Pipeline & PDF Workspace
        </button>

        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
          ClauseGuard Deterministic Rule Framework
        </span>
      </div>

      {/* Main Decision Taxonomy Card */}
      <div className="glass-panel" style={{
        padding: '28px 32px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#f0f9ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #bae6fd'
            }}>
              <Layers size={20} color="#0284c7" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>
                ClauseGuard 4-Tier Decision Taxonomy
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>
                Strict deterministic engineering classification rules & action guidelines
              </p>
            </div>
          </div>
        </div>

        {/* Structured Decision Table */}
        <div style={{ overflowX: 'auto', marginBottom: '28px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 16px', width: '22%' }}>Outcome</th>
                <th style={{ padding: '12px 16px', width: '48%' }}>When?</th>
                <th style={{ padding: '12px 16px', width: '30%' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {taxonomyData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.86rem' }}>
                  <td style={{ padding: '16px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: '800',
                      fontSize: '0.78rem',
                      color: row.badgeColor,
                      background: row.badgeBg,
                      border: `1px solid ${row.badgeBorder}`
                    }}>
                      {row.outcome}
                    </span>
                  </td>
                  <td style={{ padding: '16px 16px', color: '#1e293b', fontWeight: '500', lineHeight: '1.45' }}>
                    {row.when}
                  </td>
                  <td style={{ padding: '16px 16px', color: row.actionColor, fontWeight: '700' }}>
                    {row.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


      </div>
    </div>
  );
}
