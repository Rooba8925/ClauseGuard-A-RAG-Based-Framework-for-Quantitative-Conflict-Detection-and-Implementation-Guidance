import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Download, FileText, ChevronLeft, ChevronRight, BookOpen, CheckCircle2 } from 'lucide-react';

export default function PdfViewerModal({ isOpen, onClose, citation, filename: propFilename, initialPage: propPage, snippet }) {
  if (!isOpen) return null;

  // Resolve filename from citation if not explicitly passed
  let resolvedFilename = propFilename || "";
  let resolvedPage = propPage || 1;

  if (citation) {
    // Check for explicit .pdf filename
    const pdfMatch = citation.match(/([a-zA-Z0-9_-]+\.pdf)/i);
    if (pdfMatch) {
      resolvedFilename = pdfMatch[1];
    } else if (/osha/i.test(citation)) {
      resolvedFilename = "OSHA_1910_Stairs_Standard.pdf";
    } else if (/ibc/i.test(citation)) {
      resolvedFilename = "IBC_2021_Stairways_Standard.pdf";
    } else if (/standard a|std-a/i.test(citation)) {
      resolvedFilename = "Special_Enclosure_Standard_A.pdf";
    } else if (/standard b|std-b/i.test(citation)) {
      resolvedFilename = "Special_Enclosure_Standard_B.pdf";
    }

    // Check for page number: e.g. "Page 2" or "(Page 2)"
    const pageMatch = citation.match(/page\s*(\d+)/i);
    if (pageMatch) {
      resolvedPage = parseInt(pageMatch[1], 10);
    }
  }

  // Default fallback if still unresolved
  if (!resolvedFilename) {
    resolvedFilename = "OSHA_1910_Stairs_Standard.pdf";
  }

  const [currentPage, setCurrentPage] = useState(resolvedPage);

  useEffect(() => {
    setCurrentPage(resolvedPage);
  }, [resolvedPage, resolvedFilename]);

  const pdfUrl = `http://localhost:5000/api/pdf/${resolvedFilename}#page=${currentPage}`;
  const directPdfUrl = `http://localhost:5000/api/pdf/${resolvedFilename}`;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '24px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        width: '100%',
        maxWidth: '1050px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 1px 1px rgba(226, 232, 240, 0.8)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb'
            }}>
              <BookOpen size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                  {resolvedFilename.replace(/_/g, ' ').replace('.pdf', '')}
                </h3>
                <span style={{
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  Page {currentPage}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                Citation Source: <strong>{citation || resolvedFilename}</strong>
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '2px 8px'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#1e293b' }}>
                Page {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <a
              href={directPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              <ExternalLink size={14} />
              Open Tab
            </a>

            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Clause Snippet Highlight Banner */}
        {snippet && (
          <div style={{
            background: '#f0fdf4',
            borderBottom: '1px solid #bbf7d0',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <CheckCircle2 size={16} color="#16a34a" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cited Excerpt Highlight (Page {currentPage}):
              </p>
              <p style={{ fontSize: '0.84rem', color: '#166534', fontStyle: 'italic', marginTop: '2px', lineHeight: '1.4' }}>
                "{snippet}"
              </p>
            </div>
          </div>
        )}

        {/* PDF Frame Viewer */}
        <div style={{ flex: 1, height: '620px', background: '#e2e8f0', position: 'relative' }}>
          <iframe
            key={`${resolvedFilename}-${currentPage}`}
            src={pdfUrl}
            title={resolvedFilename}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#ffffff'
            }}
          />
        </div>

        {/* Footer info bar */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.76rem',
          color: '#64748b'
        }}>
          <span>
            Verifying engineering standards clause context at cited page: <strong>Page {currentPage}</strong>
          </span>
          <button
            onClick={() => setCurrentPage(resolvedPage)}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.76rem'
            }}
          >
            Reset to Cited Page ({resolvedPage})
          </button>
        </div>
      </div>
    </div>
  );
}
