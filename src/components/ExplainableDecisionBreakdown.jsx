import React from 'react';
import { Layers, Flag, AlertTriangle, ArrowRight } from 'lucide-react';

export const OUTCOME_THEMES = {
  CONSISTENT: {
    color: '#047857',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    left: '#10b981',
    label: 'CONSISTENT'
  },
  CONFLICT: {
    color: '#b91c1c',
    bg: '#fef2f2',
    border: '#fecaca',
    left: '#ef4444',
    label: 'CONFLICT'
  },
  GAP: {
    color: '#b45309',
    bg: '#fffbeb',
    border: '#fde68a',
    left: '#f59e0b',
    label: 'GAP'
  },
  'FLAG FOR REVIEW': {
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    left: '#8b5cf6',
    label: 'FLAG FOR REVIEW'
  }
};

export function cleanConstraintText(str = '') {
  if (!str) return '';
  return String(str)
    .replace(/%/g, '≥')
    .replace(/% /g, '≤')
    .replace(/%/g, '≤')
    .replace(/<=/g, '≤')
    .replace(/>=/g, '≥');
}

export function cleanStandardName(name = '') {
  if (!name) return '';
  return name.replace(/\.pdf$/i, '').replace(/_/g, ' ').trim();
}

function formatConstraintValue(condition = '', value, unit = '') {
  if (value === undefined || value === null || value === 'Not specified') {
    return 'Not specified';
  }
  const cleanVal = typeof value === 'number' ? value : String(value).trim();
  const cleanUnit = unit && unit !== 'N/A' && unit !== 'None' ? ` ${unit}` : '';
  const cond = String(condition || '').toLowerCase();

  // If already formatted like "X ≤ 10 mm" or "X >= 8 in"
  if (/^X\s*[≤≥=<>]/i.test(cleanVal)) {
    return cleanConstraintText(cleanVal);
  }

  if (cond.includes('max') || cond.includes('not exceed') || cond.includes('ceiling') || cond.includes('≤') || cond.includes('<=')) {
    return `X ≤ ${cleanVal}${cleanUnit}`;
  }
  if (cond.includes('min') || cond.includes('not less') || cond.includes('floor') || cond.includes('≥') || cond.includes('>=')) {
    return `X ≥ ${cleanVal}${cleanUnit}`;
  }
  if (cond.includes('variation') || cond.includes('uniformity') || cond.includes('tolerance')) {
    return `Variation ≤ ${cleanVal}${cleanUnit}`;
  }
  if (cond.includes('range') || String(cleanVal).includes('–') || String(cleanVal).includes('to')) {
    return `${cleanVal}${cleanUnit}`;
  }
  if (cond.includes('vague') || cond.includes('qualitative') || cond.includes('appropriate')) {
    return `${cleanVal}${cleanUnit} (${cond})`;
  }

  return `X = ${cleanVal}${cleanUnit}`;
}

export function getStandardConstraint(comp, slot, standardName, data) {
  // 1. Try comparisonDetails
  if (comp?.comparisonDetails) {
    const keys = Object.keys(comp.comparisonDetails);
    let detail = null;

    if (standardName && comp.comparisonDetails[standardName]) {
      detail = comp.comparisonDetails[standardName];
    } else if (standardName && comp.comparisonDetails[standardName.replace('.pdf', '')]) {
      detail = comp.comparisonDetails[standardName.replace('.pdf', '')];
    } else if (slot === 'A' && keys.length > 0) {
      detail = comp.comparisonDetails[keys[0]];
    } else if (slot === 'B' && keys.length > 1) {
      detail = comp.comparisonDetails[keys[1]];
    }

    if (detail) {
      if (detail.value === 'Not specified' || detail.condition?.includes('Absent')) {
        return 'Not specified (No requirement found)';
      }
      if (detail.value !== undefined && detail.value !== null) {
        return formatConstraintValue(detail.condition, detail.value, detail.unit);
      }
    }
  }

  // 2. Try extractedA / extractedB
  const extractedList = slot === 'A'
    ? (comp?.extractedA ? [comp.extractedA] : data?.extractedA)
    : (comp?.extractedB ? [comp.extractedB] : data?.extractedB);

  if (Array.isArray(extractedList) && extractedList.length > 0) {
    const matched = extractedList.find(e =>
      e?.parameter && comp?.parameter &&
      e.parameter.toLowerCase().trim() === comp.parameter.toLowerCase().trim()
    ) || (extractedList.length === 1 ? extractedList[0] : null);

    if (matched && matched.value !== undefined && matched.value !== null) {
      return formatConstraintValue(matched.boundType || matched.condition, matched.value, matched.unit);
    }
  }

  // 3. Fallback from engineConclusion or explanation
  const textSource = comp?.engineConclusion || comp?.explanation || '';
  if (textSource) {
    const stdClean = cleanStandardName(standardName);
    const pattern = new RegExp(`(?:${slot === 'A' ? 'Standard A' : 'Standard B'}|${stdClean})[^:]*:\\s*(X\\s*[≤≥=<>]=?\\s*[^,\\)]+)`, 'i');
    const m = textSource.match(pattern);
    if (m) {
      return cleanConstraintText(m[1].trim());
    }
  }

  return 'Not specified';
}

export function getCommonConstraint(comp) {
  if (comp?.combinedConstraint) {
    return cleanConstraintText(comp.combinedConstraint);
  }
  if (comp?.commonPermissibleSolution) {
    return cleanConstraintText(comp.commonPermissibleSolution);
  }
  if (comp?.outcome === 'CONFLICT') {
    return 'None (No common permissible value exists)';
  }
  if (comp?.outcome === 'GAP') {
    return 'Verify/Adopt Missing Requirement';
  }
  return 'N/A';
}

/**
 * Reusable Explainable Decision Breakdown Component
 * Follows exact pattern:
 * - Standard A: X ≤ 10 mm
 * - Standard B: X ≤ 8 mm
 * - Common constraint: X ≤ 8 mm
 * - Decision: CONSISTENT
 * Under that: Guidance
 */
export default function ExplainableDecisionBreakdown({
  comp,
  standardA = 'Standard A',
  standardB = 'Standard B',
  data = null,
  compact = false
}) {
  if (!comp) return null;

  const outcome = comp.outcome || comp.classification || 'CONSISTENT';
  const theme = OUTCOME_THEMES[outcome] || OUTCOME_THEMES['FLAG FOR REVIEW'];

  const nameA = cleanStandardName(standardA) || 'Standard A';
  const nameB = cleanStandardName(standardB) || 'Standard B';

  const constraintA = getStandardConstraint(comp, 'A', standardA, data);
  const constraintB = getStandardConstraint(comp, 'B', standardB, data);
  const commonConstraint = getCommonConstraint(comp);

  const guidance = cleanConstraintText(comp.implementationGuidance || comp.explanation || '');

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${theme.border}`,
      borderLeft: `5px solid ${theme.left}`,
      borderRadius: '12px',
      padding: compact ? '12px 14px' : '14px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Parameter + Decision Tag */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        borderBottom: `1px solid ${theme.bg}`,
        paddingBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={14} color={theme.color} />
          <span style={{ fontSize: compact ? '0.82rem' : '0.88rem', fontWeight: '800', color: '#0f172a' }}>
            {comp.parameter}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            background: theme.bg,
            color: theme.color,
            border: `1px solid ${theme.border}`,
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: '800',
            letterSpacing: '0.02em'
          }}>
            {outcome}
          </span>
          {comp.flagForReview && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: '#f5f3ff',
              color: '#6d28d9',
              border: '1px solid #ddd6fe',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.68rem',
              fontWeight: '800'
            }}>
              <Flag size={10} /> Flag for Review
            </span>
          )}
        </div>
      </div>

      {/* Decision Breakdown Box */}
      <div style={{
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: compact ? '10px 12px' : '12px 14px'
      }}>
        <p style={{
          fontSize: '0.68rem',
          fontWeight: '800',
          color: theme.color,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '8px'
        }}>
          Explainable Decision Breakdown
        </p>

        <ul style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          fontSize: compact ? '0.8rem' : '0.85rem'
        }}>
          {/* Standard A */}
          <li style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', color: '#475569', minWidth: '150px' }}>
              • Standard A ({nameA}):
            </span>
            <span style={{ fontWeight: '800', color: '#0f172a', fontFamily: 'monospace, sans-serif' }}>
              {constraintA}
            </span>
          </li>

          {/* Standard B */}
          <li style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', color: '#475569', minWidth: '150px' }}>
              • Standard B ({nameB}):
            </span>
            <span style={{ fontWeight: '800', color: '#0f172a', fontFamily: 'monospace, sans-serif' }}>
              {constraintB}
            </span>
          </li>

          {/* Common Constraint */}
          <li style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', color: '#475569', minWidth: '150px' }}>
              • Common constraint:
            </span>
            <span style={{
              fontWeight: '900',
              color: theme.color,
              fontFamily: 'monospace, sans-serif',
              fontSize: compact ? '0.85rem' : '0.92rem'
            }}>
              {commonConstraint}
            </span>
          </li>

          {/* Decision */}
          <li style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', color: '#475569', minWidth: '150px' }}>
              • Decision:
            </span>
            <span style={{
              fontWeight: '900',
              color: theme.color,
              letterSpacing: '0.03em'
            }}>
              {outcome}
            </span>
          </li>
        </ul>
      </div>

      {/* Guidance Row */}
      {guidance && (
        <div style={{
          borderTop: `1px solid ${theme.border}`,
          paddingTop: '8px',
          fontSize: compact ? '0.78rem' : '0.82rem',
          lineHeight: '1.5',
          color: '#334155'
        }}>
          <span style={{ fontWeight: '800', color: theme.color }}>Guidance: </span>
          <span>{guidance}</span>
        </div>
      )}
    </div>
  );
}

