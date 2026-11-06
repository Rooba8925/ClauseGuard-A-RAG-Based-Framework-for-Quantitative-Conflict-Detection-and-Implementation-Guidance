import React from 'react';
import { Shield, CheckCircle2, GitCompare, Database, Layers, Sparkles, LogOut, UserCircle, MessageSquare, LayoutDashboard } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, showResultsTab = false, currentUser, onLogout }) {
  const isAdmin = currentUser?.role === 'admin';

  const AdminNavIcon = () => (
    <img src="/admin-logo.png" alt="Admin" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
  );

  const navItems = isAdmin
    ? [
        { id: 'compare', label: 'Admin Dashboard', icon: AdminNavIcon },
      ]
    : [
        { id: 'compare', label: 'Pipeline & PDF Workspace', icon: GitCompare },
        ...(showResultsTab ? [{ id: 'results', label: 'Results', icon: Sparkles }] : []),
        { id: 'taxonomy', label: 'Decision Taxonomy', icon: Layers },
        { id: 'benchmark', label: 'Standards Benchmark', icon: CheckCircle2, badge: '95.8% Match' },
        { id: 'history', label: 'Chat History', icon: MessageSquare }
      ];

  return (
    <header style={{
      borderBottom: '1px solid #e2e8f0',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '14px 32px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        {/* Brand & System Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
            border: '1px solid rgba(2, 132, 199, 0.15)',
            flexShrink: 0
          }}>
            <img src="/clauseguard-icon.png" alt="ClauseGuard" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#0f172a' }}>
                ClauseGuard
              </h1>
              <span style={{
                background: '#eff6ff',
                color: '#0284c7',
                border: '1px solid #bae6fd',
                padding: '2px 10px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: '700',
                letterSpacing: '0.03em'
              }}>
                Standards Verification System
              </span>
            </div>

          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  background: isActive ? '#f0f9ff' : 'transparent',
                  color: isActive ? '#0284c7' : '#475569',
                  border: isActive ? '1px solid #bae6fd' : '1px solid transparent',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontSize: '0.86rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} color={isActive ? '#0284c7' : '#64748b'} />
                <span>{item.label}</span>
                {item.badge && (
                  <span style={{
                    background: '#ecfdf5',
                    color: '#047857',
                    border: '1px solid #a7f3d0',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: '800'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '6px 12px'
            }}>
              {currentUser.role === 'admin' ? (
                <img src="/admin-logo.png" alt="Admin" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
              ) : (
                <img src="/employee-logo.png" alt="Employee" style={{ width: '22px', height: '22px', objectFit: 'contain', borderRadius: '4px' }} />
              )}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0f172a', display: 'block', lineHeight: '1.2' }}>
                  {currentUser.displayName}
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  color: currentUser.role === 'admin' ? '#0284c7' : '#059669',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {currentUser.roleLabel}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                color: '#be123c',
                padding: '7px 12px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffe4e6'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff1f2'; }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
