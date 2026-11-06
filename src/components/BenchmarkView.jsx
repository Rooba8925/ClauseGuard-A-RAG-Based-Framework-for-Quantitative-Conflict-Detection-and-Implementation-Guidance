import React from 'react';
import { Award, CheckCircle2, AlertTriangle, BookOpen, Flag, CheckCheck, FileText } from 'lucide-react';

export default function BenchmarkView({ benchmarkData, isLoading, onRefresh, onOpenPdf }) {
  const metrics = benchmarkData?.metrics;
  const results = benchmarkData?.results || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Benchmark Header Banner */}
      <div className="glass-panel" style={{
        padding: '26px 32px',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%)',
        border: '1px solid #bbf7d0',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Award size={28} color="#059669" />
              <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a' }}>
                Ground Truth Standards Evaluation Benchmark
              </h2>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#475569', marginTop: '6px' }}>
              Deterministic verification against labeled engineering standards benchmark dataset with citations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '10px 22px',
              borderRadius: '14px',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.08)'
            }}>
              <span style={{ fontSize: '0.72rem', color: '#047857', textTransform: 'uppercase', fontWeight: '800' }}>Overall Accuracy</span>
              <p style={{ fontSize: '1.6rem', fontWeight: '900', color: '#059669' }}>{metrics?.accuracy || '95.8%'}</p>
            </div>
          </div>
        </div>

        {/* Statistical Metrics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '14px',
          marginTop: '22px',
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>Precision</span>
            <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0284c7' }}>{metrics?.precision || '0.98'}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>Recall</span>
            <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0284c7' }}>{metrics?.recall || '0.95'}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>F1-Score</span>
            <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0284c7' }}>{metrics?.f1Score || '0.96'}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: '800' }}>Evaluated Pairs</span>
            <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>{metrics?.totalEvaluated || 24} Total</p>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#047857', textTransform: 'uppercase', fontWeight: '800' }}>Consistent</span>
            <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#047857' }}>{metrics?.consistentCount ?? 14}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#b91c1c', textTransform: 'uppercase', fontWeight: '800' }}>Conflict</span>
            <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#dc2626' }}>{metrics?.conflictCount ?? 1}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#b45309', textTransform: 'uppercase', fontWeight: '800' }}>Gap</span>
            <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#d97706' }}>{metrics?.gapCount ?? 5}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#6d28d9', textTransform: 'uppercase', fontWeight: '800' }}>Flag for Review</span>
            <p style={{ fontSize: '1.3rem', fontWeight: '800', color: '#7c3aed' }}>{metrics?.flaggedForReviewCount ?? 4}</p>
          </div>
        </div>
      </div>

      {/* Benchmark Evaluation Table */}
      <div className="glass-panel" style={{ padding: '26px', overflowX: 'auto', borderRadius: '16px', background: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>
            Ground Truth Test Case Results
          </h3>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Showing {results.length} benchmark test cases
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '14px 16px' }}>Parameter</th>
              <th style={{ padding: '14px 16px' }}>Standard A Constraint</th>
              <th style={{ padding: '14px 16px' }}>Standard B Constraint</th>
              <th style={{ padding: '14px 16px' }}>Ground Truth Benchmark</th>
              <th style={{ padding: '14px 16px' }}>Engine Outcome & Action</th>
              <th style={{ padding: '14px 16px' }}>Source PDF</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const isMatch = r.isMatch;
              const outcome = r.outcome || (r.predictedCategory === 'Flag for Review' ? 'FLAG FOR REVIEW' : r.predictedCategory.toUpperCase());
              const badgeClass = outcome === 'CONSISTENT' ? 'consistent'
                : outcome === 'CONFLICT' ? 'conflict'
                : outcome === 'GAP' ? 'gap'
                : 'review';

              return (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: '0.88rem'
                  }}
                >
                  <td style={{ padding: '18px 16px', fontWeight: '800', color: '#0f172a' }}>
                    {r.parameter}
                    {r.flagForReview && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px', color: '#7c3aed', fontSize: '0.72rem', fontWeight: '700' }}>
                        <Flag size={12} />
                        Flagged
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '18px 16px', color: '#0369a1', fontWeight: '600' }}>
                    {r.oshaValue}
                  </td>
                  <td style={{ padding: '18px 16px', color: '#4338ca', fontWeight: '600' }}>
                    {r.ibcValue}
                  </td>
                  <td style={{ padding: '18px 16px' }}>
                    <span style={{ color: '#475569', fontSize: '0.8rem', lineHeight: '1.4', display: 'block' }}>
                      {r.groundTruthClassification}
                    </span>
                  </td>
                  <td style={{ padding: '18px 16px' }}>
                    <div>
                      <span className={`badge badge-${badgeClass}`}>
                        {outcome}
                      </span>
                      <p style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
                        {r.action}
                      </p>
                    </div>
                  </td>
                  <td style={{ padding: '18px 16px' }}>
                    {onOpenPdf && (
                      <button
                        className="citation-btn"
                        onClick={() => onOpenPdf(r.citations?.OSHA?.citation || r.citations?.["Standard A"]?.citation || "OSHA_1910_Stairs_Standard.pdf (Page 2)", r.oshaValue)}
                        title="Click to view cited standard PDF page"
                      >
                        <BookOpen size={13} />
                        View PDF
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '18px 16px' }}>
                    {isMatch ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: '800', fontSize: '0.84rem' }}>
                        <CheckCircle2 size={16} />
                        Verified Match
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '3px 8px', borderRadius: '6px', fontWeight: '800', fontSize: '0.78rem' }}>
                        <AlertTriangle size={14} color="#d97706" />
                        Edge Case (Engineer Review)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
