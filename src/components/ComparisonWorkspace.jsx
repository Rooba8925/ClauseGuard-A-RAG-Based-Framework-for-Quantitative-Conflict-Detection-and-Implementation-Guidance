import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, BookOpen, MessageCircle, Send, AlertTriangle, CheckCircle2, Cpu, Layers, Trash2, Flag, Shield, Sliders, Check, HelpCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';
import ExplainableDecisionBreakdown from './ExplainableDecisionBreakdown';

const OUTCOME_COLORS = {
  CONSISTENT:     { color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', left: '#059669' },
  CONFLICT:       { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', left: '#dc2626' },
  GAP:            { color: '#b45309', bg: '#fffbeb', border: '#fde68a', left: '#d97706' },
  'FLAG FOR REVIEW': { color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', left: '#7c3aed' },
};

function outcomeStyle(outcome = '') {
  return OUTCOME_COLORS[outcome] || OUTCOME_COLORS['FLAG FOR REVIEW'];
}

function getValidationBadgeStyle(status = '') {
  switch (status) {
    case 'Verified Match':
    case 'Verified Match (Manual)':
      return { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', icon: '✓', title: 'Verified Match' };
    case 'Version Mismatch':
      return { bg: '#fffbeb', color: '#b45309', border: '#fde68a', icon: '⚠', title: 'Version Mismatch' };
    case 'Standard Mismatch':
      return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', icon: '⚠', title: 'Standard Mismatch' };
    case 'Unsupported Standard':
      return { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', icon: '✕', title: 'Unsupported Standard' };
    case 'Unable to Verify':
    default:
      return { bg: '#f8fafc', color: '#475569', border: '#cbd5e1', icon: '?', title: 'Unable to Verify' };
  }
}

export default function ComparisonWorkspace({ isLoading: globalLoading, onOpenPdf, currentUser }) {
  const refA = useRef(null);
  const refB = useRef(null);
  const chatEndRef = useRef(null);

  const [pdfA, setPdfA] = useState(null);   // { filename, totalPages, extractedClauses, standardValidation }
  const [pdfB, setPdfB] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [samplePdfs, setSamplePdfs] = useState([]);
  const [registry, setRegistry] = useState([]);

  // Manual fallback state
  const [showManualA, setShowManualA] = useState(false);
  const [manualCodeA, setManualCodeA] = useState('OSHA');
  const [manualVerA, setManualVerA] = useState('2021');
  const [manualUpdatingA, setManualUpdatingA] = useState(false);

  const [showManualB, setShowManualB] = useState(false);
  const [manualCodeB, setManualCodeB] = useState('IBC');
  const [manualVerB, setManualVerB] = useState('2021');
  const [manualUpdatingB, setManualUpdatingB] = useState(false);

  const [chatHistory, setChatHistory] = useState([]);
  const [queryInput, setQueryInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  // Load sample PDF list and Supported Standards Registry from MySQL
  useEffect(() => {
    api.getSamplePdfs().then(r => setSamplePdfs(r.samples || [])).catch(() => {});
    api.getStandardsRegistry().then(r => {
      if (r.registry?.length) {
        setRegistry(r.registry);
      }
    }).catch(() => {});
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleUpload = async (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const setter = slot === 'A' ? setLoadingA : setLoadingB;
    const pdfSetter = slot === 'A' ? setPdfA : setPdfB;
    setter(true);
    try {
      const res = await api.uploadPdf(file, slot);
      pdfSetter(res);
      if (res.standardValidation?.identified?.standardCode) {
        if (slot === 'A') {
          setManualCodeA(res.standardValidation.identified.standardCode);
          setManualVerA(res.standardValidation.identified.version || '2021');
        } else {
          setManualCodeB(res.standardValidation.identified.standardCode);
          setManualVerB(res.standardValidation.identified.version || '2021');
        }
      }
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setter(false);
      e.target.value = '';
    }
  };

  const handleLoadSample = async (filename, slot) => {
    const setter = slot === 'A' ? setLoadingA : setLoadingB;
    const pdfSetter = slot === 'A' ? setPdfA : setPdfB;
    setter(true);
    try {
      const res = await api.loadSamplePdf(filename, slot);
      pdfSetter({ ...res, filename });
      if (res.standardValidation?.identified?.standardCode) {
        if (slot === 'A') {
          setManualCodeA(res.standardValidation.identified.standardCode);
          setManualVerA(res.standardValidation.identified.version || '2021');
        } else {
          setManualCodeB(res.standardValidation.identified.standardCode);
          setManualVerB(res.standardValidation.identified.version || '2021');
        }
      }
    } catch (err) {
      alert('Load failed: ' + err.message);
    } finally {
      setter(false);
    }
  };

  const handleConfirmManualStandard = async (slot) => {
    const isA = slot === 'A';
    const pdf = isA ? pdfA : pdfB;
    const pdfSetter = isA ? setPdfA : setPdfB;
    const code = isA ? manualCodeA : manualCodeB;
    const ver = isA ? manualVerA : manualVerB;
    const setUpdating = isA ? setManualUpdatingA : setManualUpdatingB;

    if (!code) {
      alert('Please select a standard code.');
      return;
    }

    setUpdating(true);
    try {
      const res = await api.confirmStandard({
        filename: pdf?.filename || `document_${slot}.pdf`,
        slot,
        standardCode: code,
        version: ver,
        text: pdf?.fullText || ''
      });
      pdfSetter(prev => ({
        ...prev,
        standardValidation: res
      }));
      if (isA) setShowManualA(false);
      else setShowManualB(false);
    } catch (err) {
      alert('Confirmation failed: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendQuery = async () => {
    const q = queryInput.trim();
    if (!q || isChatLoading) return;
    if (!pdfA || !pdfB) { setChatError('Please upload both Standard A and Standard B PDFs first.'); return; }
    if (!pdfA.extractedClauses?.length || !pdfB.extractedClauses?.length) {
      setChatError('PDFs uploaded but no clauses could be extracted. Try different documents.');
      return;
    }

    setQueryInput('');
    setChatError('');
    setIsChatLoading(true);

    // Add user message immediately
    const userMsg = { type: 'user', text: q, id: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);

    try {
      const result = await api.chatCompare({
        query: q,
        clausesA: pdfA.extractedClauses,
        clausesB: pdfB.extractedClauses,
        filenameA: pdfA.filename,
        filenameB: pdfB.filename,
      });
      const newHistory = [...chatHistory, userMsg, { type: 'result', data: result, id: Date.now() + 1 }];
      setChatHistory(prev => [...prev, { type: 'result', data: result, id: Date.now() }]);

      // Save session to backend
      try {
        const sessionId = `session-${currentUser?.username || 'anon'}-${Date.now()}`;
        const title = q.length > 60 ? q.slice(0, 60) + '…' : q;
        await api.saveChatSession({
          id: sessionId,
          title,
          username: currentUser?.username || 'unknown',
          displayName: currentUser?.displayName || 'Unknown',
          standardA: pdfA.filename,
          standardB: pdfB.filename,
          messages: newHistory
        });
      } catch (_) {}
    } catch (err) {
      setChatHistory(prev => [...prev, { type: 'error', text: err.message, id: Date.now() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const bothReady = pdfA?.extractedClauses?.length > 0 && pdfB?.extractedClauses?.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Employee Dashboard Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.22)',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px',
            flexShrink: 0
          }}>
            <img src="/employee-logo.png" alt="Employee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>Pipeline &amp; PDF Workspace</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Multi-Stage Standards Verification · spaCy NER → Rule Engine → Gemini Guidance
            </p>
          </div>
        </div>
      </div>

      {/* ── SUPPORTED STANDARDS REGISTRY STATUS BAR ──────────────────── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={16} color="#0284c7" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a' }}>
                Supported Standards Registry (MySQL):
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(registry.length > 0 ? registry : [
                  { standard_code: 'OSHA', default_version: '2021', publisher: 'US Dept of Labor' },
                  { standard_code: 'IBC', default_version: '2021', publisher: 'ICC' },
                  { standard_code: 'ISO', default_version: '2016', publisher: 'ISO' },
                  { standard_code: 'ASTM', default_version: '2021', publisher: 'ASTM Int.' },
                  { standard_code: 'NFPA', default_version: '2021', publisher: 'NFPA' },
                  { standard_code: 'ADA', default_version: '2010', publisher: 'US DOJ' }
                ]).map(r => (
                  <span
                    key={r.standard_code}
                    title={`${r.standard_name || r.standard_code} (${r.publisher})`}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#0369a1',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '6px',
                      padding: '2px 7px'
                    }}
                  >
                    {r.standard_code} <span style={{ opacity: 0.75 }}>v{r.default_version}</span>
                  </span>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
              Automatic document identification, publisher verification &amp; version discrepancy gate
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '20px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#065f46' }}>
            Verification Engine Active
          </span>
        </div>
      </div>

      {/* ── DUAL PDF UPLOAD SECTION ───────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {[{ slot: 'A', label: 'Standard A', pdf: pdfA, ref: refA, loading: loadingA, setPdf: setPdfA, color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
          { slot: 'B', label: 'Standard B', pdf: pdfB, ref: refB, loading: loadingB, setPdf: setPdfB, color: '#059669', bg: '#f0fdf4', border: '#bbf7d0' }
        ].map(({ slot, label, pdf, ref, loading, setPdf, color, bg, border }) => {
          const isA = slot === 'A';
          const validation = pdf?.standardValidation || null;
          const badgeStyle = validation ? getValidationBadgeStyle(validation.validationStatus) : null;
          const isManualOpen = isA ? showManualA : showManualB;

          return (
            <div key={slot} style={{ background: '#fff', border: `1px solid ${pdf ? border : '#e2e8f0'}`, borderRadius: '16px', padding: '22px', boxShadow: pdf ? `0 4px 14px rgba(0,0,0,0.05)` : 'none', transition: 'all 0.2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={16} color={color} />
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' }}>{label}</span>
                </div>
                {pdf && (
                  <button onClick={() => setPdf(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', fontWeight: '700' }}>
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>

              {/* Hidden file input */}
              <input ref={ref} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleUpload(e, slot)} />

              {!pdf ? (
                <>
                  {/* Upload zone */}
                  <div onClick={() => ref.current?.click()} style={{
                    border: `2px dashed ${color}`, borderRadius: '12px', padding: '28px 20px', textAlign: 'center',
                    background: bg, cursor: 'pointer', transition: 'all 0.2s ease', marginBottom: '12px'
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    {loading ? (
                      <p style={{ fontSize: '0.86rem', fontWeight: '700', color }}>Processing PDF &amp; Verifying Standard...</p>
                    ) : (
                      <>
                        <Upload size={26} color={color} style={{ margin: '0 auto 8px' }} />
                        <p style={{ fontSize: '0.86rem', fontWeight: '800', color, marginBottom: '4px' }}>Click to Upload PDF</p>
                        <p style={{ fontSize: '0.74rem', color: '#64748b' }}>Or load a sample below</p>
                      </>
                    )}
                  </div>

                  {/* Sample PDFs quick-load */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {samplePdfs.map(s => (
                      <button key={s.filename} onClick={() => handleLoadSample(s.filename, slot)}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 12px', textAlign: 'left', cursor: 'pointer', fontSize: '0.76rem', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.color = color; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}>
                        <span>{s.filename.replace('.pdf', '').replace(/_/g, ' ')}</span>
                        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{(s.sizeBytes / 1024).toFixed(1)} KB</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                /* Loaded PDF summary & Standard Validation Section */
                <div>
                  <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '12px 14px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
                      <CheckCircle2 size={15} color={color} />
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', color }}>PDF Loaded &amp; Extracted</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>{pdf.filename}</p>
                    <p style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {pdf.totalPages} pages · {pdf.extractedClauses?.length || 0} clauses extracted
                    </p>
                  </div>

                  {/* ── STANDARD IDENTIFICATION & VERSION VALIDATION ── */}
                  {validation && (
                    <div style={{
                      background: '#ffffff',
                      border: `1px solid ${badgeStyle?.border || '#e2e8f0'}`,
                      borderRadius: '12px',
                      padding: '12px 14px',
                      marginBottom: '14px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}>
                      {/* Top Bar: Standard Code Badge + Status Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: '900',
                            letterSpacing: '0.04em',
                            background: color,
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}>
                            {validation.identified?.standardCode || 'STANDARD'}
                          </span>
                          <span style={{ fontSize: '0.74rem', fontWeight: '800', color: '#0f172a' }}>
                            v{validation.identified?.version || 'Default'}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: '800',
                          color: badgeStyle?.color,
                          background: badgeStyle?.bg,
                          border: `1px solid ${badgeStyle?.border}`,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span>{badgeStyle?.icon}</span>
                          <span>{validation.validationStatus}</span>
                        </span>
                      </div>

                      {/* Document Standard Details */}
                      <div style={{ fontSize: '0.73rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ color: '#0f172a' }}>Standard: </strong>
                          <span>{validation.identified?.standardName || pdf.filename}</span>
                        </div>
                        <div>
                          <strong style={{ color: '#0f172a' }}>Doc ID: </strong>
                          <span style={{ fontFamily: 'monospace', color: '#0369a1' }}>
                            {validation.identified?.identifier || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <strong style={{ color: '#0f172a' }}>Publisher: </strong>
                          <span style={{ color: '#475569' }}>
                            {validation.identified?.publisher || 'N/A'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                          <span style={{ color: '#64748b', fontSize: '0.69rem' }}>
                            Method: {validation.identified?.detectionMethod || 'Automated Analysis'}
                          </span>
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: '700',
                            color: '#059669',
                            background: '#ecfdf5',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            {Math.round((validation.identified?.confidence || 0.9) * 100)}% Confidence
                          </span>
                        </div>
                      </div>

                      {/* Status Description */}
                      <div style={{
                        fontSize: '0.71rem',
                        color: '#475569',
                        background: '#f8fafc',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        borderLeft: `3px solid ${badgeStyle?.color || '#0284c7'}`,
                        marginBottom: '8px'
                      }}>
                        {validation.statusDescription}
                      </div>

                      {/* Authenticity Warning Box (Shown when unverified, manual override, or warning present) */}
                      {(validation.warning || validation.isManualOverride || !validation.isVerified) && (
                        <div style={{
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          borderRadius: '8px',
                          padding: '7px 9px',
                          fontSize: '0.7rem',
                          color: '#92400e',
                          lineHeight: '1.35',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '6px'
                        }}>
                          <AlertTriangle size={14} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong>Authenticity Notice: </strong>
                            {validation.warning || '⚠ Authenticity has not been independently verified against official publisher registry. Proceeding under user-confirmed standard specification.'}
                          </div>
                        </div>
                      )}

                      {/* Manual Fallback Toggle Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => isA ? setShowManualA(!showManualA) : setShowManualB(!showManualB)}
                          style={{
                            background: 'none',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '3px 9px',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = color}
                          onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                        >
                          <Sliders size={12} />
                          {isManualOpen ? 'Close Manual Fallback' : 'Manual Fallback / Override'}
                        </button>
                      </div>

                      {/* Manual Fallback Selection Panel */}
                      {isManualOpen && (
                        <div style={{
                          marginTop: '10px',
                          padding: '10px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                            Manual Standard &amp; Version Selection (Fallback)
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', color: '#475569', marginBottom: '3px' }}>
                                Standard Type
                              </label>
                              <select
                                value={isA ? manualCodeA : manualCodeB}
                                onChange={e => {
                                  const code = e.target.value;
                                  if (isA) {
                                    setManualCodeA(code);
                                    const reg = registry.find(r => r.standard_code === code);
                                    if (reg?.default_version) setManualVerA(reg.default_version);
                                  } else {
                                    setManualCodeB(code);
                                    const reg = registry.find(r => r.standard_code === code);
                                    if (reg?.default_version) setManualVerB(reg.default_version);
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  background: '#ffffff'
                                }}
                              >
                                {registry.map(r => (
                                  <option key={r.standard_code} value={r.standard_code}>
                                    {r.standard_code} ({r.standard_name?.slice(0, 24)}…)
                                  </option>
                                ))}
                                <option value="CUSTOM">Custom / Unregistered Standard</option>
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: '700', color: '#475569', marginBottom: '3px' }}>
                                Version / Edition
                              </label>
                              {(() => {
                                const currentCode = isA ? manualCodeA : manualCodeB;
                                const reg = registry.find(r => r.standard_code === currentCode);
                                const versions = reg?.verified_versions || ['2024', '2021', '2019', '2018', '2016', '2015', '2010'];
                                return (
                                  <select
                                    value={isA ? manualVerA : manualVerB}
                                    onChange={e => isA ? setManualVerA(e.target.value) : setManualVerB(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #cbd5e1',
                                      fontSize: '0.72rem',
                                      fontWeight: '700',
                                      background: '#ffffff'
                                    }}
                                  >
                                    {versions.map(v => (
                                      <option key={v} value={v}>Edition {v}</option>
                                    ))}
                                    <option value="Custom">Custom Edition</option>
                                  </select>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Explicit Mandatory Warning Text */}
                          <div style={{
                            background: '#fff1f2',
                            border: '1px solid #fecdd3',
                            borderRadius: '6px',
                            padding: '6px 8px',
                            fontSize: '0.68rem',
                            color: '#9f1239',
                            lineHeight: '1.3',
                            marginBottom: '8px'
                          }}>
                            ⚠ Authenticity has not been independently verified against official publisher registry. Proceeding under user-confirmed standard specification.
                          </div>

                          <button
                            onClick={() => handleConfirmManualStandard(slot)}
                            disabled={isA ? manualUpdatingA : manualUpdatingB}
                            style={{
                              width: '100%',
                              background: color,
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.74rem',
                              fontWeight: '800',
                              cursor: 'pointer'
                            }}
                          >
                            {(isA ? manualUpdatingA : manualUpdatingB) ? 'Saving Specification…' : 'Confirm Standard & Version'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Extracted clauses preview — clean static display */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(pdf.extractedClauses || []).slice(0, 3).map((c, i) => (
                      <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 10px' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: '800', color, display: 'block', marginBottom: '2px' }}>{c.citation}</span>
                        <p style={{ fontSize: '0.74rem', color: '#334155', lineHeight: '1.4' }}>{c.text?.slice(0, 100)}…</p>
                      </div>
                    ))}
                    {(pdf.extractedClauses?.length || 0) > 3 && (
                      <p style={{ fontSize: '0.72rem', color: '#64748b', textAlign: 'center', padding: '4px', background: '#f8fafc', borderRadius: '6px' }}>
                        +{pdf.extractedClauses.length - 3} more clauses extracted &amp; indexed
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── CHAT / QUERY SECTION ─────────────────────────────────────── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '22px 26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <MessageCircle size={18} color="#0284c7" />
          <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a' }}>Query the Standards</h3>
          {bothReady ? (
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '2px 9px', borderRadius: '6px' }}>
              Both standards ready
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 9px', borderRadius: '6px' }}>
              Upload both PDFs to start
            </span>
          )}
        </div>

        {/* Chat history — static plain flow, no inner scrollbar */}
        {chatHistory.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '18px' }}>
            {chatHistory.map(msg => (
              <div key={msg.id}>
                {msg.type === 'user' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff', borderRadius: '14px 14px 4px 14px', padding: '10px 16px', maxWidth: '70%', fontSize: '0.88rem', fontWeight: '600', lineHeight: '1.5' }}>
                      {msg.text}
                    </div>
                  </div>
                )}

                {msg.type === 'error' && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 16px', fontSize: '0.84rem', color: '#b91c1c', fontWeight: '600' }}>
                    ⚠ {msg.text}
                  </div>
                )}

                {msg.type === 'result' && <ChatResult data={msg.data} onOpenPdf={onOpenPdf} />}
              </div>
            ))}
            {isChatLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <span style={{ width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTopColor: '#0284c7', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: '600' }}>
                  Running spaCy NER → Rule Engine → Gemini…
                </span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {chatError && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '9px 14px', fontSize: '0.8rem', color: '#b45309', fontWeight: '700', marginBottom: '12px' }}>
            {chatError}
          </div>
        )}

        {!bothReady && chatHistory.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
            <MessageCircle size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <p style={{ fontSize: '0.86rem', fontWeight: '600' }}>Upload both Standard A and Standard B PDFs to start querying</p>
            <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>e.g. "What is the maximum riser height?" or "Is clearance X consistent?"</p>
          </div>
        )}

        {/* Query input */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <textarea
            value={queryInput}
            onChange={e => setQueryInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendQuery(); } }}
            placeholder={bothReady ? 'Ask a query about the uploaded standards… (e.g. "What is the max riser height?")' : 'Upload both PDFs above first…'}
            disabled={!bothReady || isChatLoading}
            rows={2}
            style={{
              flex: 1, padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: '12px',
              fontSize: '0.88rem', color: '#0f172a', fontFamily: 'inherit', resize: 'none',
              outline: 'none', background: bothReady ? '#ffffff' : '#f8fafc',
              lineHeight: '1.5', transition: 'border-color 0.2s ease'
            }}
            onFocus={e => { e.target.style.borderColor = '#0284c7'; e.target.style.boxShadow = '0 0 0 3px rgba(2,132,199,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          />
          <button
            onClick={handleSendQuery}
            disabled={!bothReady || isChatLoading || !queryInput.trim()}
            style={{
              padding: '12px 20px', borderRadius: '12px',
              background: (!bothReady || isChatLoading || !queryInput.trim()) ? '#e2e8f0' : 'linear-gradient(135deg, #0284c7, #2563eb)',
              color: (!bothReady || isChatLoading || !queryInput.trim()) ? '#94a3b8' : '#ffffff',
              border: 'none', cursor: (!bothReady || isChatLoading || !queryInput.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px', fontWeight: '800', fontSize: '0.86rem',
              boxShadow: (!bothReady || isChatLoading || !queryInput.trim()) ? 'none' : '0 4px 12px rgba(2,132,199,0.25)',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap'
            }}>
            <Send size={15} /> Compare
          </button>
        </div>
        <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '8px' }}>Press Enter to send · Shift+Enter for new line</p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Compact Chat Result ────────────────────────────────────────────────────
function ChatResult({ data, onOpenPdf }) {
  const [expanded, setExpanded] = useState(true);

  if (!data.found) {
    return (
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '4px solid #d97706', borderRadius: '12px', padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '4px' }}>
          <AlertTriangle size={14} color="#d97706" />
          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#b45309' }}>No Match — Flagged for Human Review</span>
        </div>
        <p style={{ fontSize: '0.78rem', color: '#78350f', lineHeight: '1.5' }}>{data.answer}</p>
      </div>
    );
  }

  // Helper: first sentence of guidance only
  const firstSentence = (text = '') => {
    const m = text.match(/^[^.!?]+[.!?]/);
    return m ? m[0].trim() : text.slice(0, 120) + (text.length > 120 ? '…' : '');
  };

  // Helper: format extracted NER entities as compact chips
  const fmtEntities = (entities = []) => {
    if (!entities.length) return 'No numeric parameter extracted';
    return entities.slice(0, 2).map(e => {
      const cond = e.condition && e.condition !== 'qualitative/vague' ? `${e.condition} ` : '';
      const val = e.value !== null && e.value !== undefined ? `${e.value}` : '?';
      const unit = e.unit && e.unit !== 'N/A' ? ` ${e.unit}` : '';
      return `${e.parameter}: ${cond}${val}${unit}`;
    }).join(' · ');
  };

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{ padding: '12px 16px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#0f172a' }}>
            {data.standardA} vs {data.standardB}
          </span>
          <SummaryBadges summary={data.summary} />
        </div>
        <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.74rem', color: '#94a3b8', fontWeight: '700' }}>
          {expanded ? '▲ Hide' : '▼ Show'}
        </button>
      </div>

      {expanded && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Stage 1: NER parameters (compact) */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <Cpu size={13} color="#0284c7" />
              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Stage 1 — NER Extracted Parameters
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { std: data.standardA, doc: data.matchedClauseA, entities: data.extractedA, color: '#0284c7', bg: '#f0f9ff' },
                { std: data.standardB, doc: data.matchedClauseB, entities: data.extractedB, color: '#059669', bg: '#f0fdf4' }
              ].map(({ std, doc, entities, color, bg }) => (
                <div key={std} style={{ background: bg, borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color, textTransform: 'uppercase' }}>{std}</span>
                    {onOpenPdf && doc?.citation && (
                      <button onClick={() => onOpenPdf(doc.citation, doc.text || '', std, 1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.68rem', color, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <BookOpen size={10} /> {doc.citation.split('(')[1]?.replace(')', '') || 'View'}
                      </button>
                    )}
                  </div>
                  {/* NER params as chips */}
                  <p style={{ fontSize: '0.76rem', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                    {fmtEntities(entities)}
                  </p>
                  <span style={{ fontSize: '0.66rem', color: '#64748b' }}>{doc?.citation}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stage 2 & 3: Explainable Decision Breakdown per comparison */}
          {(data.comparisons || []).map(comp => (
            <ExplainableDecisionBreakdown
              key={comp.id}
              comp={comp}
              standardA={data.standardA}
              standardB={data.standardB}
              data={data}
              compact={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryBadges({ summary = {} }) {
  const items = [
    { label: 'Consistent', count: summary.consistent, color: '#047857', bg: '#ecfdf5' },
    { label: 'Conflict', count: summary.conflicts, color: '#b91c1c', bg: '#fef2f2' },
    { label: 'Gap', count: summary.gaps, color: '#b45309', bg: '#fffbeb' },
    { label: 'Review', count: summary.flaggedForReview, color: '#6d28d9', bg: '#f5f3ff' },
  ].filter(i => i.count > 0);

  return (
    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
      {items.map(i => (
        <span key={i.label} style={{ background: i.bg, color: i.color, padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '800' }}>
          {i.count} {i.label}
        </span>
      ))}
    </div>
  );
}

