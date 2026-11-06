import React from 'react';
import { AlertTriangle, CheckCircle2, Flag, Layers, CheckCheck } from 'lucide-react';

export default function MetricCards({ metrics, totalClauses }) {
  const cards = [
    {
      title: 'Benchmark Accuracy',
      value: metrics?.accuracy || '100.0%',
      subtitle: `Precision: ${metrics?.precision || '1.00'} • Recall: ${metrics?.recall || '1.00'}`,
      icon: CheckCircle2,
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0'
    },
    {
      title: 'Consistent',
      value: metrics?.consistentCount ?? 3,
      subtitle: 'Derive common constraint',
      icon: CheckCheck,
      color: '#047857',
      bg: '#ecfdf5',
      border: '#a7f3d0'
    },
    {
      title: 'Conflicts',
      value: metrics?.conflictCount ?? 1,
      subtitle: 'Flag for engineer review',
      icon: AlertTriangle,
      color: '#dc2626',
      bg: '#fef2f2',
      border: '#fecaca'
    },
    {
      title: 'Regulatory Gaps',
      value: metrics?.gapCount ?? 3,
      subtitle: 'Identify missing requirement',
      icon: Layers,
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a'
    },
    {
      title: 'Flag for Review',
      value: metrics?.flaggedForReviewCount ?? 2,
      subtitle: 'Human verification required',
      icon: Flag,
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#ddd6fe'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
      gap: '16px',
      marginBottom: '28px'
    }}>
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="glass-panel"
            style={{
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              borderRadius: '16px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.74rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {card.title}
                </p>
                <p style={{ fontSize: '1.85rem', fontWeight: '900', color: card.color, marginTop: '4px', letterSpacing: '-0.02em' }}>
                  {card.value}
                </p>
              </div>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: card.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${card.border}`
              }}>
                <Icon size={20} color={card.color} />
              </div>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#475569', fontWeight: '600', marginTop: '14px' }}>
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
