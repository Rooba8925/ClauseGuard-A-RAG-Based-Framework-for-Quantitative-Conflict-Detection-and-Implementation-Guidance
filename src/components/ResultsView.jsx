import React from 'react';
import { ArrowLeft, Cpu, BookOpen, Flag, Layers, CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export default function ResultsView({
  comparisonData,
  onBack,
  onOpenReview,
  onOpenPdf,
  clauseAText = '',
  clauseBText = ''
}) {
  if (!comparisonData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <button
          onClick={onBack}
          style={{
            alignSelf: 'flex-start',
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
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <ArrowLeft size={16} />
          Back to Clauses Workspace
        </button>
        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', background: '#ffffff', borderRadius: '16px' }}>
          <p style={{ color: '#64748b', fontSize: '0.92rem' }}>
            No comparison results available yet. Please select clauses and click "Execute Rule-Based Comparison".
          </p>
        </div>
      </div>
    );
  }

  // Filter out secondary min condition if max constraint is consistent
  const rawComparisons = comparisonData.comparisons || [];
  const hasConsistentMax = rawComparisons.some(c =>
    (c.outcome === 'CONSISTENT' || c.classification === 'Consistent') &&
    (c.parameter?.toLowerCase().includes('max') || c.parameter?.toLowerCase().includes('riser'))
  );

  const displayedComparisons = hasConsistentMax
    ? rawComparisons.filter(c => !c.parameter?.toLowerCase().includes('min riser'))
    : rawComparisons;

  const summary = comparisonData.summary || {
    consistent: displayedComparisons.filter(c => c.classification === 'Consistent' || c.outcome === 'CONSISTENT').length,
    conflicts: displayedComparisons.filter(c => c.classification === 'Conflict' || c.outcome === 'CONFLICT').length,
    gaps: displayedComparisons.filter(c => c.classification === 'Gap' || c.outcome === 'GAP').length,
    flaggedForReview: displayedComparisons.filter(c => c.classification === 'Flag for Review' || c.outcome === 'FLAG FOR REVIEW' || c.flagForReview).length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header with Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '8px 18px',
            borderRadius: '10px',
            fontSize: '0.86rem',
            fontWeight: '700',
            color: '#0369a1',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease'
          }}
        >
          <ArrowLeft size={16} />
          Back to Clauses Workspace
        </button>

        <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: '600' }}>
          Comparing: <strong style={{ color: '#0f172a' }}>{comparisonData.standardA}</strong> vs <strong style={{ color: '#0f172a' }}>{comparisonData.standardB}</strong>
        </span>
      </div>

      {/* STAGE 1: spaCy NER Parameter Inspection */}
      <div className="glass-panel" style={{ padding: '24px 28px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: '#f0f9ff', padding: '6px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
            <Cpu size={20} color="#0284c7" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
            Stage 1: spaCy Custom NER Parameter Extraction
          </h3>
          <span className="badge" style={{ background: '#f8fafc', color: '#0369a1', border: '1px solid #cbd5e1' }}>
            {'{ PARAMETER, VALUE, UNIT, CONDITION }'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Standard A Parameters */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0369a1', marginBottom: '10px' }}>
              {comparisonData.standardA} Extracted Entities:
            </p>
            {comparisonData.extractedA?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {comparisonData.extractedA.map((ent, i) => (
                  <div key={i} style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                    <span style={{ color: '#0284c7', fontWeight: '800' }}>PARAM:</span> {ent.parameter} |{' '}
                    <span style={{ color: '#d97706', fontWeight: '800' }}>VAL:</span> {ent.valueDisplay || ent.value || 'Vague/Omitted'} {ent.unit} |{' '}
                    <span style={{ color: '#059669', fontWeight: '800' }}>COND:</span> {ent.condition}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                No numeric parameter specified in this standard excerpt (Regulatory Gap)
              </p>
            )}
          </div>

          {/* Standard B Parameters */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0369a1', marginBottom: '10px' }}>
              {comparisonData.standardB} Extracted Entities:
            </p>
            {comparisonData.extractedB?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {comparisonData.extractedB.map((ent, i) => (
                  <div key={i} style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}>
                    <span style={{ color: '#0284c7', fontWeight: '800' }}>PARAM:</span> {ent.parameter} |{' '}
                    <span style={{ color: '#d97706', fontWeight: '800' }}>VAL:</span> {ent.valueDisplay || ent.value || 'Vague/Omitted'} {ent.unit} |{' '}
                    <span style={{ color: '#059669', fontWeight: '800' }}>COND:</span> {ent.condition}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                No numeric parameter specified in this standard excerpt
              </p>
            )}
          </div>
        </div>
      </div>

      {/* STAGE 2 & 3: RULE-BASED COMPARISON RESULTS & GUIDANCE WITH PDF CITATIONS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>
            Stage 2 & 3: Rule-Based Evaluation & Implementation Guidance
          </h3>
          <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: '600' }}>
            {summary.consistent ?? 0} Consistent • {summary.conflicts ?? 0} Conflicts • {summary.gaps ?? 0} Gaps • {summary.flaggedForReview ?? 0} Flagged for Review
          </span>
        </div>

        {displayedComparisons.map((item) => {
          const outcome = item.outcome || (item.classification === 'Flag for Review' ? 'FLAG FOR REVIEW' : item.classification.toUpperCase());
          const isConflict = outcome === 'CONFLICT';
          const isGap = outcome === 'GAP';
          const isFlagged = outcome === 'FLAG FOR REVIEW' || item.flagForReview;
          const isConsistent = outcome === 'CONSISTENT';

          const badgeColor = isConflict ? '#dc2626'
            : isGap ? '#d97706'
            : isFlagged ? '#0284c7'
            : '#059669';

          const badgeBg = isConflict ? '#fef2f2'
            : isGap ? '#fffbeb'
            : isFlagged ? '#f0f9ff'
            : '#ecfdf5';

          const borderLeftColor = badgeColor;

          const actionText = item.action || (
            isConflict ? 'Flag conflict for engineer review'
            : isGap ? 'Identify missing requirement for verification'
            : isFlagged ? 'Human verification'
            : 'Derive common constraint'
          );

          const citA = item.citations?.[comparisonData.standardA]?.citation || `${comparisonData.standardA} Specification`;
          const citB = item.citations?.[comparisonData.standardB]?.citation || `${comparisonData.standardB} Specification`;
          const snipA = item.citations?.[comparisonData.standardA]?.snippet || item.comparisonDetails?.[comparisonData.standardA]?.snippet || clauseAText;
          const snipB = item.citations?.[comparisonData.standardB]?.snippet || item.comparisonDetails?.[comparisonData.standardB]?.snippet || clauseBText;

          return (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                padding: '28px',
                borderRadius: '16px',
                background: '#ffffff',
                borderLeft: `6px solid ${borderLeftColor}`,
                border: '1px solid #e2e8f0',
                borderLeftWidth: '6px'
              }}
            >
              {/* Top Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    {item.parameter}
                  </span>

                  {/* Outcome Badge */}
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '0.78rem',
                    color: badgeColor,
                    background: badgeBg,
                    border: `1px solid ${badgeColor}40`,
                    letterSpacing: '0.04em'
                  }}>
                    {outcome}
                  </span>

                  {/* Action Badge */}
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '0.74rem',
                    color: '#1e293b',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1'
                  }}>
                    <span style={{ color: badgeColor, fontWeight: '800' }}>Action:</span> {actionText}
                  </span>

                  {item.flagForReview && (
                    <span className="badge badge-review" style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd' }}>
                      <Flag size={12} />
                      {isConflict ? 'ENGINEER REVIEW REQUIRED' : 'HUMAN VERIFICATION REQUIRED'}
                    </span>
                  )}
                </div>

                {item.flagForReview && (
                  <button
                    className="btn-review"
                    onClick={() => onOpenReview(item)}
                  >
                    <Flag size={14} />
                    Engineer Sign-off / Override
                  </button>
                )}
              </div>

              {/* COMBINED CONSTRAINT / DECISION BANNER */}
              <div style={{
                background: isConflict
                  ? '#fef2f2'
                  : isGap
                  ? '#fffbeb'
                  : isFlagged
                  ? '#f0f9ff'
                  : '#ecfdf5',
                border: isConflict
                  ? '1px solid #fecaca'
                  : isGap
                  ? '1px solid #fde68a'
                  : isFlagged
                  ? '1px solid #bae6fd'
                  : '1px solid #a7f3d0',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <span style={{
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    color: badgeColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {isConflict ? 'INFEASIBLE BOUNDS CONFLICT'
                      : isGap ? 'MISSING REQUIREMENT STATUS'
                      : isFlagged ? 'AMBIGUOUS CONDITION REQUIRING HUMAN REVIEW'
                      : 'DERIVED COMMON CONSTRAINT (COMBINED COMPLIANCE)'}
                  </span>
                  <p style={{
                    fontSize: '1.15rem',
                    fontWeight: '800',
                    color: isConflict ? '#b91c1c' : isGap ? '#b45309' : isFlagged ? '#0369a1' : '#047857',
                    marginTop: '2px'
                  }}>
                    {item.combinedConstraint || item.commonPermissibleSolution || (isConflict ? 'No common permissible value exists' : 'N/A')}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#64748b' }}>
                  <span>{item.when}</span>
                </div>
              </div>

              {/* CITATIONS & SPECIFICATION DETAILS (Split into Standard A and Standard B) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                marginBottom: '20px',
                background: '#f8fafc',
                padding: '18px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                {/* Standard A Citation Box */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>
                      <BookOpen size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {comparisonData.standardA} Source Citation:
                    </span>
                    {onOpenPdf && (
                      <button
                        type="button"
                        onClick={() => onOpenPdf(citA, snipA, comparisonData.standardA)}
                        className="citation-btn"
                        title={`View citation in ${comparisonData.standardA} PDF`}
                      >
                        <BookOpen size={12} />
                        View PDF
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                    {citA}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', marginBottom: '8px', borderLeft: '2px solid #0284c7', paddingLeft: '8px' }}>
                    "{snipA}"
                  </p>
                  <p style={{ fontSize: '0.76rem', color: '#334155' }}>
                    <strong>Extracted Constraint:</strong>{' '}
                    {item.comparisonDetails?.[comparisonData.standardA]?.value !== undefined
                      ? `${item.comparisonDetails[comparisonData.standardA].condition || ''} ${item.comparisonDetails[comparisonData.standardA].value} ${item.comparisonDetails[comparisonData.standardA].unit || ''}`
                      : 'Not specified (Omitted)'}
                  </p>
                </div>

                {/* Standard B Citation Box */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#0369a1', textTransform: 'uppercase' }}>
                      <BookOpen size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {comparisonData.standardB} Source Citation:
                    </span>
                    {onOpenPdf && (
                      <button
                        type="button"
                        onClick={() => onOpenPdf(citB, snipB, comparisonData.standardB)}
                        className="citation-btn"
                        title={`View citation in ${comparisonData.standardB} PDF`}
                      >
                        <BookOpen size={12} />
                        View PDF
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.82rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                    {citB}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: '#475569', fontStyle: 'italic', marginBottom: '8px', borderLeft: '2px solid #0284c7', paddingLeft: '8px' }}>
                    "{snipB}"
                  </p>
                  <p style={{ fontSize: '0.76rem', color: '#334155' }}>
                    <strong>Extracted Constraint:</strong>{' '}
                    {item.comparisonDetails?.[comparisonData.standardB]?.value !== undefined
                      ? `${item.comparisonDetails[comparisonData.standardB].condition || ''} ${item.comparisonDetails[comparisonData.standardB].value} ${item.comparisonDetails[comparisonData.standardB].unit || ''}`
                      : 'Not specified (Omitted)'}
                  </p>
                </div>
              </div>

              {/* RULE ENGINE DETERMINATION */}
              <div style={{ marginBottom: '14px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <Layers size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Rule Engine Conclusion: <code style={{ fontSize: '0.74rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{item.ruleSummary || item.rulesTriggered?.[0]}</code>
                </span>
                <p style={{ fontSize: '0.86rem', color: '#1e293b', marginTop: '4px', lineHeight: '1.5' }}>
                  {item.engineConclusion || item.explanation}
                </p>
              </div>

              {/* GEMINI GUIDANCE & ENGINEER SIGN-OFF RECORD */}
              {item.implementationGuidance && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase' }}>
                      <Cpu size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      Engineering Implementation Guidance
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {item.guidanceSource === 'Gemini-1.5-Pro' ? 'Generated by Gemini-1.5-Pro' : 'ClauseGuard Engineered Knowledge Base'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: '1.5' }}>
                    {item.implementationGuidance}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
