import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import ComparisonWorkspace from './components/ComparisonWorkspace';
import ResultsView from './components/ResultsView';
import BenchmarkView from './components/BenchmarkView';
import ChatHistoryView from './components/ChatHistoryView';
import AdminDashboard from './components/AdminDashboard';
import TaxonomyView from './components/TaxonomyView';
import ReviewModal from './components/ReviewModal';
import PdfViewerModal from './components/PdfViewerModal';
import { api } from './services/api';

// Route mapper helper
const getTabFromHash = () => {
  const hash = (window.location.hash || '').replace('#/', '').replace('#', '').trim();
  if (hash === 'results') return 'results';
  if (hash === 'taxonomy') return 'taxonomy';
  if (hash === 'benchmark') return 'benchmark';
  if (hash === 'history') return 'history';
  return 'compare';
};

// ─── Authenticated App Shell (all hooks here, no early returns) ─────────────
function AppShell({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [showResultsTab, setShowResultsTab] = useState(false);
  const [clauses, setClauses] = useState([]);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [pdfModalState, setPdfModalState] = useState({
    isOpen: false,
    citation: '',
    filename: '',
    initialPage: 1,
    snippet: ''
  });

  const handleOpenPdf = (citation, snippet = '', filename = '', page = 1) => {
    setPdfModalState({ isOpen: true, citation, snippet, filename, initialPage: page });
  };

  const updateDocTitle = (tab) => {
    const titles = {
      results: 'Comparison Results | ClauseGuard',
      taxonomy: 'Decision Taxonomy | ClauseGuard',
      benchmark: 'Standards Benchmark | ClauseGuard',
      clauses: 'Clause Store | ClauseGuard',
    };
    document.title = titles[tab] || 'Pipeline & PDF Workspace | ClauseGuard';
  };

  // Synchronize browser history and Back/Forward buttons
  useEffect(() => {
    const handleLocationChange = () => {
      const tab = getTabFromHash();
      setActiveTab(tab);
      if (tab === 'results') setShowResultsTab(true);
      else if (tab === 'compare') setShowResultsTab(false);
      updateDocTitle(tab);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    const initialTab = getTabFromHash();
    if (initialTab === 'results') setShowResultsTab(true);
    updateDocTitle(initialTab);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    async function loadInitial() {
      try {
        const [clauseRes, benchRes, revRes] = await Promise.all([
          api.getClauses(),
          api.getBenchmark(),
          api.getReviews()
        ]);
        setClauses(clauseRes.clauses || []);
        setBenchmarkData(benchRes);
        setReviews(revRes.reviews || []);

        if (clauseRes.clauses?.length >= 2) {
          const defaultA = clauseRes.clauses.find(c => c.id === 'osha_riser_max') || clauseRes.clauses[0];
          const defaultB = clauseRes.clauses.find(c => c.id === 'ibc_riser') || clauseRes.clauses[1];
          const initialComp = await api.compareClauses(
            { ...defaultA, citation: 'OSHA_1910_Stairs_Standard.pdf (Page 2)' },
            { ...defaultB, citation: 'IBC_2021_Stairways_Standard.pdf (Page 2)' }
          );
          setComparisonData(initialComp);
        }
      } catch (err) {
        console.error('Initial load error:', err);
      }
    }
    loadInitial();
  }, []);

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;
    if (tabId === 'results') setShowResultsTab(true);
    else if (tabId === 'compare') setShowResultsTab(false);
    window.history.pushState({ tab: tabId }, '', `#/${tabId}`);
    setActiveTab(tabId);
    updateDocTitle(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    setShowResultsTab(false);
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleTabChange('compare');
    }
  };

  const handleRunComparison = async (clauseA, clauseB, navigateToResults = false) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.compareClauses(clauseA, clauseB);
      setComparisonData(data);
      if (navigateToResults) {
        setShowResultsTab(true);
        window.history.pushState({ tab: 'results' }, '', '#/results');
        setActiveTab('results');
        updateDocTitle('results');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Comparison failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (reviewPayload) => {
    try {
      const res = await api.submitReview(reviewPayload);
      if (res.record) {
        setReviews(prev => [res.record, ...prev]);
        const benchRes = await api.getBenchmark();
        setBenchmarkData(benchRes);
      }
    } catch (err) {
      console.error('Review submission error:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        showResultsTab={showResultsTab}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      <main style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '24px 32px', flex: 1 }}>
        {/* Back button for secondary pages */}
        {activeTab !== 'compare' && activeTab !== 'taxonomy' && activeTab !== 'results' && activeTab !== 'history' && (
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={handleGoBack}
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
              Back to Pipeline &amp; PDF Workspace
            </button>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
              Page: Standards Benchmark
            </span>
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            padding: '14px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            {errorMsg}
          </div>
        )}

        {activeTab === 'compare' && currentUser?.role !== 'admin' && (
          <ComparisonWorkspace
            clauses={clauses}
            onRunComparison={handleRunComparison}
            isLoading={isLoading}
            onOpenPdf={handleOpenPdf}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'compare' && currentUser?.role === 'admin' && (
          <AdminDashboard />
        )}

        {activeTab === 'results' && (
          <ResultsView
            comparisonData={comparisonData}
            onBack={handleGoBack}
            onOpenReview={(item) => setReviewingItem(item)}
            onOpenPdf={handleOpenPdf}
          />
        )}

        {activeTab === 'taxonomy' && (
          <TaxonomyView onBack={handleGoBack} />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkView
            benchmarkData={benchmarkData}
            isLoading={isLoading}
            onRefresh={async () => {
              const b = await api.getBenchmark();
              setBenchmarkData(b);
            }}
            onOpenPdf={handleOpenPdf}
          />
        )}

        {activeTab === 'history' && (
          <ChatHistoryView currentUser={currentUser} />
        )}
      </main>

      {reviewingItem && (
        <ReviewModal
          item={reviewingItem}
          onClose={() => setReviewingItem(null)}
          onSubmitReview={handleSubmitReview}
        />
      )}

      {pdfModalState.isOpen && (
        <PdfViewerModal
          isOpen={pdfModalState.isOpen}
          onClose={() => setPdfModalState(prev => ({ ...prev, isOpen: false }))}
          citation={pdfModalState.citation}
          filename={pdfModalState.filename}
          initialPage={pdfModalState.initialPage}
          snippet={pdfModalState.snippet}
        />
      )}
    </div>
  );
}

// ─── Root App: only manages auth state ──────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('cg_user')) || null; } catch { return null; }
  });

  const handleLogin = (user) => {
    sessionStorage.setItem('cg_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cg_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AppShell currentUser={currentUser} onLogout={handleLogout} />;
}
